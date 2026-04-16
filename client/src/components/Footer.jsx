import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0F] border-t border-[#C8A96A]/10">
      {/* Marquee */}
      <div className="border-y border-[#C8A96A]/10 py-4 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array(8).fill(null).map((_, i) => (
            <span
              key={i}
              className="font-['Playfair_Display'] text-sm tracking-[0.4em] uppercase text-[#C8A96A]/40 mx-8"
            >
              Sarélia — Timeless Luxury ✦ Fine Jewelry ✦ Crafted with Devotion ✦
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              to="/"
              className="font-['Playfair_Display'] text-3xl font-bold tracking-widest text-white block mb-4"
            >
              Sarélia
            </Link>
            <p className="font-['Cormorant_Garamond'] text-white/50 text-base leading-relaxed mb-6">
              Timeless jewelry crafted for those who appreciate the finest things in life.
              Established 2023.
            </p>
            <div className="flex gap-4">
              {['instagram', 'pinterest', 'facebook'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 border border-[#C8A96A]/20 rounded-full flex items-center justify-center text-white/40 hover:text-[#C8A96A] hover:border-[#C8A96A]/60 transition-all duration-300"
                  aria-label={social}
                >
                  {social === 'instagram' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                    </svg>
                  )}
                  {social === 'pinterest' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                    </svg>
                  )}
                  {social === 'facebook' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="font-['Cormorant_Garamond'] text-[#C8A96A] text-sm tracking-[0.3em] uppercase mb-6">
              Collections
            </h4>
            <ul className="space-y-3">
              {['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Accessories', 'New Arrivals'].map((item) => (
                <li key={item}>
                  <Link
                    to={`/shop?category=${item}`}
                    className="font-['Cormorant_Garamond'] text-white/50 hover:text-[#C8A96A] transition-colors duration-300 text-base"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-['Cormorant_Garamond'] text-[#C8A96A] text-sm tracking-[0.3em] uppercase mb-6">
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Our Story', to: '/about' },
                { label: 'Craftsmanship', to: '/about' },
                { label: 'Sustainability', to: '/about' },
                { label: 'Press', to: '/about' },
                { label: 'Careers', to: '/about' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="font-['Cormorant_Garamond'] text-white/50 hover:text-[#C8A96A] transition-colors duration-300 text-base"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-['Cormorant_Garamond'] text-[#C8A96A] text-sm tracking-[0.3em] uppercase mb-6">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="font-['Cormorant_Garamond'] text-white/50 text-base">
                contact@sarelia.com
              </li>
              <li className="font-['Cormorant_Garamond'] text-white/50 text-base">
                +1 (800) 727-3542
              </li>
              <li className="font-['Cormorant_Garamond'] text-white/50 text-base leading-relaxed">
                12 Rue de la Paix<br />Paris, France 75002
              </li>
            </ul>
            <div className="mt-6">
              <p className="font-['Cormorant_Garamond'] text-white/40 text-sm mb-3">
                Subscribe to our newsletter
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-[#1A1A24] border border-[#C8A96A]/20 text-white/70 font-['Cormorant_Garamond'] text-sm px-3 py-2 outline-none focus:border-[#C8A96A]/50 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#C8A96A] text-[#0B0B0F] px-4 py-2 text-xs font-['Inter'] font-medium tracking-widest uppercase hover:bg-[#E2C98A] transition-colors duration-300"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#C8A96A]/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-['Inter'] text-white/25 text-xs tracking-widest">
            © 2025 Sarélia. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <a
                key={item}
                href="#"
                className="font-['Inter'] text-white/25 hover:text-white/50 text-xs tracking-wider transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
