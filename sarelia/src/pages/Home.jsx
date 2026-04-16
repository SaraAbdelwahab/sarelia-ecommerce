import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { products as productsApi } from '../utils/api';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

// Static fallback data (used while API loads or if backend is offline)
import { products as staticProducts, categories as staticCategories } from '../utils/products';

/* ── Animated counter ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.5);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Section wrapper with fade-in ── */
function FadeSection({ children, className = '', delay = 0 }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const [heroOffset, setHeroOffset] = useState(0);
  const [featured, setFeatured]     = useState(staticProducts.slice(0, 4));
  const [categories, setCategories] = useState(staticCategories);

  // Parallax on hero
  useEffect(() => {
    const onScroll = () => setHeroOffset(window.scrollY * 0.35);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load real data from backend
  useEffect(() => {
    productsApi.list({ sort: 'featured', limit: 4 })
      .then((data) => {
        if (data.products?.length) {
          // Normalise: list endpoint returns `image` (single), add `images` array
          setFeatured(
            data.products.slice(0, 4).map((p) => ({
              ...p,
              images: p.images ?? (p.image ? [p.image] : []),
            }))
          );
        }
      })
      .catch(() => { /* keep static fallback */ });

    productsApi.categories()
      .then((data) => {
        if (data.categories?.length) setCategories(data.categories);
      })
      .catch(() => { /* keep static fallback */ });
  }, []);

  return (
    <main className="bg-[#0B0B0F] overflow-hidden">
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background image with parallax */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${heroOffset}px)` }}
        >
          <img
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1800&q=85"
            alt=""
            className="w-full h-[120%] object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0F]/70 via-[#0B0B0F]/40 to-[#0B0B0F]" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-24">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div className="flex-1">
              {/* Label */}
              <div className="flex items-center gap-3 mb-8">
                <span className="font-['Inter'] text-[#C8A96A] text-xs tracking-[0.4em] uppercase">01</span>
                <span className="w-12 h-px bg-[#C8A96A]/40" />
                <span className="font-['Inter'] text-white/40 text-xs tracking-[0.3em] uppercase">New Collection</span>
              </div>

              {/* Headline */}
              <h1 className="font-['Playfair_Display'] font-bold leading-[0.9] text-white">
                <span
                  className="block text-[clamp(3.5rem,10vw,9rem)] animate-fade-in-up"
                  style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
                >
                  Wonderful
                </span>
                <span
                  className="block text-[clamp(3.5rem,10vw,9rem)] animate-fade-in-up"
                  style={{ animationDelay: '0.25s', opacity: 0, animationFillMode: 'forwards' }}
                >
                  <span className="italic text-[#C8A96A]">Jewelry</span>
                </span>
                <span
                  className="block text-[clamp(3.5rem,10vw,9rem)] animate-fade-in-up"
                  style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}
                >
                  Collections
                </span>
              </h1>

              {/* CTA */}
              <div
                className="mt-10 flex items-center gap-6 animate-fade-in-up"
                style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}
              >
                <Link
                  to="/shop"
                  className="group relative inline-flex items-center gap-3 bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase px-8 py-4 overflow-hidden transition-all duration-300 hover:bg-[#E2C98A]"
                >
                  Explore Collection
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/about"
                  className="font-['Cormorant_Garamond'] text-white/60 hover:text-[#C8A96A] text-base tracking-wider transition-colors duration-300 border-b border-white/20 hover:border-[#C8A96A]/50 pb-0.5"
                >
                  Our Story
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div
              className="flex flex-row md:flex-col gap-8 md:gap-6 animate-fade-in-up"
              style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="text-right">
                <p className="font-['Inter'] text-[#C8A96A]/50 text-[10px] tracking-[0.3em] uppercase mb-1">Collections</p>
                <p className="font-['Playfair_Display'] text-white text-4xl font-bold">
                  230K<sup className="text-[#C8A96A] text-xl">+</sup>
                </p>
              </div>
              <div className="text-right">
                <p className="font-['Inter'] text-[#C8A96A]/50 text-[10px] tracking-[0.3em] uppercase mb-1">Clients</p>
                <p className="font-['Playfair_Display'] text-white text-4xl font-bold">
                  48K<sup className="text-[#C8A96A] text-xl">+</sup>
                </p>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="font-['Inter'] text-white/30 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-[#C8A96A]/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARQUEE STRIP
      ══════════════════════════════════════════ */}
      <div className="border-y border-[#C8A96A]/10 py-5 overflow-hidden bg-[#0B0B0F]">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array(6).fill(null).map((_, i) => (
            <span key={i} className="font-['Playfair_Display'] italic text-[#C8A96A]/30 text-lg mx-10 tracking-widest">
              We Make The Best Jewelry ✦ Experts With Decades Of Experience ✦ Crafted With Devotion ✦
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ABOUT STRIP
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <FadeSection>
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <p className="font-['Playfair_Display'] text-white text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight">
                We make the best{' '}
                <span className="inline-block relative mx-2">
                  <img
                    src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&q=80"
                    alt=""
                    className="inline-block w-20 h-10 object-cover rounded-full align-middle"
                  />
                </span>{' '}
                jewelry by experts who have decades of experience{' '}
                <span className="inline-block relative mx-2">
                  <img
                    src="https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&q=80"
                    alt=""
                    className="inline-block w-20 h-10 object-cover rounded-full align-middle"
                  />
                </span>{' '}
                in the field.
              </p>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border border-[#C8A96A]/30 rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Playfair_Display'] text-white text-sm font-medium">Certified Authentic</p>
                  <p className="font-['Cormorant_Garamond'] text-white/40 text-sm">Every piece GIA certified</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border border-[#C8A96A]/30 rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Playfair_Display'] text-white text-sm font-medium">Lifetime Warranty</p>
                  <p className="font-['Cormorant_Garamond'] text-white/40 text-sm">Crafted to last forever</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border border-[#C8A96A]/30 rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-['Playfair_Display'] text-white text-sm font-medium">Free Worldwide Shipping</p>
                  <p className="font-['Cormorant_Garamond'] text-white/40 text-sm">On all orders over $500</p>
                </div>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <FadeSection>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-['Inter'] text-[#C8A96A] text-xs tracking-[0.4em] uppercase mb-3">Browse By</p>
              <h2 className="font-['Playfair_Display'] text-white text-4xl md:text-5xl font-bold">
                Our Collections
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 font-['Cormorant_Garamond'] text-[#C8A96A] text-base tracking-wider hover:gap-4 transition-all duration-300"
            >
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </FadeSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <FadeSection key={cat.id} delay={i * 100}>
              <Link
                to={`/shop?category=${cat.name}`}
                className="group relative overflow-hidden aspect-[3/4] block"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F]/80 via-[#0B0B0F]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-['Playfair_Display'] text-white text-2xl font-bold mb-1">
                    {cat.name}
                  </h3>
                  <p className="font-['Cormorant_Garamond'] text-[#C8A96A]/70 text-sm tracking-wider">
                    {cat.count} pieces
                  </p>
                </div>
                <div className="absolute inset-0 border border-[#C8A96A]/0 group-hover:border-[#C8A96A]/30 transition-all duration-500" />
              </Link>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LOVE STORY BANNER
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-32">
        <img
          src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1800&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0B0B0F]/75" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <FadeSection>
            <div className="max-w-2xl">
              <p className="font-['Inter'] text-[#C8A96A] text-xs tracking-[0.4em] uppercase mb-6">
                Our Promise
              </p>
              <h2 className="font-['Playfair_Display'] text-white text-[clamp(2.5rem,6vw,5rem)] font-bold leading-tight mb-8">
                Tell Your Love Story With An Everlasting Piece
              </h2>
              <p className="font-['Cormorant_Garamond'] text-white/60 text-xl leading-relaxed mb-10">
                Every Sarélia piece is a testament to enduring love and exceptional craftsmanship.
                From the first sketch to the final polish, we pour our hearts into every creation.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 border border-[#C8A96A]/50 text-[#C8A96A] font-['Inter'] text-xs tracking-[0.3em] uppercase px-8 py-4 hover:bg-[#C8A96A] hover:text-[#0B0B0F] transition-all duration-300"
              >
                Discover More
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <FadeSection>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-['Inter'] text-[#C8A96A] text-xs tracking-[0.4em] uppercase mb-3">Handpicked</p>
              <h2 className="font-['Playfair_Display'] text-white text-4xl md:text-5xl font-bold">
                Our Best Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 font-['Cormorant_Garamond'] text-[#C8A96A] text-base tracking-wider hover:gap-4 transition-all duration-300"
            >
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </FadeSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featured.map((product, i) => (
            <FadeSection key={product.id} delay={i * 120}>
              <ProductCard product={product} index={i} />
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════ */}
      <section className="border-y border-[#C8A96A]/10 py-16 bg-[#111118]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 230000, suffix: '+', label: 'Pieces Crafted' },
              { value: 48, suffix: 'K+', label: 'Happy Clients' },
              { value: 25, suffix: '+', label: 'Years Experience' },
              { value: 12, suffix: '', label: 'Global Boutiques' },
            ].map((stat, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div>
                  <p className="font-['Playfair_Display'] text-[#C8A96A] text-4xl md:text-5xl font-bold mb-2">
                    <Counter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="font-['Cormorant_Garamond'] text-white/40 text-base tracking-wider">
                    {stat.label}
                  </p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HIGH QUALITY BANNER
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <FadeSection>
          <div className="relative overflow-hidden bg-[#111118] p-12 md:p-20 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <p className="font-['Inter'] text-[#C8A96A] text-xs tracking-[0.4em] uppercase mb-4">
                Premium Quality
              </p>
              <h2 className="font-['Playfair_Display'] text-white text-[clamp(2rem,5vw,4rem)] font-bold leading-tight mb-6">
                High Quality Jewelry For You
              </h2>
              <p className="font-['Cormorant_Garamond'] text-white/50 text-xl leading-relaxed mb-8 max-w-md">
                Each piece in our collection is meticulously crafted using only the finest materials —
                ethically sourced gemstones and recycled precious metals.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase px-8 py-4 hover:bg-[#E2C98A] transition-colors duration-300"
              >
                Shop Now
              </Link>
            </div>
            <div className="flex-shrink-0 relative">
              <img
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80"
                alt="High quality jewelry"
                className="w-72 h-80 object-cover"
              />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 border border-[#C8A96A]/20" />
              <div className="absolute -top-4 -right-4 w-32 h-32 border border-[#C8A96A]/20" />
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ══════════════════════════════════════════
          QUALITY MARQUEE
      ══════════════════════════════════════════ */}
      <div className="border-y border-[#C8A96A]/10 py-6 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array(4).fill(null).map((_, i) => (
            <span key={i} className="font-['Playfair_Display'] text-[clamp(2rem,6vw,5rem)] font-bold text-[#C8A96A]/8 mx-8 tracking-widest uppercase">
              Quality ✦ Jewelry ✦ For You ✦ Sarélia ✦
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
