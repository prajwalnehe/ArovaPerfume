import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { fetchSarees } from '../services/api';
import ProductImage from './ProductImage';

const readWishlist = () => {
  try {
    const raw = localStorage.getItem('wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeWishlist = (items) => {
  try {
    localStorage.setItem('wishlist', JSON.stringify(items));
  } catch {}
};

const ProductSuggestions = ({ currentProductId, category, maxProducts = 8 }) => {
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setLoading(true);
        // Fetch products from the same category
        const categoryName = category || '';
        const allProducts = await fetchSarees(categoryName);
        
        // Filter out the current product and limit to maxProducts
        const filtered = (allProducts || [])
          .filter(product => {
            const productId = product._id || product.id;
            return productId !== currentProductId;
          })
          .slice(0, maxProducts);
        
        setSuggestedProducts(filtered);
      } catch (error) {
        console.error('Error loading product suggestions:', error);
        setSuggestedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId) {
      loadSuggestions();
    }
  }, [currentProductId, category, maxProducts]);

  useEffect(() => {
    const list = readWishlist();
    setWishlistItems(list);
    
    const handleWishlistUpdate = () => {
      const updatedList = readWishlist();
      setWishlistItems(updatedList);
    };
    
    window.addEventListener('wishlist:updated', handleWishlistUpdate);
    window.addEventListener('storage', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlist:updated', handleWishlistUpdate);
      window.removeEventListener('storage', handleWishlistUpdate);
    };
  }, []);

  const handleProductClick = (productId) => {
    if (productId) {
      navigate(`/product/${productId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWishlistToggle = (e, product) => {
    e.stopPropagation();
    const pid = product._id || product.id;
    const list = readWishlist();
    const exists = list.some(p => (p._id || p.id) === pid);
    
    if (exists) {
      const next = list.filter(p => (p._id || p.id) !== pid);
      writeWishlist(next);
      setWishlistItems(next);
      try { window.dispatchEvent(new Event('wishlist:updated')); } catch {}
    } else {
      const sellingPrice = product.price || Math.round(product.mrp - (product.mrp * (product.discountPercent || 0) / 100));
      const item = {
        _id: pid,
        title: product.title,
        images: product.images,
        price: sellingPrice,
        mrp: product.mrp,
        discountPercent: product.discountPercent || 0,
      };
      const next = [item, ...list.filter((p) => (p._id || p.id) !== pid)];
      writeWishlist(next);
      setWishlistItems(next);
      try { window.dispatchEvent(new Event('wishlist:updated')); } catch {}
    }
  };

  const isWishlisted = (productId) => {
    return wishlistItems.some(p => (p._id || p.id) === productId);
  };

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-80 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (suggestedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {suggestedProducts.map((product) => {
            const productId = product._id || product.id;
            const sellingPrice = product.price || Math.round(product.mrp - (product.mrp * (product.discountPercent || 0) / 100));
            const imageUrl = product.images?.image1 || product.image;
            
            return (
              <div
                key={productId}
                className="group bg-white overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300"
                onClick={() => handleProductClick(productId)}
              >
                {/* Image Container */}
                <div className="relative pt-[130%]">
                  <ProductImage
                    src={imageUrl}
                    alt={product.title || product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Wishlist Icon */}
                  <button
                    onClick={(e) => handleWishlistToggle(e, product)}
                    className="absolute top-2 right-2 md:top-3 md:right-3 bg-white rounded-full p-1 md:p-2 shadow-sm hover:shadow-md transition-all z-10"
                    aria-label={isWishlisted(productId) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isWishlisted(productId) ? (
                      <FaHeart className="text-red-500 w-3 h-3 md:w-4 md:h-4" />
                    ) : (
                      <FaRegHeart className="text-gray-700 w-3 h-3 md:w-4 md:h-4" />
                    )}
                  </button>
                  
                  {/* Discount Badge */}
                  {product.discountPercent > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {product.discountPercent}% OFF
                    </div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="pt-3 pb-4 flex-1 flex flex-col text-left px-2">
                  <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                    {product.title || product.name}
                  </h3>
                  <p className="text-xs font-normal text-gray-600 mb-2">
                    {product.product_info?.brand || ''}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-900">
                      ₹{sellingPrice.toLocaleString()}
                    </span>
                    {product.mrp && product.mrp > sellingPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{product.mrp.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductSuggestions;

