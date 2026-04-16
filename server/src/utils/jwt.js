'use strict';

const jwt  = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const pool = require('../db/pool');

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function signRefreshToken() {
  // Opaque random token — we store a hash in DB
  return crypto.randomBytes(64).toString('hex');
}

async function saveRefreshToken(userId, rawToken) {
  const hash      = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [uuidv4(), userId, hash, expiresAt]
  );
  return hash;
}

async function rotateRefreshToken(rawToken) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const [[row]] = await pool.query(
    `SELECT rt.*, u.id as uid, u.email, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ? AND rt.expires_at > NOW()`,
    [hash]
  );
  if (!row) return null;

  // Delete old token (rotation)
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [hash]);

  const newRaw = signRefreshToken();
  await saveRefreshToken(row.uid, newRaw);

  return {
    accessToken:  signAccessToken({ id: row.uid, email: row.email, role: row.role }),
    refreshToken: newRaw,
  };
}

async function revokeRefreshToken(rawToken) {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [hash]);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
};
