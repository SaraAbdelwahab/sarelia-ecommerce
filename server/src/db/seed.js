'use strict';

/**
 * Seed script — inserts categories + all 8 products from the frontend.
 * Run with:  npm run db:seed
 * Safe to re-run (uses INSERT IGNORE / ON DUPLICATE KEY UPDATE).
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ── Data (mirrors sarelia/src/utils/products.js) ─────────────────────────────

const CATEGORIES = [
  { name: 'Rings',       image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80' },
  { name: 'Necklaces',   image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80' },
  { name: 'Earrings',    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80' },
  { name: 'Bracelets',   image_url: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&q=80' },
  { name: 'Accessories', image_url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80' },
];

const PRODUCTS = [
  {
    name: 'Lumière Diamond Ring',
    slug: 'lumiere-diamond-ring',
    category: 'Rings',
    price: 4850.00,
    original_price: 5200.00,
    badge: 'Bestseller',
    description: 'A breathtaking solitaire diamond ring set in 18k white gold. The Lumière captures light from every angle, creating an ethereal glow that mirrors the brilliance of its wearer.',
    rating: 4.90,
    review_count: 128,
    stock: 12,
    details: ['18k White Gold', '1.2ct Round Brilliant Diamond', 'VS1 Clarity, F Color', 'GIA Certified', 'Available in sizes 4–10'],
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
      'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80',
    ],
  },
  {
    name: 'Étoile Gold Necklace',
    slug: 'etoile-gold-necklace',
    category: 'Necklaces',
    price: 2340.00,
    original_price: null,
    badge: 'New',
    description: 'Inspired by the night sky, the Étoile necklace features a delicate 18k gold chain adorned with hand-set pavé diamonds forming a celestial star motif.',
    rating: 4.80,
    review_count: 94,
    stock: 8,
    details: ['18k Yellow Gold', '0.45ct Total Diamond Weight', 'Pavé Setting', '16" chain with 2" extender', 'Lobster clasp closure'],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    ],
  },
  {
    name: 'Aurore Pearl Earrings',
    slug: 'aurore-pearl-earrings',
    category: 'Earrings',
    price: 1680.00,
    original_price: 1950.00,
    badge: 'Sale',
    description: 'South Sea pearls of exceptional luster, suspended from 18k gold drops. The Aurore earrings embody understated elegance — a timeless addition to any collection.',
    rating: 4.70,
    review_count: 76,
    stock: 15,
    details: ['18k Yellow Gold', '10–11mm South Sea Pearls', 'AAA Grade Luster', 'Post and butterfly back', 'Comes in signature box'],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    ],
  },
  {
    name: 'Soleil Gold Bracelet',
    slug: 'soleil-gold-bracelet',
    category: 'Bracelets',
    price: 3120.00,
    original_price: null,
    badge: null,
    description: 'The Soleil bracelet is a masterpiece of goldsmithing — a fluid 18k gold bangle with a sunburst texture that catches the light with every movement.',
    rating: 4.90,
    review_count: 112,
    stock: 6,
    details: ['18k Yellow Gold', 'Hammered sunburst finish', 'Interior diameter: 2.5"', 'Weight: 28g', 'Hallmarked 750'],
    images: [
      'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
    ],
  },
  {
    name: 'Céleste Sapphire Ring',
    slug: 'celeste-sapphire-ring',
    category: 'Rings',
    price: 6200.00,
    original_price: null,
    badge: 'Limited',
    description: 'A vivid Ceylon sapphire of 2.8 carats, flanked by tapered baguette diamonds in a platinum setting. The Céleste ring is a statement of rare beauty.',
    rating: 5.00,
    review_count: 43,
    stock: 3,
    details: ['Platinum 950', '2.8ct Ceylon Sapphire', '0.6ct Baguette Diamonds', 'GIA Certified Sapphire', 'Bespoke sizing available'],
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
      'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80',
    ],
  },
  {
    name: 'Rosée Diamond Pendant',
    slug: 'rosee-diamond-pendant',
    category: 'Necklaces',
    price: 2890.00,
    original_price: 3100.00,
    badge: null,
    description: 'A dewdrop-shaped diamond pendant in 18k rose gold, suspended on a delicate chain. The Rosée captures the ephemeral beauty of morning light.',
    rating: 4.80,
    review_count: 67,
    stock: 9,
    details: ['18k Rose Gold', '0.75ct Pear Diamond', 'VS2 Clarity, G Color', '18" chain included', 'Gift wrapping available'],
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    ],
  },
  {
    name: 'Minuit Onyx Cufflinks',
    slug: 'minuit-onyx-cufflinks',
    category: 'Accessories',
    price: 980.00,
    original_price: null,
    badge: null,
    description: 'Polished black onyx set in 18k white gold with a subtle diamond accent. The Minuit cufflinks bring quiet luxury to formal occasions.',
    rating: 4.60,
    review_count: 38,
    stock: 20,
    details: ['18k White Gold', 'Natural Black Onyx', '0.1ct Diamond accent', 'T-bar fastening', 'Presented in leather box'],
    images: [
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
      'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
    ],
  },
  {
    name: 'Jardin Emerald Earrings',
    slug: 'jardin-emerald-earrings',
    category: 'Earrings',
    price: 5450.00,
    original_price: null,
    badge: 'New',
    description: 'Colombian emeralds of vivid green, set in 18k yellow gold with a halo of brilliant-cut diamonds. The Jardin earrings are a garden of rare beauty.',
    rating: 4.90,
    review_count: 29,
    stock: 4,
    details: ['18k Yellow Gold', '1.4ct Total Emerald Weight', '0.5ct Diamond Halo', 'Colombian origin', 'Post and omega back'],
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    ],
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'sarelia_db',
    multipleStatements: true,
  });

  console.log('🌱  Seeding database…');

  // ── Categories ──────────────────────────────────────────────────────────────
  for (const cat of CATEGORIES) {
    await conn.query(
      `INSERT INTO categories (name, image_url)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE image_url = VALUES(image_url)`,
      [cat.name, cat.image_url]
    );
  }
  console.log('  ✓ categories');

  // ── Products ────────────────────────────────────────────────────────────────
  for (const p of PRODUCTS) {
    const [[cat]] = await conn.query(
      'SELECT id FROM categories WHERE name = ?', [p.category]
    );
    if (!cat) { console.warn(`  ⚠ Category not found: ${p.category}`); continue; }

    // Upsert product
    await conn.query(
      `INSERT INTO products
         (name, slug, category_id, price, original_price, badge, description, rating, review_count, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), price = VALUES(price),
         original_price = VALUES(original_price), badge = VALUES(badge),
         description = VALUES(description), rating = VALUES(rating),
         review_count = VALUES(review_count), stock = VALUES(stock)`,
      [p.name, p.slug, cat.id, p.price, p.original_price, p.badge,
       p.description, p.rating, p.review_count, p.stock]
    );

    const [[prod]] = await conn.query(
      'SELECT id FROM products WHERE slug = ?', [p.slug]
    );

    // Replace details
    await conn.query('DELETE FROM product_details WHERE product_id = ?', [prod.id]);
    for (let i = 0; i < p.details.length; i++) {
      await conn.query(
        'INSERT INTO product_details (product_id, detail, sort_order) VALUES (?, ?, ?)',
        [prod.id, p.details[i], i]
      );
    }

    // Replace images
    await conn.query('DELETE FROM product_images WHERE product_id = ?', [prod.id]);
    for (let i = 0; i < p.images.length; i++) {
      await conn.query(
        'INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)',
        [prod.id, p.images[i], i]
      );
    }
  }
  console.log('  ✓ products (with details & images)');

  // ── Demo admin user ─────────────────────────────────────────────────────────
  const adminEmail = 'admin@sarelia.com';
  const [[existing]] = await conn.query(
    'SELECT id FROM users WHERE email = ?', [adminEmail]
  );
  if (!existing) {
    const hash = await bcrypt.hash('Admin@Sarelia2025!', 12);
    await conn.query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'admin')`,
      [uuidv4(), 'Sarélia', 'Admin', adminEmail, hash]
    );
    console.log('  ✓ admin user  →  admin@sarelia.com / Admin@Sarelia2025!');
  } else {
    console.log('  ✓ admin user already exists');
  }

  await conn.end();
  console.log('\n✅  Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
