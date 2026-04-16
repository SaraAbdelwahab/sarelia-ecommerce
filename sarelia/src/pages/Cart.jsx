import { Link } from 'react-router-dom';
import { useCartContext } from '../utils/CartContext';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartContext();

  if (items.length === 0) {
    return (
      <main className="bg-[#0B0B0F] min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 border border-[#C8A96A]/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 className="font-['Playfair_Display'] text-white text-4xl font-bold mb-4">
            Your Cart is Empty
          </h1>
          <p className="font-['Cormorant_Garamond'] text-white/40 text-xl mb-10">
            Discover our exquisite collections and find your perfect piece.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase px-10 py-4 hover:bg-[#E2C98A] transition-colors duration-300"
          >
            Explore Collections
          </Link>
        </div>
      </main>
    );
  }

  const shipping = total >= 500 ? 0 : 45;
  const tax = total * 0.08;
  const grandTotal = total + shipping + tax;

  return (
    <main className="bg-[#0B0B0F] min-h-screen pt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 pb-6 border-b border-[#C8A96A]/10">
          <div>
            <p className="font-['Inter'] text-[#C8A96A] text-xs tracking-[0.4em] uppercase mb-2">Your Selection</p>
            <h1 className="font-['Playfair_Display'] text-white text-4xl md:text-5xl font-bold">
              Shopping Cart
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="font-['Cormorant_Garamond'] text-white/30 hover:text-white/60 text-sm tracking-wider transition-colors duration-300"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-6 pb-6 border-b border-[#C8A96A]/10 group"
              >
                {/* Image */}
                <Link to={`/product/${item.slug}`} className="flex-shrink-0">
                  <div className="w-24 h-28 md:w-32 md:h-36 overflow-hidden bg-[#111118]">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-['Cormorant_Garamond'] text-[#C8A96A]/60 text-xs tracking-[0.25em] uppercase mb-1">
                      {item.category}
                    </p>
                    <Link to={`/product/${item.slug}`}>
                      <h3 className="font-['Playfair_Display'] text-white text-lg font-medium hover:text-[#C8A96A] transition-colors duration-300">
                        {item.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center border border-[#C8A96A]/20">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-[#C8A96A] transition-colors text-lg"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-['Cormorant_Garamond'] text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-[#C8A96A] transition-colors text-lg"
                      >
                        +
                      </button>
                    </div>

                    {/* Price + remove */}
                    <div className="flex items-center gap-4">
                      <span className="font-['Playfair_Display'] text-white text-lg">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-white/20 hover:text-red-400 transition-colors duration-300"
                        aria-label="Remove item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#111118] border border-[#C8A96A]/10 p-8 sticky top-28">
              <h2 className="font-['Playfair_Display'] text-white text-2xl font-bold mb-8">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between font-['Cormorant_Garamond'] text-white/60 text-base">
                  <span>Subtotal</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-['Cormorant_Garamond'] text-white/60 text-base">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-[#C8A96A]' : ''}>
                    {shipping === 0 ? 'Free' : `$${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="font-['Cormorant_Garamond'] text-[#C8A96A]/50 text-sm">
                    Free shipping on orders over $500
                  </p>
                )}
                <div className="flex justify-between font-['Cormorant_Garamond'] text-white/60 text-base">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-[#C8A96A]/10 pt-6 mb-8">
                <div className="flex justify-between">
                  <span className="font-['Playfair_Display'] text-white text-lg font-bold">Total</span>
                  <span className="font-['Playfair_Display'] text-[#C8A96A] text-xl font-bold">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Promo code */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Promo code"
                  className="flex-1 bg-[#0B0B0F] border border-[#C8A96A]/20 text-white/70 font-['Cormorant_Garamond'] text-sm px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors"
                />
                <button className="bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-[#C8A96A] font-['Inter'] text-xs tracking-widest uppercase px-4 py-3 hover:bg-[#C8A96A]/20 transition-colors">
                  Apply
                </button>
              </div>

              <Link
                to="/checkout"
                className="block w-full text-center bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase py-4 hover:bg-[#E2C98A] transition-colors duration-300 mb-4"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/shop"
                className="block w-full text-center border border-[#C8A96A]/20 text-white/50 font-['Inter'] text-xs tracking-[0.3em] uppercase py-4 hover:border-[#C8A96A]/50 hover:text-white/70 transition-all duration-300"
              >
                Continue Shopping
              </Link>

              {/* Trust */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="font-['Cormorant_Garamond'] text-white/30 text-sm">
                  Secure & encrypted checkout
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
