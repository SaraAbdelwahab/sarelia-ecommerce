'use strict';

const express  = require('express');
const { body, query, param } = require('express-validator');

const pool     = require('../db/pool');
const validate = require('../middleware/validate');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();

// ── Helper: fetch full product row with images + details ─────────────────────
async function fetchProduct(identifier, bySlug = false) {
  const col = bySlug ? 'p.slug' : 'p.id';
  const [[product]] = await pool.query(
    `SELECT
       p.id, p.name, p.slug, p.price, p.original_price AS originalPrice,
       p.badge, p.description, p.rating, p.review_count AS reviews,
       p.stock, p.is_active AS isActive, p.created_at AS createdAt,
       c.name AS category, c.id AS categoryId
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE ${col} = ? AND p.is_active = 1`,
    [identifier]
  );
  if (!product) return null;

  const [images] = await pool.query(
    'SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order',
    [product.id]
  );
  const [details] = await pool.query(
    'SELECT detail FROM product_details WHERE product_id = ? ORDER BY sort_order',
    [product.id]
  );

  return {
    ...product,
    price:         Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    rating:        Number(product.rating),
    images:        images.map((r) => r.url),
    details:       details.map((r) => r.detail),
  };
}

// ── GET /api/products ─────────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('category').optional().trim(),
    query('search').optional().trim(),
    query('sort').optional().isIn(['featured', 'price-asc', 'price-desc', 'rating']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        category,
        search,
        sort    = 'featured',
        page    = 1,
        limit   = 20,
      } = req.query;

      const offset = (page - 1) * limit;
      const where  = ['p.is_active = 1'];
      const params = [];

      if (category && category !== 'All') {
        where.push('c.name = ?');
        params.push(category);
      }
      if (search) {
        where.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
        const like = `%${search}%`;
        params.push(like, like, like);
      }

      const orderMap = {
        'featured':   'p.review_count DESC',
        'price-asc':  'p.price ASC',
        'price-desc': 'p.price DESC',
        'rating':     'p.rating DESC',
      };
      const orderBy = orderMap[sort] || 'p.review_count DESC';

      const whereClause = where.join(' AND ');

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM products p JOIN categories c ON c.id = p.category_id
         WHERE ${whereClause}`,
        params
      );

      const [rows] = await pool.query(
        `SELECT
           p.id, p.name, p.slug, p.price, p.original_price AS originalPrice,
           p.badge, p.rating, p.review_count AS reviews, p.stock,
           c.name AS category
         FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE ${whereClause}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      // Attach first image to each product
      const productIds = rows.map((r) => r.id);
      let imageMap = {};
      if (productIds.length) {
        const [imgs] = await pool.query(
          `SELECT product_id, url
           FROM product_images
           WHERE product_id IN (${productIds.map(() => '?').join(',')})
             AND sort_order = 0`,
          productIds
        );
        imgs.forEach((img) => { imageMap[img.product_id] = img.url; });
      }

      const products = rows.map((p) => ({
        ...p,
        price:         Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        rating:        Number(p.rating),
        image:         imageMap[p.id] || null,
      }));

      return ok(res, {
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) { next(err); }
  }
);

// ── GET /api/products/categories ─────────────────────────────────────────────
router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.image_url AS image,
              COUNT(p.id) AS count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       GROUP BY c.id
       ORDER BY c.id`
    );
    return ok(res, { categories: rows.map((r) => ({ ...r, count: Number(r.count) })) });
  } catch (err) { next(err); }
});

// ── GET /api/products/slug/:slug ──────────────────────────────────────────────
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const product = await fetchProduct(req.params.slug, true);
    if (!product) return fail(res, 'Product not found.', 404);
    return ok(res, { product });
  } catch (err) { next(err); }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const product = await fetchProduct(req.params.id);
    if (!product) return fail(res, 'Product not found.', 404);
    return ok(res, { product });
  } catch (err) { next(err); }
});

// ── POST /api/products  (admin) ───────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty(),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
    body('categoryId').isInt({ min: 1 }).toInt(),
    body('price').isFloat({ min: 0 }).toFloat(),
    body('originalPrice').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
    body('description').trim().notEmpty(),
    body('stock').isInt({ min: 0 }).toInt(),
    body('images').isArray({ min: 1 }),
    body('details').isArray({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, slug, categoryId, price, originalPrice, badge, description, stock, images, details } = req.body;

      const [result] = await pool.query(
        `INSERT INTO products (name, slug, category_id, price, original_price, badge, description, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, slug, categoryId, price, originalPrice || null, badge || null, description, stock]
      );
      const productId = result.insertId;

      for (let i = 0; i < images.length; i++) {
        await pool.query(
          'INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)',
          [productId, images[i], i]
        );
      }
      for (let i = 0; i < details.length; i++) {
        await pool.query(
          'INSERT INTO product_details (product_id, detail, sort_order) VALUES (?, ?, ?)',
          [productId, details[i], i]
        );
      }

      const product = await fetchProduct(productId);
      return ok(res, { product }, 201);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/products/:id  (admin) ─────────────────────────────────────────
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { name, price, originalPrice, badge, description, stock, isActive, images, details } = req.body;
      const fields = [];
      const values = [];

      if (name        !== undefined) { fields.push('name = ?');           values.push(name); }
      if (price       !== undefined) { fields.push('price = ?');          values.push(price); }
      if (originalPrice !== undefined) { fields.push('original_price = ?'); values.push(originalPrice); }
      if (badge       !== undefined) { fields.push('badge = ?');          values.push(badge); }
      if (description !== undefined) { fields.push('description = ?');    values.push(description); }
      if (stock       !== undefined) { fields.push('stock = ?');          values.push(stock); }
      if (isActive    !== undefined) { fields.push('is_active = ?');      values.push(isActive ? 1 : 0); }

      if (fields.length) {
        values.push(req.params.id);
        await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
      }

      if (Array.isArray(images)) {
        await pool.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
        for (let i = 0; i < images.length; i++) {
          await pool.query(
            'INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)',
            [req.params.id, images[i], i]
          );
        }
      }
      if (Array.isArray(details)) {
        await pool.query('DELETE FROM product_details WHERE product_id = ?', [req.params.id]);
        for (let i = 0; i < details.length; i++) {
          await pool.query(
            'INSERT INTO product_details (product_id, detail, sort_order) VALUES (?, ?, ?)',
            [req.params.id, details[i], i]
          );
        }
      }

      const product = await fetchProduct(Number(req.params.id));
      return ok(res, { product });
    } catch (err) { next(err); }
  }
);

// ── DELETE /api/products/:id  (admin — soft delete) ──────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    return ok(res, { message: 'Product deactivated.' });
  } catch (err) { next(err); }
});

module.exports = router;
