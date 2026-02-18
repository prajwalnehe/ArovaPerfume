import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRupeeSign, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { fetchSarees } from '../services/api';

const BestSellers = () => {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchSarees('');
        // Filter products with discounts first, then regular products
        const productsWithDiscount = data
          .filter(p => (p.discountPercent > 0 || p.discount > 0) && p.images?.image1);
        
        const regularProducts = data
          .filter(p => p.images?.image1 && !productsWithDiscount.find(prod => prod._id === p._id));
        
        // Combine: discount products first, then regular products
        setProducts([...productsWithDiscount, ...regularProducts]);
      } catch (error) {
        console.error('Error loading best sellers:', error);
      }
    };

    loadProducts();
    
    // Load wishlist from localStorage
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading wishlist:', e);
    }
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkScrollButtons = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    const currentScroll = scrollContainer.scrollLeft;

    setCanScrollLeft(currentScroll > 0);
    setCanScrollRight(currentScroll < maxScroll - 1);
  };

  // Check scroll buttons on mount and when products change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkScrollButtons();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [products, isMobile]);

  // Auto-scroll for mobile and desktop
  useEffect(() => {
    if (products.length === 0 || isPaused) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Wait for DOM to be ready and calculate card width
    const startAutoScroll = () => {
      const flexContainer = scrollContainer.querySelector('.flex');
      if (!flexContainer) return;

      const firstCard = flexContainer.querySelector('div');
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 24; // gap-6 = 1.5rem = 24px
      // Mobile: scroll 1 card at a time (showing 2 cards), Desktop: scroll 4 cards at a time (showing 4 cards)
      const cardsToScroll = isMobile ? 1 : 4;
      const scrollAmount = (cardWidth + gap) * cardsToScroll;

      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }

      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainer && !isPaused) {
          const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
          const currentScroll = scrollContainer.scrollLeft;

          if (currentScroll >= maxScroll - 1) {
            // Loop back to start
            scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll cards
            scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      }, 3000); // Scroll every 3 seconds
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(startAutoScroll, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isMobile, products, isPaused]);

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

  const scrollLeft = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const flexContainer = scrollContainer.querySelector('.flex');
    if (!flexContainer) return;

    const firstCard = flexContainer.querySelector('div');
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const gap = 24;
    const cardsToScroll = isMobile ? 1 : 4;
    const scrollAmount = (cardWidth + gap) * cardsToScroll;

    scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  };

  const scrollRight = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const flexContainer = scrollContainer.querySelector('.flex');
    if (!flexContainer) return;

    const firstCard = flexContainer.querySelector('div');
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const gap = 24;
    const cardsToScroll = isMobile ? 1 : 4;
    const scrollAmount = (cardWidth + gap) * cardsToScroll;

    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-serif text-gray-800 mb-3 tracking-wide" style={{ fontFamily: 'serif' }}>
            Best-sellers
          </h2>
          <p className="text-base md:text-lg text-gray-600 font-light">
            Styled for All!
          </p>
        </div>

        {/* Product Cards - Horizontal Scroll */}
        <div className="relative -mx-4 px-4">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full shadow-lg p-2 md:p-3 hover:bg-gray-50 transition-all opacity-90 hover:opacity-100"
              aria-label="Scroll left"
            >
              <FaChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full shadow-lg p-2 md:p-3 hover:bg-gray-50 transition-all opacity-90 hover:opacity-100"
              aria-label="Scroll right"
            >
              <FaChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide"
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => {
              setTimeout(() => {
                setIsPaused(false);
                checkScrollButtons();
              }, 3000);
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onScroll={() => {
              setIsPaused(true);
              checkScrollButtons();
              // Clear existing timeout
              if (scrollIntervalRef.current?.pauseTimeout) {
                clearTimeout(scrollIntervalRef.current.pauseTimeout);
              }
              // Resume after 3 seconds of no scrolling
              scrollIntervalRef.current = scrollIntervalRef.current || {};
              scrollIntervalRef.current.pauseTimeout = setTimeout(() => {
                setIsPaused(false);
              }, 3000);
            }}
          >
            <div className="flex gap-6" style={{ scrollBehavior: 'smooth' }}>
            {products.map((product) => {
              const price = calculatePrice(product);
              const mrp = product.mrp || 0;
              const discount = calculateDiscount(product);
              const isWishlisted = wishlist.includes(product._id);

              return (
                <div
                  key={product._id}
                  className="flex-shrink-0 group bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 w-[calc(50vw-28px)] md:w-[calc(25%-18px)] min-w-[calc(50vw-28px)] md:min-w-[calc(25%-18px)]"
                  onClick={() => handleProductClick(product)}
                >
                {/* Image Container */}
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
                  
                  {/* Sale Tag */}
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded">
                      Sale
                    </div>
                  )}
                  
                  {/* Heart Icon */}
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

                {/* Product Info */}
                <div className="p-4 bg-white">
                  <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 min-h-[2.5rem]">
                    {product.title || 'Untitled Product'}
                  </h3>
                  <p className="text-xs font-normal text-gray-600 mb-2">
                    {product.product_info?.brand || ''}
                  </p>
                  
                  {/* Price Section */}
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;

