import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRupeeSign, FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa';
import { fetchSarees } from '../services/api';
import { getCachedProducts, setCachedProducts } from '../utils/cache';

const TrendingNow = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const sectionRef = useRef(null);
  const navigate = useNavigate();

  const PRODUCTS_PER_PAGE = 20;
  const CACHE_KEY = 'trending_products_cache';

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setLoadedFromCache(false);

        const cachedProducts = await getCachedProducts(CACHE_KEY);
        
        if (cachedProducts && cachedProducts.length > 0) {
          const availableProducts = cachedProducts.filter(p => p.images?.image1);
          setAllProducts(availableProducts);
          setDisplayedProducts(availableProducts.slice(0, PRODUCTS_PER_PAGE));
          setHasMore(availableProducts.length > PRODUCTS_PER_PAGE);
          setLoadedFromCache(true);
          setLoading(false);
          
          setTimeout(() => setLoadedFromCache(false), 3000);
          return;
        }

        const data = await fetchSarees('');
        const availableProducts = data.filter(p => p.images?.image1);
        
        await setCachedProducts(CACHE_KEY, availableProducts);
        
        setAllProducts(availableProducts);
        setDisplayedProducts(availableProducts.slice(0, PRODUCTS_PER_PAGE));
        setHasMore(availableProducts.length > PRODUCTS_PER_PAGE);
      } catch (error) {
        console.error('Error loading trending products:', error);
        const cachedProducts = await getCachedProducts(CACHE_KEY);
        if (cachedProducts && cachedProducts.length > 0) {
          const availableProducts = cachedProducts.filter(p => p.images?.image1);
          setAllProducts(availableProducts);
          setDisplayedProducts(availableProducts.slice(0, PRODUCTS_PER_PAGE));
          setHasMore(availableProducts.length > PRODUCTS_PER_PAGE);
          setLoadedFromCache(true);
          setTimeout(() => setLoadedFromCache(false), 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading wishlist:', e);
    }
  }, []);

  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    setTimeout(() => {
      const currentCount = displayedProducts.length;
      const nextBatch = allProducts.slice(currentCount, currentCount + PRODUCTS_PER_PAGE);
      
      if (nextBatch.length > 0) {
        setDisplayedProducts(prev => [...prev, ...nextBatch]);
        setHasMore(currentCount + PRODUCTS_PER_PAGE < allProducts.length);
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    }, 300);
  }, [allProducts, displayedProducts.length, loadingMore, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || loadingMore || !hasMore) return;

      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      
      if (rect.bottom <= windowHeight + 200) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreProducts, loadingMore, hasMore]);

  const toggleWishlist = (productId, e) => {
    e.stopPropagation();
    try {
      const saved = localStorage.getItem('wishlist');
      let items = saved ? JSON.parse(saved) : [];
      
      if (items.includes(productId)) {
        items = items.filter(id => id !== productId);
      } else {
        items.push(productId);
      }
      
      localStorage.setItem('wishlist', JSON.stringify(items));
      setWishlist(items);
    } catch (e) {
      console.error('Error updating wishlist:', e);
    }
  };

  const calculatePrice = (product) => {
    if (product.price) return product.price;
    if (product.mrp && product.discountPercent) {
      return Math.round(product.mrp - (product.mrp * product.discountPercent / 100));
    }
    return product.mrp || 0;
  };

  const calculateDiscount = (product) => {
    if (product.discountPercent) return product.discountPercent;
    if (product.discount) return product.discount;
    if (product.mrp && product.price) {
      return Math.round(((product.mrp - product.price) / product.mrp) * 100);
    }
    return 0;
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`);
  };

  if (loading && displayedProducts.length === 0) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-serif text-gray-800 mb-3 tracking-wide" style={{ fontFamily: 'serif' }}>
              Trending Now
            </h2>
            <p className="text-base md:text-lg text-gray-600 font-light italic">
              Serving looks, garma-garam!
            </p>
          </div>
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <FaSpinner className="animate-spin text-5xl text-pink-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading products...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (displayedProducts.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-serif text-gray-800 mb-3 tracking-wide" style={{ fontFamily: 'serif' }}>
            Trending Now
          </h2>
          <p className="text-base md:text-lg text-gray-600 font-light italic">
            Serving looks, garma-garam!
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedProducts.map((product) => {
            const price = calculatePrice(product);
            const mrp = product.mrp || 0;
            const discount = calculateDiscount(product);
            const isWishlisted = wishlist.includes(product._id);

            return (
              <div
                key={product._id}
                className="group bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                onClick={() => handleProductClick(product)}
              >
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  <img
                    src={product.images?.image1 || 'https://via.placeholder.com/300x400?text=Image+Not+Available'}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x400?text=Image+Not+Available';
                    }}
                  />
                  
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded">
                      Sale
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => toggleWishlist(product._id, e)}
                    className="absolute top-2 right-2 md:top-3 md:right-3 bg-white rounded-full p-1 md:p-2 shadow-sm hover:shadow-md transition-all z-10"
                  >
                    {isWishlisted ? (
                      <FaHeart className="text-red-500 w-3 h-3 md:w-4 md:h-4" />
                    ) : (
                      <FaRegHeart className="text-gray-700 w-3 h-3 md:w-4 md:h-4" />
                    )}
                  </button>
                </div>

                <div className="p-4 bg-white">
                  <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 min-h-[2.5rem]">
                    {product.title || 'Untitled Product'}
                  </h3>
                  <p className="text-xs font-normal text-gray-600 mb-2">
                    {product.product_info?.brand || ''}
                  </p>
                  
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2 mb-1">
                      <div className="flex items-center">
                        <FaRupeeSign className="h-3.5 w-3.5 text-gray-900" />
                        <span className="text-lg font-bold text-gray-900">
                          {price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {mrp > price && (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="text-sm font-semibold text-green-600">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <FaSpinner className="animate-spin text-2xl text-pink-600" />
            <span className="ml-3 text-gray-600">Loading more products...</span>
          </div>
        )}

        {!hasMore && displayedProducts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">You've seen all trending products!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingNow;
