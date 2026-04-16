'use strict';

/**
 * Cart API
 *
 * Strategy:
 *  - Authenticated users  → cart keyed by user_id
 *  - Guest users          → cart keyed by session_id (sent as X-Session-Id header)
 *
 * The frontend can pass X-Session-Id for guests and merge on login.
 */

const express  = require('express');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const pool     = require('../db/pool');
const validate = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();

// ── Helper: resolve or create cart ───────────────────────────────────────────
async function resolveCart(req) {
  const userId    = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;

  if (!userId && !sessionId) return null;

  let [[cart]] = userId
    ? await pool.query('SELECT * FROM carts WHERE user_id = ?', [userId])
    : await pool.query('SELECT * FROM carts WHERE session_id = ?', [sessionId]);

  if (!cart) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO carts (id, user_id, session_id) VALUES (?, ?, ?)',
      [id, userId, sessionId]
    );
    [[cart]] = await pool.query('SELECT * FROM carts WHERE id = ?', [id]);
  }

  return cart;
}

// ── Helper: build cart response ───────────────────────────────────────────────
async function buildCartResponse(cartId) {
  const [items] = await pool.query(
    `SELECT
       ci.id, ci.quantity, ci.size,
       p.id AS productId, p.name, p.slug, p.price, p.badge,
       c.name AS category,
       (SELECT url FROM product_images WHERE product_id = p.id AND sort_order = 0 LIMIT 1) AS image
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN categories c ON c.id = p.category_id
     WHERE ci.cart_id = ?`,
    [cartId]
  );

  const mapped = items.map((i) => ({
    id:        i.id,
    quantity:  i.quantity,
    size:      i.size,
    productId: i.productId,
    name:      i.name,
    slug:      i.slug,
    price:     Number(i.price),
    badge:     i.badge,
    category:  i.category,
    image:     i.image,
    // Frontend-compatible shape
    images:    [i.image],
  }));

  const subtotal = mapped.reduce((s, i) => s + i.price * i.quantity, 0);
  const count    = mapped.reduce((s, i) => s + i.quantity, 0);

  return { items: mapped, subtotal, count };
}

// ── GET /api/cart ─────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const cart = await resolveCart(req);
    if (!cart) return ok(res, { items: [], subtotal: 0, count: 0 });

    const data = await buildCartResponse(cart.id);
    return ok(res, data);
  } catch (err) { next(err); }
});

// ── POST /api/cart/items ──────────────────────────────────────────────────────
router.post(
  '/items',
  optionalAuth,
  [
    body('productId').isInt({ min: 1 }).toInt(),
    body('quantity').optional().isInt({ min: 1, max: 99 }).toInt(),
    body('size').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { productId, quantity = 1, size = null } = req.body;

      // Verify product exists and has stock
      const [[product]] = await pool.query(
        'SELECT id, stock FROM products WHERE id = ? AND is_active = 1',
        [productId]
      );
      if (!product) return fail(res, 'Product not found.', 404);
      if (product.stock < quantity) return fail(res, 'Insufficient stock.', 409);

      const cart = await resolveCart(req);
      if (!cart) return fail(res, 'Session ID or authentication required.', 400);

      // Upsert cart item
      const [[existing]] = await pool.query(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL))',
        [cart.id, productId, size, size]
      );

      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) return fail(res, 'Insufficient stock.', 409);
        await pool.query(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [newQty, existing.id]
        );
      } else {
        await pool.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity, size) VALUES (?, ?, ?, ?)',
          [cart.id, productId, quantity, size]
        );
      }

      // Touch cart updated_at
      await pool.query('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cart.id]);

      const data = await buildCartResponse(cart.id);
      return ok(res, data, 201);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/cart/items/:itemId ─────────────────────────────────────────────
router.patch(
  '/items/:itemId',
  optionalAuth,
  [body('quantity').isInt({ min: 1, max: 99 }).toInt()],
  validate,
  async (req, res, next) => {
    try {
      const { quantity } = req.body;
      const cart = await resolveCart(req);
      if (!cart) return fail(res, 'Cart not found.', 404);

      const [[item]] = await pool.query(
        'SELECT ci.id, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.cart_id = ?',
        [req.params.itemId, cart.id]
      );
      if (!item) return fail(res, 'Cart item not found.', 404);
      if (quantity > item.stock) return fail(res, 'Insufficient stock.', 409);

      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, item.id]);
      await pool.query('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cart.id]);

      const data = await buildCartResponse(cart.id);
      return ok(res, data);
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/cart/items/:itemId ────────────────────────────────────────────
router.delete('/items/:itemId', optionalAuth, async (req, res, next) => {
  try {
    const cart = await resolveCart(req);
    if (!cart) return fail(res, 'Cart not found.', 404);

    await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
      [req.params.itemId, cart.id]
    );
    await pool.query('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cart.id]);

    const data = await buildCartResponse(cart.id);
    return ok(res, data);
  } catch (err) { next(err); }
});

// ── DELETE /api/cart ──────────────────────────────────────────────────────────
router.delete('/', optionalAuth, async (req, res, next) => {
  try {
    const cart = await resolveCart(req);
    if (cart) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
      await pool.query('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cart.id]);
    }
    return ok(res, { items: [], subtotal: 0, count: 0 });
  } catch (err) { next(err); }
});

// ── POST /api/cart/merge ──────────────────────────────────────────────────────
// Merges a guest cart into the authenticated user's cart (call after login)
router.post('/merge', optionalAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!req.user || !sessionId) return fail(res, 'Authentication and sessionId required.', 400);

    const [[guestCart]] = await pool.query(
      'SELECT * FROM carts WHERE session_id = ?', [sessionId]
    );
    if (!guestCart) return ok(res, { message: 'Nothing to merge.' });

    // Get or create user cart
    let [[userCart]] = await pool.query(
      'SELECT * FROM carts WHERE user_id = ?', [req.user.id]
    );
    if (!userCart) {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO carts (id, user_id) VALUES (?, ?)', [id, req.user.id]
      );
      [[userCart]] = await pool.query('SELECT * FROM carts WHERE id = ?', [id]);
    }

    // Move guest items into user cart
    const [guestItems] = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = ?', [guestCart.id]
    );
    for (const gi of guestItems) {
      const [[existing]] = await pool.query(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL))',
        [userCart.id, gi.product_id, gi.size, gi.size]
      );
      if (existing) {
        await pool.query(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [gi.quantity, existing.id]
        );
      } else {
        await pool.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity, size) VALUES (?, ?, ?, ?)',
          [userCart.id, gi.product_id, gi.quantity, gi.size]
        );
      }
    }

    // Delete guest cart
    await pool.query('DELETE FROM carts WHERE id = ?', [guestCart.id]);

    const data = await buildCartResponse(userCart.id);
    return ok(res, data);
  } catch (err) { next(err); }
});

module.exports = router;
