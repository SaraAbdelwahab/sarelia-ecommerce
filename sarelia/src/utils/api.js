/**
 * Sarélia API client
 *
 * With Vite's dev proxy, requests to /api/* are forwarded to localhost:5000.
 * In production, set VITE_API_URL to your deployed API base URL.
 *
 * Token storage: localStorage (access + refresh).
 * On 401, silently refreshes the access token once before failing.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
export const token = {
  getAccess:  () => localStorage.getItem('sarelia_access_token'),
  getRefresh: () => localStorage.getItem('sarelia_refresh_token'),
  setAccess:  (t) => localStorage.setItem('sarelia_access_token', t),
  setRefresh: (t) => localStorage.setItem('sarelia_refresh_token', t),
  setTokens:  (a, r) => {
    localStorage.setItem('sarelia_access_token', a);
    localStorage.setItem('sarelia_refresh_token', r);
  },
  clear: () => {
    localStorage.removeItem('sarelia_access_token');
    localStorage.removeItem('sarelia_refresh_token');
  },
};

// ── Session ID for guest carts ────────────────────────────────────────────────
export function getSessionId() {
  let sid = localStorage.getItem('sarelia_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('sarelia_session_id', sid);
  }
  return sid;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
let isRefreshing = false;

async function request(path, options = {}, retry = true) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Session-Id': getSessionId(),
    ...options.headers,
  };

  const accessToken = token.getAccess();
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    // Only stringify if body is a plain object (not already a string)
    body: options.body !== undefined
      ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
      : undefined,
  });

  // Silent token refresh on 401
  if (res.status === 401 && retry && !isRefreshing) {
    const refreshToken = token.getRefresh();
    if (refreshToken) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          token.setTokens(data.accessToken, data.refreshToken);
          isRefreshing = false;
          return request(path, options, false); // retry once with new token
        }
      } catch { /* fall through */ }
      isRefreshing = false;
      token.clear();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

const get   = (path, opts = {})       => request(path, { method: 'GET',    ...opts });
const post  = (path, body, opts = {}) => request(path, { method: 'POST',   body, ...opts });
const patch = (path, body, opts = {}) => request(path, { method: 'PATCH',  body, ...opts });
const del   = (path, opts = {})       => request(path, { method: 'DELETE', ...opts });

// ── Auth  /api/auth/* ─────────────────────────────────────────────────────────
export const auth = {
  register: ({ firstName, lastName, email, password }) =>
  post('/auth/register', {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
  }),
  login: (email, password) =>
    post('/auth/login', { email, password }),

  logout: () =>
    post('/auth/logout', { refreshToken: token.getRefresh() }),

  refresh: () =>
    post('/auth/refresh', { refreshToken: token.getRefresh() }),

  me: () => get('/auth/me'),

  updateMe: (data) => patch('/auth/me', data),

  changePassword: (currentPassword, newPassword) =>
    post('/auth/change-password', { currentPassword, newPassword }),
};

// ── Products  /api/products/* ─────────────────────────────────────────────────
export const products = {
  /**
   * List products with optional filters.
   * @param {{ category?: string, search?: string, sort?: string, page?: number, limit?: number }} params
   */
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null && v !== '')
      )
    ).toString();
    return get(`/products${qs ? `?${qs}` : ''}`);
  },

  categories: () => get('/products/categories'),

  bySlug: (slug) => get(`/products/slug/${encodeURIComponent(slug)}`),

  byId: (id) => get(`/products/${id}`),
};

// ── Cart  /api/cart/* ─────────────────────────────────────────────────────────
export const cart = {
  get: () => get('/cart'),

  /** productId is the DB integer id */
  addItem: (productId, quantity = 1, size = null) =>
    post('/cart/items', { productId, quantity, ...(size ? { size } : {}) }),

  /** itemId is the cart_items row id (integer) */
  updateItem: (itemId, quantity) =>
    patch(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId) => del(`/cart/items/${itemId}`),

  clear: () => del('/cart'),

  /** Call after login to merge guest cart into user cart */
  merge: (sessionId) => post('/cart/merge', { sessionId }),
};

// ── Orders  /api/orders/* ─────────────────────────────────────────────────────
export const orders = {
  /**
   * Place an order.
   * @param {{ items: Array<{productId, quantity, size?}>, shipping: object, promoCode?: string }} data
   */
  create: (data) => post('/orders', data),

  list: () => get('/orders'),

  get: (id) => get(`/orders/${id}`),

  validatePromo: (code) => post('/orders/validate-promo', { code }),
};

export default { auth, products, cart, orders, token, getSessionId };
