import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSarees } from '../services/api';
import ProductImage from './ProductImage';

const MensSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchSarees('men', { limit: 8 });
        const list = Array.isArray(response) ? response : response?.products || [];
        if (!ignore) setProducts(list.slice(0, 4));
      } catch {
        if (!ignore) setProducts([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-semibold text-black tracking-wide">Men</h2>
          <p className="mt-2 text-xs sm:text-sm text-[#5f5f5f]">
            Discover your signature fragrance from our exclusive collection for Men
          </p>
          <Link
            to="/category/men"
            className="inline-block mt-3 bg-black text-white px-6 py-2 text-xs sm:text-sm tracking-wide hover:bg-gray-800 transition-colors"
          >
            DISCOVER
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((item, idx) => {
            const id = item._id || item.id;
            if (!id) return null;
            const name = item.title || item.name || 'Perfume';
            const notes = item.type || item.subcategory || item.category || '';
            const price = Number(item.price || item.salePrice || item.mrp || 0);
            const mrp = Number(item.mrp || 0);
            const img = item.images?.image1 || item.image;

            return (
              <Link key={id} to={`/product/${id}`} className="group block">
                <div className="relative bg-white border border-gray-200 overflow-hidden">
                  <ProductImage src={img} alt={name} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-500" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 bg-[#f16b80] text-white text-[9px] px-2 py-1 rounded-full font-semibold">
                      HIGHLY RECOMMENDED
                    </span>
                  )}
                </div>
                <div className="pt-3 text-center">
                  <h3 className="text-xs sm:text-sm font-semibold text-black line-clamp-1">{name}</h3>
                  {notes ? <p className="text-[11px] sm:text-xs text-gray-600 mt-1 line-clamp-1">{notes}</p> : <div className="h-4" />}
                  <p className="mt-1 text-sm font-bold text-black">Rs.{price.toLocaleString('en-IN')}</p>
                  {mrp > price ? (
                    <p className="text-xs text-gray-400 line-through">Rs.{mrp.toLocaleString('en-IN')}</p>
                  ) : (
                    <div className="h-4" />
                  )}
                  <span className="mt-3 block w-full border border-gray-400 text-xs sm:text-sm py-2.5 hover:bg-gray-50 transition-colors">
                    View Details
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MensSection;
