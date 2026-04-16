'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const pool     = require('../db/pool');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} = require('../utils/jwt');
const { ok, fail } = require('../utils/response');

const router = express.Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required.'),
    body('lastName').trim().notEmpty().withMessage('Last name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      const [[existing]] = await pool.query(
        'SELECT id FROM users WHERE email = ?', [email]
      );
      if (existing) return fail(res, 'An account with that email already exists.', 409);

      const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
      const id   = uuidv4();

      await pool.query(
        `INSERT INTO users (id, first_name, last_name, email, password_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [id, firstName, lastName, email, hash]
      );

      const user         = { id, email, role: 'customer' };
      const accessToken  = signAccessToken(user);
      const rawRefresh   = signRefreshToken();
      await saveRefreshToken(id, rawRefresh);

      return ok(res, {
        message: 'Account created successfully.',
        accessToken,
        refreshToken: rawRefresh,
        user: { id, firstName, lastName, email, role: 'customer' },
      }, 201);
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const [[user]] = await pool.query(
        'SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = ?',
        [email]
      );
      if (!user) return fail(res, 'Invalid email or password.', 401);

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return fail(res, 'Invalid email or password.', 401);

      const payload      = { id: user.id, email: user.email, role: user.role };
      const accessToken  = signAccessToken(payload);
      const rawRefresh   = signRefreshToken();
      await saveRefreshToken(user.id, rawRefresh);

      return ok(res, {
        message: 'Login successful.',
        accessToken,
        refreshToken: rawRefresh,
        user: {
          id:        user.id,
          firstName: user.first_name,
          lastName:  user.last_name,
          email:     user.email,
          role:      user.role,
        },
      });
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return fail(res, 'Refresh token required.', 400);

    const tokens = await rotateRefreshToken(refreshToken);
    if (!tokens) return fail(res, 'Invalid or expired refresh token.', 401);

    return ok(res, tokens);
  } catch (err) { next(err); }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    return ok(res, { message: 'Logged out successfully.' });
  } catch (err) { next(err); }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return fail(res, 'User not found.', 404);

    return ok(res, {
      user: {
        id:        user.id,
        firstName: user.first_name,
        lastName:  user.last_name,
        email:     user.email,
        role:      user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) { next(err); }
});

// ── PATCH /api/auth/me ────────────────────────────────────────────────────────
router.patch(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email } = req.body;
      const fields = [];
      const values = [];

      if (firstName) { fields.push('first_name = ?'); values.push(firstName); }
      if (lastName)  { fields.push('last_name = ?');  values.push(lastName);  }
      if (email)     { fields.push('email = ?');      values.push(email);     }

      if (!fields.length) return fail(res, 'No fields to update.');

      values.push(req.user.id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

      return ok(res, { message: 'Profile updated.' });
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/change-password ────────────────────────────────────────────
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/[A-Z]/)
      .matches(/[0-9]/),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const [[user]] = await pool.query(
        'SELECT password_hash FROM users WHERE id = ?', [req.user.id]
      );
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) return fail(res, 'Current password is incorrect.', 401);

      const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS) || 12);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

      return ok(res, { message: 'Password changed successfully.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
