'use strict';

const express  = require('express');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const pool     = require('../db/pool');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();

// ── Shipping / tax constants ──────────────────────────────────────────────────
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST           = 45;
const TAX_RATE                = 0.08;

const VALID_PROMO_CODES = {
  SARELIA10: 0.10,  // 10% off
  LUXURY20:  0.20,  // 20% off
  WELCOME15: 0.15,  // 15% off
};

// ── POST /api/orders/validate-promo  (must be BEFORE /:id) ───────────────────
router.post(
  '/validate-promo',
  [body('code').trim().toUpperCase().notEmpty()],
  validate,
  (req, res) => {
    const { code } = req.body;
    const rate = VALID_PROMO_CODES[code];
    if (!rate) return fail(res, 'Invalid or expired promo code.', 404);
    return ok(res, {
      code,
      discountRate:    rate,
      discountPercent: `${rate * 100}%`,
    });
  }
);

// ── Helper: build order response ──────────────────────────────────────────────
async function buildOrder(orderId) {
  const [[order]] = await pool.query(
    `SELECT
       id, status, subtotal, shipping_cost AS shippingCost, tax, total,
       promo_code AS promoCode, discount,
       ship_first_name AS firstName, ship_last_name AS lastName,
       ship_email AS email, ship_phone AS phone,
       ship_address AS address, ship_city AS city,
       ship_state AS state, ship_zip AS zip, ship_country AS country,
       notes, created_at AS createdAt, updated_at AS updatedAt
     FROM orders WHERE id = ?`,
    [orderId]
  );
  if (!order) return null;

  const [items] = await pool.query(
    `SELECT id, product_id AS productId, product_name AS name,
            product_slug AS slug, image_url AS image,
            price, quantity, size
     FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  return {
    ...order,
    subtotal:      Number(order.subtotal),
    shippingCost:  Number(order.shippingCost),
    tax:           Number(order.tax),
    total:         Number(order.total),
    discount:      Number(order.discount),
    items:         items.map((i) => ({ ...i, price: Number(i.price) })),
  };
}

// ── POST /api/orders ──────────────────────────────────────────────────────────
router.post(
  '/',
  optionalAuth,
  [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
    body('items.*.productId').isInt({ min: 1 }).toInt(),
    body('items.*.quantity').isInt({ min: 1 }).toInt(),
    body('items.*.size').optional({ nullable: true }).trim(),
    body('shipping.firstName').trim().notEmpty(),
    body('shipping.lastName').trim().notEmpty(),
    body('shipping.email').isEmail().normalizeEmail(),
    body('shipping.address').trim().notEmpty(),
    body('shipping.city').trim().notEmpty(),
    body('shipping.state').trim().notEmpty(),
    body('shipping.zip').trim().notEmpty(),
    body('shipping.country').optional().trim(),
    body('shipping.phone').optional().trim(),
    body('promoCode').optional().trim().toUpperCase(),
    body('notes').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { items, shipping, promoCode, notes } = req.body;

      // ── Validate products & compute subtotal ──────────────────────────────
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const [[product]] = await pool.query(
          `SELECT p.id, p.name, p.slug, p.price, p.stock,
                  (SELECT url FROM product_images WHERE product_id = p.id AND sort_order = 0 LIMIT 1) AS image
           FROM products p WHERE p.id = ? AND p.is_active = 1`,
          [item.productId]
        );
        if (!product) {
          return fail(res, `Product ID ${item.productId} not found or unavailable.`, 404);
        }
        if (product.stock < item.quantity) {
          return fail(res, `Insufficient stock for "${product.name}".`, 409);
        }

        subtotal += Number(product.price) * item.quantity;
        orderItems.push({
          productId:   product.id,
          productName: product.name,
          productSlug: product.slug,
          imageUrl:    product.image || '',
          price:       Number(product.price),
          quantity:    item.quantity,
          size:        item.size || null,
        });
      }

      // ── Promo code ────────────────────────────────────────────────────────
      let discount = 0;
      if (promoCode && VALID_PROMO_CODES[promoCode]) {
        discount = +(subtotal * VALID_PROMO_CODES[promoCode]).toFixed(2);
      }

      const discountedSubtotal = subtotal - discount;
      const shippingCost = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      const tax          = +(discountedSubtotal * TAX_RATE).toFixed(2);
      const total        = +(discountedSubtotal + shippingCost + tax).toFixed(2);

      // ── Create order ──────────────────────────────────────────────────────
      const orderId = uuidv4();
      await pool.query(
        `INSERT INTO orders (
           id, user_id, subtotal, shipping_cost, tax, total,
           promo_code, discount,
           ship_first_name, ship_last_name, ship_email, ship_phone,
           ship_address, ship_city, ship_state, ship_zip, ship_country,
           notes
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          req.user?.id || null,
          subtotal.toFixed(2),
          shippingCost.toFixed(2),
          tax,
          total,
          promoCode || null,
          discount.toFixed(2),
          shipping.firstName,
          shipping.lastName,
          shipping.email,
          shipping.phone || null,
          shipping.address,
          shipping.city,
          shipping.state,
          shipping.zip,
          shipping.country || 'United States',
          notes || null,
        ]
      );

      // ── Insert order items & decrement stock ──────────────────────────────
      for (const oi of orderItems) {
        await pool.query(
          `INSERT INTO order_items
             (order_id, product_id, product_name, product_slug, image_url, price, quantity, size)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, oi.productId, oi.productName, oi.productSlug,
           oi.imageUrl, oi.price, oi.quantity, oi.size]
        );
        await pool.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [oi.quantity, oi.productId]
        );
      }

      // ── Clear cart if user is authenticated ───────────────────────────────
      if (req.user) {
        const [[cart]] = await pool.query(
          'SELECT id FROM carts WHERE user_id = ?', [req.user.id]
        );
        if (cart) {
          await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
        }
      }

      const order = await buildOrder(orderId);
      return ok(res, { order }, 201);
    } catch (err) { next(err); }
  }
);

// ── GET /api/orders  (authenticated user's orders) ────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, status, total, created_at AS createdAt
       FROM orders WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return ok(res, { orders: rows.map((r) => ({ ...r, total: Number(r.total) })) });
  } catch (err) { next(err); }
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const order = await buildOrder(req.params.id);
    if (!order) return fail(res, 'Order not found.', 404);

    // Allow access to order owner or admin; guests can view by order ID (receipt link)
    if (req.user && req.user.role !== 'admin' && order.userId && order.userId !== req.user.id) {
      return fail(res, 'Access denied.', 403);
    }

    return ok(res, { order });
  } catch (err) { next(err); }
});

// ── PATCH /api/orders/:id/status  (admin) ────────────────────────────────────
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  [
    body('status').isIn([
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
    ]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const [[order]] = await pool.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
      if (!order) return fail(res, 'Order not found.', 404);

      await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

      // If cancelled, restore stock
      if (status === 'cancelled') {
        const [items] = await pool.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]
        );
        for (const item of items) {
          await pool.query(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }

      const updated = await buildOrder(req.params.id);
      return ok(res, { order: updated });
    } catch (err) { next(err); }
  }
);

module.exports = router;
