import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products as productsApi } from '../utils/api';
import { products as staticProducts } from '../utils/products';
import { useCartContext } from '../utils/CartContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartContext();

  const [product,     setProduct]     = useState(null);
  const [related,     setRelated]     = useState([]);
  const [notFound,    setNotFound]    = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity,    setQuantity]    = useState(1);
  const [size,        setSize]        = useState('');
  const [added,       setAdded]       = useState(false);
  const [activeTab,   setActiveTab]   = useState('details');

  // Load product from API, fall back to static data
  useEffect(() => {
    setActiveImage(0);
    setProduct(null);
    setNotFound(false);

    productsApi.bySlug(slug)
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          // Load related products from same category
          return productsApi.list({ category: data.product.category, limit: 5 });
        }
      })
      .then((data) => {
        if (data?.products) {
          const normalised = data.products
            .filter((p) => p.slug !== slug)
            .slice(0, 4)
            .map((p) => ({ ...p, images: p.images ?? (p.image ? [p.image] : []) }));
          setRelated(normalised);
        }
      })
      .catch(() => {
        // Fallback to static data
        const staticProduct = staticProducts.find((p) => p.slug === slug);
        if (staticProduct) {
          setProduct(staticProduct);
          setRelated(
            staticProducts
              .filter((p) => p.category === staticProduct.category && p.slug !== slug)
              .slice(0, 4)
          );
        } else {
          setNotFound(true);
        }
      });
  }, [slug]);

  if (notFound) {
    return (
      <main className="bg-[#0B0B0F] min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="font-['Playfair_Display'] text-white/20 text-5xl mb-6">Piece Not Found</p>
          <Link to="/shop" className="font-['Cormorant_Garamond'] text-[#C8A96A] text-lg tracking-wider underline">
            Return to Collections
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    // Loading skeleton
    return (
      <main className="bg-[#0B0B0F] min-h-screen pt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="aspect-[4/5] bg-[#111118] animate-pulse" />
            <div className="space-y-4">
              <div className="h-6 w-24 bg-[#111118] animate-pulse" />
              <div className="h-12 w-3/4 bg-[#111118] animate-pulse" />
              <div className="h-8 w-32 bg-[#111118] animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate('/cart');
  };

  const sizes = ['4', '5', '6', '7', '8', '9', '10'];

  return (
    <main className="bg-[#0B0B0F] min-h-screen pt-24">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <nav className="flex items-center gap-2 font-['Cormorant_Garamond'] text-sm text-white/30">
          <Link to="/" className="hover:text-[#C8A96A] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#C8A96A] transition-colors">Collections</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-[#C8A96A] transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-white/60">{product.name}</span>
        </nav>
      </div>

      {/* Product layout */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Images */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="flex flex-col gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-20 overflow-hidden border-2 transition-all duration-300 ${
                    activeImage === i ? 'border-[#C8A96A]' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div className="flex-1 relative overflow-hidden bg-[#111118] aspect-[4/5]">
              {product.badge && (
                <span className="absolute top-4 left-4 z-10 bg-[#C8A96A] text-[#0B0B0F] text-[10px] font-['Inter'] font-semibold tracking-[0.2em] uppercase px-3 py-1">
                  {product.badge}
                </span>
              )}
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="font-['Cormorant_Garamond'] text-[#C8A96A] text-sm tracking-[0.3em] uppercase mb-3">
              {product.category}
            </p>
            <h1 className="font-['Playfair_Display'] text-white text-4xl md:text-5xl font-bold mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1">
                {Array(5).fill(null).map((_, i) => (
                  <svg
                    key={i}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={i < Math.floor(product.rating) ? '#C8A96A' : 'none'}
                    stroke="#C8A96A"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="font-['Cormorant_Garamond'] text-white/50 text-base">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-[#C8A96A]/10">
              <span className="font-['Playfair_Display'] text-[#C8A96A] text-4xl font-bold">
                ${product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="font-['Cormorant_Garamond'] text-white/30 text-2xl line-through">
                  ${product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.originalPrice && (
                <span className="font-['Inter'] text-xs bg-[#C8A96A]/10 text-[#C8A96A] px-2 py-1 tracking-wider">
                  Save ${(product.originalPrice - product.price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="font-['Cormorant_Garamond'] text-white/60 text-lg leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Size selector (for rings) */}
            {product.category === 'Rings' && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-['Cormorant_Garamond'] text-white/70 text-sm tracking-[0.2em] uppercase">
                    Ring Size
                  </p>
                  <button className="font-['Cormorant_Garamond'] text-[#C8A96A] text-sm underline">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`w-10 h-10 border text-sm font-['Cormorant_Garamond'] transition-all duration-300 ${
                        size === s
                          ? 'bg-[#C8A96A] border-[#C8A96A] text-[#0B0B0F]'
                          : 'border-[#C8A96A]/20 text-white/60 hover:border-[#C8A96A]/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-8">
              <p className="font-['Cormorant_Garamond'] text-white/70 text-sm tracking-[0.2em] uppercase">
                Quantity
              </p>
              <div className="flex items-center border border-[#C8A96A]/20">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-[#C8A96A] transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-['Cormorant_Garamond'] text-white text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-[#C8A96A] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-4 font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase transition-all duration-300 ${
                  added
                    ? 'bg-[#C8A96A] text-[#0B0B0F]'
                    : 'border border-[#C8A96A] text-[#C8A96A] hover:bg-[#C8A96A] hover:text-[#0B0B0F]'
                }`}
              >
                {added ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-4 bg-[#C8A96A] text-[#0B0B0F] font-['Inter'] text-xs font-semibold tracking-[0.3em] uppercase hover:bg-[#E2C98A] transition-colors duration-300"
              >
                Buy Now
              </button>
              <button
                className="w-14 h-14 border border-[#C8A96A]/20 flex items-center justify-center text-white/40 hover:text-[#C8A96A] hover:border-[#C8A96A]/50 transition-all duration-300"
                aria-label="Add to wishlist"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-[#C8A96A]/10">
              {[
                { icon: '🛡️', label: 'Authenticity Guaranteed' },
                { icon: '🚚', label: 'Free Shipping' },
                { icon: '↩️', label: '30-Day Returns' },
              ].map((badge) => (
                <div key={badge.label} className="text-center">
                  <span className="text-xl block mb-1">{badge.icon}</span>
                  <p className="font-['Cormorant_Garamond'] text-white/40 text-xs leading-tight">
                    {badge.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-20 border-t border-[#C8A96A]/10 pt-12">
          <div className="flex gap-8 border-b border-[#C8A96A]/10 mb-10">
            {['details', 'care', 'shipping'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-['Cormorant_Garamond'] text-base tracking-[0.2em] uppercase pb-4 border-b-2 transition-all duration-300 capitalize ${
                  activeTab === tab
                    ? 'border-[#C8A96A] text-[#C8A96A]'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {tab === 'details' ? 'Product Details' : tab === 'care' ? 'Care Guide' : 'Shipping & Returns'}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <ul className="space-y-3">
              {product.details.map((detail, i) => (
                <li key={i} className="flex items-center gap-3 font-['Cormorant_Garamond'] text-white/60 text-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] flex-shrink-0" />
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'care' && (
            <div className="space-y-4 font-['Cormorant_Garamond'] text-white/60 text-lg leading-relaxed max-w-2xl">
              <p>Store your Sarélia piece in the provided pouch or box when not wearing it to prevent scratches.</p>
              <p>Avoid contact with perfumes, lotions, and household chemicals. Remove jewelry before swimming or bathing.</p>
              <p>Clean gently with a soft, lint-free cloth. For deeper cleaning, use a mild soap solution and a soft brush.</p>
              <p>Bring your piece to a Sarélia boutique annually for professional cleaning and inspection.</p>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 font-['Cormorant_Garamond'] text-white/60 text-lg leading-relaxed max-w-2xl">
              <p>Complimentary shipping on all orders over $500. Standard delivery in 3–5 business days.</p>
              <p>Express delivery available (1–2 business days) for an additional fee. All orders are fully insured.</p>
              <p>Returns accepted within 30 days of delivery. Items must be unworn and in original packaging.</p>
              <p>Bespoke and engraved pieces are non-returnable. Contact us for exchanges.</p>
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-24">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-['Playfair_Display'] text-white text-3xl font-bold">
                You May Also Love
              </h2>
              <Link
                to={`/shop?category=${product.category}`}
                className="font-['Cormorant_Garamond'] text-[#C8A96A] text-base tracking-wider hover:gap-4 transition-all duration-300 flex items-center gap-2"
              >
                View All {product.category}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
