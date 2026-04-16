import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cart as cartApi, getSessionId } from './api';

const CartContext = createContext(null);

/**
 * CartProvider — syncs with the backend cart API.
 *
 * Shape of each item returned by the backend:
 *   { id (cart_item row id), productId, name, slug, price, quantity,
 *     size, category, image, images: [image], badge }
 *
 * The frontend useCart hook previously used localStorage only.
 * This provider replaces it with real API calls while keeping the
 * same interface (addItem, removeItem, updateQuantity, clearCart,
 * items, total, count) so no other component needs to change.
 */
export function CartProvider({ children }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const applyResponse = useCallback((data) => {
    // Backend returns { items, subtotal, count }
    if (data && Array.isArray(data.items)) {
      setItems(data.items);
    }
  }, []);

  // ── Load cart on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    cartApi.get()
      .then(applyResponse)
      .catch(() => { /* backend not running — items stay empty */ })
      .finally(() => setLoading(false));
  }, [applyResponse]);

  // ── addItem ────────────────────────────────────────────────────────────────
  // product can be a full product object (from static data or API).
  // We need the integer DB id — the backend product has `id` as integer.
  const addItem = useCallback(async (product, quantity = 1) => {
    try {
      const data = await cartApi.addItem(product.id, quantity, null);
      applyResponse(data);
    } catch (err) {
      console.error('addItem failed:', err.message);
    }
  }, [applyResponse]);

  // ── removeItem ─────────────────────────────────────────────────────────────
  // itemId here is the cart_items row id (integer), not the product id
  const removeItem = useCallback(async (itemId) => {
    try {
      const data = await cartApi.removeItem(itemId);
      applyResponse(data);
    } catch (err) {
      console.error('removeItem failed:', err.message);
    }
  }, [applyResponse]);

  // ── updateQuantity ─────────────────────────────────────────────────────────
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const data = await cartApi.updateItem(itemId, quantity);
      applyResponse(data);
    } catch (err) {
      console.error('updateQuantity failed:', err.message);
    }
  }, [applyResponse]);

  // ── clearCart ──────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    try {
      const data = await cartApi.clear();
      applyResponse(data);
    } catch (err) {
      console.error('clearCart failed:', err.message);
    }
  }, [applyResponse]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count, loading }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}
