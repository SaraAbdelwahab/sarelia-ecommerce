import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { products as productsApi } from '../utils/api';
import { products as staticProducts } from '../utils/products';

const CATEGORIES = ['All', 'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Accessories'];
const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const searchQuery     = searchParams.get('search')   || '';

  const [activeCategory, setActiveCategory] = useState(
    CATEGORIES.includes(initialCategory) ? initialCategory : 'All'
  );
  const [sort,     setSort]     = useState('featured');
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  // Fetch from backend whenever filters change
  useEffect(() => {
    setLoading(true);
    const params = { sort };
    if (activeCategory !== 'All') params.category = activeCategory;
    if (searchQuery)               params.search   = searchQuery;

    productsApi.list(params)
      .then((data) => {
        if (data.products) {
          // Normalise: list endpoint returns `image` (single string), add `images` array
          const normalised = data.products.map((p) => ({
            ...p,
            images: p.images ?? (p.image ? [p.image] : []),
          }));
          setItems(normalised);
          setTotal(data.pagination?.total ?? normalised.length);
        }
      })
      .catch(() => {
        // Fallback to static data if backend is offline
        let list = [...staticProducts];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          list = list.filter(
            (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
          );
        }
        if (activeCategory !== 'All') list = list.filter((p) => p.category === activeCategory);
        setItems(list);
        setTotal(list.length);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, sort, searchQuery]);

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') params.delete('category');
    else params.set('category', cat);
    setSearchParams(params);
  };

  return (
    <main className="bg-[#0B0B0F] min-h-screen pt-24">
      {/* Header */}
      <div className="border-b border-[#C8A96A]/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="font-['Inter'] text-[#C8A96A] text-xs tracking-[0.4em] uppercase mb-3">
            {searchQuery ? `Search: "${searchQuery}"` : 'Explore'}
          </p>
          <h1 className="font-['Playfair_Display'] text-white text-5xl md:text-6xl font-bold">
            {searchQuery ? 'Search Results' : 'All Collections'}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`font-['Cormorant_Garamond'] text-sm tracking-[0.2em] uppercase px-5 py-2 border transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-[#C8A96A] border-[#C8A96A] text-[#0B0B0F]'
                    : 'border-[#C8A96A]/20 text-white/60 hover:border-[#C8A96A]/50 hover:text-[#C8A96A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort + count */}
          <div className="flex items-center gap-4">
            <span className="font-['Cormorant_Garamond'] text-white/30 text-sm">
              {loading ? '…' : `${total} ${total === 1 ? 'piece' : 'pieces'}`}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-[#111118] border border-[#C8A96A]/20 text-white/70 font-['Cormorant_Garamond'] text-sm px-4 py-2 outline-none focus:border-[#C8A96A]/50 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#111118] animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <p className="font-['Playfair_Display'] text-white/20 text-4xl mb-4">No pieces found</p>
            <p className="font-['Cormorant_Garamond'] text-white/30 text-lg">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
