import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext } from '../utils/CartContext';
import { orders as ordersApi } from '../utils/api';

const STEPS = ['Shipping', 'Payment', 'Review'];

export default function Checkout() {
  const { items, total, clearCart } = useCartContext();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: 'United States',
    cardName: '', cardNumber: '', expiry: '', cvv: '',
    saveInfo: false, newsletter: false,
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError,  setOrderError]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const shipping = total >= 500 ? 0 : 45;
  const tax = total * 0.08;
  const grandTotal = total + shipping + tax;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setOrderError('');

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step — place order via API
    setSubmitting(true);
    try {
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId ?? item.id,
          quantity:  item.quantity,
          size:      item.size ?? null,
        })),
        shipping: {
          firstName: form.firstName,
          lastName:  form.lastName,
          email:     form.email,
          phone:     form.phone || undefined,
          address:   form.address,
          city:      form.city,
          state:     form.state,
          zip:       form.zip,
          country:   form.country,
        },
      };

      await ordersApi.create(orderPayload);
      await clearCart();
      setOrderPlaced(true);
    } catch (err) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <main className="bg-[#0B0B0F] min-h-screen pt-32 flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 border border-[#C8A96A] rounded-full flex items-center justify-center mx-auto mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-['Playfair_Display'] text-white text-4xl font-bold mb-4">
            Order Confirmed
          </h1>
          <p className="font-['Cormorant_Garamond'] text-white/50 text-xl leading-relaxed mb-4">
            Thank you for your order. Your Sarélia pieces will be carefully packaged and dispatched within 1–2 business days.
          </p>
          <p className="font-['Cormorant_Garamond'] text-[#C8A96A] text-lg mb-10">
            A confirmation has been sent to {form.email || 'your email'}.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-3 bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase px-10 py-4 hover:bg-[#E2C98A] transition-colors duration-300"
          >
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#0B0B0F] min-h-screen pt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link to="/cart" className="flex items-center gap-2 font-['Cormorant_Garamond'] text-white/30 hover:text-[#C8A96A] text-sm tracking-wider transition-colors mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </Link>
          <h1 className="font-['Playfair_Display'] text-white text-4xl md:text-5xl font-bold mb-8">
            Checkout
          </h1>

          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 font-['Cormorant_Garamond'] text-sm tracking-[0.2em] uppercase transition-colors duration-300 ${
                    i === step ? 'text-[#C8A96A]' : i < step ? 'text-white/50 cursor-pointer hover:text-[#C8A96A]' : 'text-white/20 cursor-default'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs transition-all duration-300 ${
                      i === step
                        ? 'border-[#C8A96A] bg-[#C8A96A] text-[#0B0B0F]'
                        : i < step
                        ? 'border-[#C8A96A]/50 text-[#C8A96A]/50'
                        : 'border-white/10 text-white/20'
                    }`}
                  >
                    {i < step ? '✓' : i + 1}
                  </span>
                  {s}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-px mx-3 transition-colors duration-300 ${i < step ? 'bg-[#C8A96A]/40' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleNext}>
              {/* Step 0: Shipping */}
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="font-['Playfair_Display'] text-white text-2xl font-bold mb-6">
                    Shipping Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
                    <FormField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
                  </div>
                  <FormField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required />
                  <FormField label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                  <FormField label="Street Address" name="address" value={form.address} onChange={handleChange} required />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="City" name="city" value={form.city} onChange={handleChange} required />
                    <FormField label="State / Province" name="state" value={form.state} onChange={handleChange} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="ZIP / Postal Code" name="zip" value={form.zip} onChange={handleChange} required />
                    <div>
                      <label className="block font-['Cormorant_Garamond'] text-white/50 text-sm tracking-[0.2em] uppercase mb-2">
                        Country
                      </label>
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full bg-[#111118] border border-[#C8A96A]/20 text-white/70 font-['Cormorant_Garamond'] text-base px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors"
                      >
                        {['United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'Australia', 'Canada'].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="saveInfo"
                      checked={form.saveInfo}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#C8A96A]"
                    />
                    <span className="font-['Cormorant_Garamond'] text-white/50 text-base">
                      Save this information for future orders
                    </span>
                  </label>
                </div>
              )}

              {/* Step 1: Payment */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="font-['Playfair_Display'] text-white text-2xl font-bold mb-6">
                    Payment Details
                  </h2>

                  {/* Payment methods */}
                  <div className="flex gap-3 mb-6">
                    {['Credit Card', 'PayPal', 'Apple Pay'].map((method, i) => (
                      <button
                        key={method}
                        type="button"
                        className={`flex-1 py-3 border font-['Cormorant_Garamond'] text-sm tracking-wider transition-all duration-300 ${
                          i === 0
                            ? 'border-[#C8A96A] text-[#C8A96A] bg-[#C8A96A]/5'
                            : 'border-[#C8A96A]/20 text-white/40 hover:border-[#C8A96A]/40'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  <FormField label="Name on Card" name="cardName" value={form.cardName} onChange={handleChange} required />
                  <div className="relative">
                    <FormField
                      label="Card Number"
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={handleChange}
                      placeholder="•••• •••• •••• ••••"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Expiry Date" name="expiry" value={form.expiry} onChange={handleChange} placeholder="MM / YY" required />
                    <FormField label="CVV" name="cvv" value={form.cvv} onChange={handleChange} placeholder="•••" required />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-[#111118] border border-[#C8A96A]/10">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <p className="font-['Cormorant_Garamond'] text-white/40 text-sm">
                      Your payment information is encrypted and secure. We never store card details.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Review */}
              {step === 2 && (
                <div>
                  <h2 className="font-['Playfair_Display'] text-white text-2xl font-bold mb-6">
                    Review Your Order
                  </h2>

                  {/* Shipping summary */}
                  <div className="bg-[#111118] border border-[#C8A96A]/10 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-['Cormorant_Garamond'] text-[#C8A96A] text-sm tracking-[0.2em] uppercase">
                        Shipping To
                      </h3>
                      <button onClick={() => setStep(0)} className="font-['Cormorant_Garamond'] text-white/30 hover:text-[#C8A96A] text-sm transition-colors">
                        Edit
                      </button>
                    </div>
                    <p className="font-['Cormorant_Garamond'] text-white/60 text-base">
                      {form.firstName} {form.lastName}<br />
                      {form.address}, {form.city}, {form.state} {form.zip}<br />
                      {form.country}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover bg-[#111118]" />
                        <div className="flex-1">
                          <p className="font-['Playfair_Display'] text-white text-sm">{item.name}</p>
                          <p className="font-['Cormorant_Garamond'] text-white/40 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-['Cormorant_Garamond'] text-white text-base">
                          ${(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer mb-6">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={form.newsletter}
                      onChange={handleChange}
                      className="w-4 h-4 accent-[#C8A96A]"
                    />
                    <span className="font-['Cormorant_Garamond'] text-white/50 text-base">
                      Subscribe to Sarélia newsletter for exclusive offers
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-8 w-full bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase py-4 hover:bg-[#E2C98A] transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Placing Order…'
                  : step < STEPS.length - 1
                  ? `Continue to ${STEPS[step + 1]}`
                  : 'Place Order'}
              </button>
              {orderError && (
                <p className="mt-3 font-['Cormorant_Garamond'] text-red-400 text-sm text-center">
                  {orderError}
                </p>
              )}
            </form>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#111118] border border-[#C8A96A]/10 p-8 sticky top-28">
              <h2 className="font-['Playfair_Display'] text-white text-xl font-bold mb-6">
                Order Summary
              </h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between font-['Cormorant_Garamond'] text-white/60 text-sm">
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="flex-shrink-0">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#C8A96A]/10 pt-4 space-y-3">
                <div className="flex justify-between font-['Cormorant_Garamond'] text-white/50 text-sm">
                  <span>Subtotal</span><span>${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-['Cormorant_Garamond'] text-white/50 text-sm">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-[#C8A96A]' : ''}>{shipping === 0 ? 'Free' : `$${shipping}`}</span>
                </div>
                <div className="flex justify-between font-['Cormorant_Garamond'] text-white/50 text-sm">
                  <span>Tax</span><span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-['Playfair_Display'] text-white font-bold pt-3 border-t border-[#C8A96A]/10">
                  <span>Total</span>
                  <span className="text-[#C8A96A]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FormField({ label, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block font-['Cormorant_Garamond'] text-white/50 text-sm tracking-[0.2em] uppercase mb-2">
        {label} {required && <span className="text-[#C8A96A]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[#111118] border border-[#C8A96A]/20 text-white font-['Cormorant_Garamond'] text-base px-4 py-3 outline-none focus:border-[#C8A96A]/50 transition-colors placeholder-white/20"
      />
    </div>
  );
}
