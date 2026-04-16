import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartContext } from '../utils/CartContext';

export default function ProductCard({ product, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [added,   setAdded]   = useState(false);
  const { addItem } = useCartContext();

  // Normalise: backend list endpoint returns `image` (string), detail returns `images` (array)
  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'];

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image container */}
      <div className="relative overflow-hidden bg-[#111118] aspect-[3/4]">
        {/* Badge */}
        {product.badge && (
          <span className="absolute top-4 left-4 z-10 bg-[#C8A96A] text-[#0B0B0F] text-[10px] font-['Inter'] font-semibold tracking-[0.2em] uppercase px-3 py-1">
            {product.badge}
          </span>
        )}

        {/* Product image */}
        <img
          src={hovered && images[1] ? images[1] : images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-[#0B0B0F]/40 flex items-end justify-center pb-6 transition-opacity duration-400 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleAddToCart}
            className={`font-['Inter'] text-xs tracking-[0.25em] uppercase px-8 py-3 transition-all duration-300 ${
              added
                ? 'bg-[#C8A96A] text-[#0B0B0F]'
                : 'bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-[#C8A96A] hover:border-[#C8A96A] hover:text-[#0B0B0F]'
            }`}
          >
            {added ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => e.preventDefault()}
          className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-all duration-300 ${
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
          aria-label="Add to wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A96A" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="pt-4 pb-2">
        <p className="font-['Cormorant_Garamond'] text-[#C8A96A]/60 text-xs tracking-[0.25em] uppercase mb-1">
          {product.category}
        </p>
        <h3 className="font-['Playfair_Display'] text-white text-base font-medium group-hover:text-[#C8A96A] transition-colors duration-300 mb-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-0.5">
            {Array(5).fill(null).map((_, i) => (
              <svg
                key={i}
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill={i < Math.floor(product.rating) ? '#C8A96A' : 'none'}
                stroke="#C8A96A"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span className="font-['Inter'] text-white/30 text-[11px]">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="font-['Cormorant_Garamond'] text-white text-lg font-medium">
            ${product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="font-['Cormorant_Garamond'] text-white/30 text-base line-through">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
