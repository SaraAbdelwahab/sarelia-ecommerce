'use strict';

/**
 * Migration script — creates all tables in the correct order.
 * Run with:  npm run db:migrate
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('🔧  Running migrations…');

  // 1. Create database
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'sarelia_db'}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await conn.query(`USE \`${process.env.DB_NAME || 'sarelia_db'}\`;`);

  // 2. users
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            CHAR(36)      NOT NULL PRIMARY KEY,
      first_name    VARCHAR(80)   NOT NULL,
      last_name     VARCHAR(80)   NOT NULL,
      email         VARCHAR(191)  NOT NULL UNIQUE,
      password_hash VARCHAR(255)  NOT NULL,
      role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ users');

  // 3. refresh_tokens
  await conn.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         CHAR(36)    NOT NULL PRIMARY KEY,
      user_id    CHAR(36)    NOT NULL,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      expires_at DATETIME    NOT NULL,
      created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_rt_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ refresh_tokens');

  // 4. categories
  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(80)   NOT NULL UNIQUE,
      image_url  VARCHAR(500)  NOT NULL DEFAULT '',
      created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ categories');

  // 5. products
  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id             INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name           VARCHAR(191)  NOT NULL,
      slug           VARCHAR(191)  NOT NULL UNIQUE,
      category_id    INT UNSIGNED  NOT NULL,
      price          DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2) NULL,
      badge          VARCHAR(40)   NULL,
      description    TEXT          NOT NULL,
      rating         DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
      review_count   INT UNSIGNED  NOT NULL DEFAULT 0,
      stock          INT UNSIGNED  NOT NULL DEFAULT 0,
      is_active      TINYINT(1)    NOT NULL DEFAULT 1,
      created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      INDEX idx_products_slug     (slug),
      INDEX idx_products_category (category_id),
      INDEX idx_products_active   (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ products');

  // 6. product_details  (bullet-point specs)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_details (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      detail     VARCHAR(255) NOT NULL,
      sort_order TINYINT      NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_pd_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ product_details');

  // 7. product_images
  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      url        VARCHAR(500) NOT NULL,
      sort_order TINYINT      NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_pi_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ product_images');

  // 8. carts
  await conn.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id         CHAR(36)     NOT NULL PRIMARY KEY,
      user_id    CHAR(36)     NULL,
      session_id VARCHAR(191) NULL,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_carts_user    (user_id),
      INDEX idx_carts_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ carts');

  // 9. cart_items
  await conn.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id         INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
      cart_id    CHAR(36)      NOT NULL,
      product_id INT UNSIGNED  NOT NULL,
      quantity   SMALLINT      NOT NULL DEFAULT 1,
      size       VARCHAR(10)   NULL,
      added_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cart_id)    REFERENCES carts(id)    ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY uq_cart_product_size (cart_id, product_id, size),
      INDEX idx_ci_cart (cart_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ cart_items');

  // 10. orders
  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id              CHAR(36)      NOT NULL PRIMARY KEY,
      user_id         CHAR(36)      NULL,
      status          ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded')
                                    NOT NULL DEFAULT 'pending',
      subtotal        DECIMAL(10,2) NOT NULL,
      shipping_cost   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      total           DECIMAL(10,2) NOT NULL,
      promo_code      VARCHAR(40)   NULL,
      discount        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      -- shipping address (snapshot at order time)
      ship_first_name VARCHAR(80)   NOT NULL,
      ship_last_name  VARCHAR(80)   NOT NULL,
      ship_email      VARCHAR(191)  NOT NULL,
      ship_phone      VARCHAR(30)   NULL,
      ship_address    VARCHAR(255)  NOT NULL,
      ship_city       VARCHAR(100)  NOT NULL,
      ship_state      VARCHAR(100)  NOT NULL,
      ship_zip        VARCHAR(20)   NOT NULL,
      ship_country    VARCHAR(80)   NOT NULL DEFAULT 'United States',
      notes           TEXT          NULL,
      created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_orders_user   (user_id),
      INDEX idx_orders_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ orders');

  // 11. order_items
  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id           INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id     CHAR(36)      NOT NULL,
      product_id   INT UNSIGNED  NOT NULL,
      product_name VARCHAR(191)  NOT NULL,
      product_slug VARCHAR(191)  NOT NULL,
      image_url    VARCHAR(500)  NOT NULL DEFAULT '',
      price        DECIMAL(10,2) NOT NULL,
      quantity     SMALLINT      NOT NULL DEFAULT 1,
      size         VARCHAR(10)   NULL,
      FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      INDEX idx_oi_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ order_items');

  await conn.end();
  console.log('\n✅  All migrations complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
