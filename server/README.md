# Sarélia API

REST backend for the Sarélia luxury jewelry e-commerce platform.

## Stack
- **Node.js** + **Express.js**
- **MySQL** (via `mysql2/promise` connection pool)
- **JWT** (access + refresh token rotation)
- **bcryptjs** for password hashing

---

## Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- MySQL ≥ 8.0 running locally

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD and strong JWT secrets
```

### 3. Install dependencies
```bash
npm install
```

### 4. Create database & tables
```bash
npm run db:migrate
```

### 5. Seed categories, products & admin user
```bash
npm run db:seed
# Admin credentials: admin@sarelia.com / Admin@Sarelia2025!
```

### 6. Start the server
```bash
npm run dev        # development (nodemon)
npm start          # production
```

Server runs on **http://localhost:5000**

---

## API Reference

### Health
| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | — |

### Auth  `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login, returns tokens |
| POST | `/refresh` | — | Rotate refresh token |
| POST | `/logout` | — | Revoke refresh token |
| GET | `/me` | ✅ Bearer | Get current user |
| PATCH | `/me` | ✅ Bearer | Update profile |
| POST | `/change-password` | ✅ Bearer | Change password |

### Products  `/api/products`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List products (filter, sort, paginate) |
| GET | `/categories` | — | All categories with counts |
| GET | `/slug/:slug` | — | Product by slug |
| GET | `/:id` | — | Product by ID |
| POST | `/` | 🔒 Admin | Create product |
| PATCH | `/:id` | 🔒 Admin | Update product |
| DELETE | `/:id` | 🔒 Admin | Soft-delete product |

**Query params for `GET /api/products`:**
- `category` — filter by category name
- `search` — full-text search
- `sort` — `featured` | `price-asc` | `price-desc` | `rating`
- `page` — page number (default: 1)
- `limit` — items per page (default: 20, max: 100)

### Cart  `/api/cart`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Optional | Get cart |
| POST | `/items` | Optional | Add item |
| PATCH | `/items/:itemId` | Optional | Update quantity |
| DELETE | `/items/:itemId` | Optional | Remove item |
| DELETE | `/` | Optional | Clear cart |
| POST | `/merge` | ✅ Bearer | Merge guest cart after login |

> Guest carts use the `X-Session-Id` header. Generate a UUID on the client and persist it in localStorage.

### Orders  `/api/orders`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Optional | Place order |
| GET | `/` | ✅ Bearer | User's order history |
| GET | `/:id` | Optional | Order detail |
| PATCH | `/:id/status` | 🔒 Admin | Update order status |
| POST | `/validate-promo` | — | Validate promo code |

**Promo codes:** `SARELIA10` (10%), `LUXURY20` (20%), `WELCOME15` (15%)

---

## Response Envelope

All responses follow this shape:

```json
{ "success": true, "data": "..." }
{ "success": false, "message": "Error description" }
```

Validation errors (422):
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Valid email required." }]
}
```

---

## Connecting the Frontend

Add to `sarelia/.env` (create if missing):
```
VITE_API_URL=http://localhost:5000/api
```

Then import from `src/utils/api.js`:
```js
import api from './utils/api';

// Products
const { products } = await api.products.list({ category: 'Rings', sort: 'price-asc' });

// Auth
const { accessToken, refreshToken, user } = await api.auth.login(email, password);

// Cart
await api.cart.addItem(productId, 1);

// Orders
const { order } = await api.orders.create({ items, shipping, promoCode });
```
