import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { searchProducts } from '../services/api';
import ProductImage from './ProductImage';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchWrapRefMobile = useRef(null);
  const searchWrapRefDesktop = useRef(null);
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const readWishlistCount = () => {
      try {
        const raw = localStorage.getItem('wishlist');
        const list = raw ? JSON.parse(raw) : [];
        setWishlistCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setWishlistCount(0);
      }
    };
    readWishlistCount();
    const onStorage = (e) => {
      if (!e || e.key === 'wishlist') readWishlistCount();
    };
    const onCustom = () => readWishlistCount();
    window.addEventListener('storage', onStorage);
    window.addEventListener('wishlist:updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('wishlist:updated', onCustom);
    };
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        setIsAuthenticated(Boolean(token));
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    const onStorage = (e) => {
      if (!e || e.key === 'auth_token') {
        checkAuth();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
    } catch {}
    setIsAuthenticated(false);
    navigate('/signin');
  };

  const handleLogin = () => {
    navigate('/signin');
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchOpen(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchProducts(q);
        const items = data?.results || [];
        setSearchResults(items);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const onClick = (e) => {
      const inMobile = searchWrapRefMobile.current && searchWrapRefMobile.current.contains(e.target);
      const inDesktop = searchWrapRefDesktop.current && searchWrapRefDesktop.current.contains(e.target);
      if (!inMobile && !inDesktop) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && !e.target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  // Navigation links matching suuupply style
  const navLinks = [
    { name: 'MEN', path: '/category/men' },
    { name: 'WOMEN', path: '/category/women' },
  ];

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative z-[70]">
      <div className="bg-black text-white text-[10px] sm:text-xs md:text-sm font-medium tracking-wide py-1.5 overflow-hidden whitespace-nowrap">
        <div className="animate-scroll inline-flex min-w-max">
          <span className="px-4 sm:px-6">• 1st Order - 50% Off • USE CODE SMELLGOOD5 TO GET EXTRA 5% OFF ON PREPAID ORDERS • GET A FREE SAMPLE ON EVERY ORDER •</span>
          <span className="px-4 sm:px-6">• 1st Order - 50% Off • USE CODE SMELLGOOD5 TO GET EXTRA 5% OFF ON PREPAID ORDERS • GET A FREE SAMPLE ON EVERY ORDER •</span>
          <span className="px-4 sm:px-6">• 1st Order - 50% Off • USE CODE SMELLGOOD5 TO GET EXTRA 5% OFF ON PREPAID ORDERS • GET A FREE SAMPLE ON EVERY ORDER •</span>
          <span className="px-4 sm:px-6">• 1st Order - 50% Off • USE CODE SMELLGOOD5 TO GET EXTRA 5% OFF ON PREPAID ORDERS • GET A FREE SAMPLE ON EVERY ORDER •</span>
        </div>
      </div>
      <nav className="bg-white border-b border-gray-200 border-t-0">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-12 sm:h-14 md:h-16 gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:h-16">
          {/* Left: Search + Category Links */}
          <div className="hidden lg:flex items-center justify-start gap-4 xl:gap-6 2xl:gap-8">
            {/* Search Icon - Desktop (left of categories) */}
            <div className="relative pr-2 xl:pr-3" ref={searchWrapRefDesktop}>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 sm:p-2 text-gray-700 hover:text-black transition-colors"
                aria-label="Search"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {searchOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 lg:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-[80] p-3 sm:p-4">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => { const v = e.target.value; setSearchQuery(v); setSearchOpen(v.trim().length >= 2); }}
                    onKeyPress={handleSearchKeyPress}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {searchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
                  )}
                  {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <ul className="max-h-80 overflow-auto divide-y divide-gray-100 mt-2">
                      {searchResults.slice(0, 8).map((p) => (
                        <li key={p._id || p.id || p.slug}>
                          <button
                            type="button"
                            onClick={() => {
                              const id = p._id || p.id;
                              if (!id) return;
                              setSearchOpen(false);
                              navigate(`/product/${id}`);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                          >
                            <ProductImage
                              src={p.images?.image1 || p.image}
                              alt={p.title || p.name || 'Product'}
                              className="w-12 h-16 object-cover rounded-md border border-gray-100"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{p.title || p.name || 'Product'}</p>
                              {p.price && (
                                <p className="text-xs text-gray-600">₹{Number(p.price).toLocaleString()}</p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={scrollToTop}
                className="text-gray-700 hover:text-black transition-colors duration-200 text-xs xl:text-sm uppercase tracking-wide whitespace-nowrap px-3 py-2"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Center: Brand Logo Text */}
          <Link to="/" className="z-10 lg:justify-self-center" onClick={scrollToTop}>
            <span className="text-base sm:text-lg md:text-2xl font-semibold tracking-wide text-black">
              ArovaPerfume
            </span>
          </Link>

          {/* Mobile Categories Between Logo and Icons */}
          <div className="flex lg:hidden items-center justify-end gap-3 sm:gap-4 ml-auto mr-1">
            {navLinks.map((link) => (
              <Link
                key={`mobile-inline-${link.name}`}
                to={link.path}
                onClick={scrollToTop}
                className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-700 hover:text-black transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side Icons */}
            <div className="flex items-center justify-end gap-2 sm:gap-2 md:gap-2 lg:gap-3 xl:gap-4 flex-shrink-0">
            {/* Mobile Search Toggle */}
            <div className="md:hidden relative" ref={searchWrapRefMobile}>
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="p-1.5 sm:p-2 text-gray-700 hover:text-black transition-colors"
                type="button"
                aria-label="Search"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Mobile Search Panel */}
            {searchOpen && (
              <div className="md:hidden absolute left-3 right-3 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[80] overflow-hidden max-h-[70vh]">
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchQuery(v);
                      setSearchOpen(true);
                    }}
                    onKeyPress={handleSearchKeyPress}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div className="overflow-auto max-h-[50vh]">
                  {searchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
                  )}
                  {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <ul className="max-h-80 overflow-auto divide-y divide-gray-100">
                      {searchResults.slice(0, 8).map((p) => (
                        <li key={p._id || p.id || p.slug}>
                          <button
                            type="button"
                            onClick={() => {
                              const id = p._id || p.id;
                              if (!id) return;
                              setSearchOpen(false);
                              navigate(`/product/${id}`);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                          >
                            <ProductImage
                              src={p.images?.image1 || p.image}
                              alt={p.title || p.name || 'Product'}
                              className="w-12 h-16 object-cover rounded-md border border-gray-100"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{p.title || p.name || 'Product'}</p>
                              {p.price && (
                                <p className="text-xs text-gray-600">₹{Number(p.price).toLocaleString()}</p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* User Icon - Hidden on mobile */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="p-1 sm:p-1.5 md:p-2 text-gray-700 hover:text-black transition-colors flex-shrink-0"
                  title="Profile"
                >
                  <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              ) : (
                <button
                  onClick={handleLogin}
                  className="p-1 sm:p-1.5 md:p-2 text-gray-700 hover:text-black transition-colors flex-shrink-0"
                  title="Sign In"
                >
                  <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Wishlist Icon - Hidden on mobile */}
            <Link to="/wishlist" className="hidden md:block p-1 sm:p-1.5 md:p-2 text-gray-700 hover:text-black relative flex-shrink-0" title="Wishlist">
              <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-black text-white text-[9px] sm:text-[10px] md:text-xs rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex items-center justify-center font-medium">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon - Hidden on mobile */}
            <Link to="/cart" className="hidden md:block p-1 sm:p-1.5 md:p-2 text-gray-700 hover:text-black relative flex-shrink-0">
              <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-black text-white text-[9px] sm:text-[10px] md:text-xs rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex items-center justify-center font-medium">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-md text-gray-700 hover:text-black hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-5 w-5 sm:h-6 sm:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-5 w-5 sm:h-6 sm:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden py-4 sm:py-6 border-t border-gray-200 bg-white animate-in slide-in-from-top duration-200"
          >
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToTop();
                  }}
                  className="text-gray-700 hover:text-black hover:bg-gray-50 py-2 sm:py-2.5 px-3 sm:px-4 rounded transition-colors text-xs sm:text-sm uppercase text-center"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            {isAuthenticated ? (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 px-2">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 px-2">
                <button
                  onClick={() => {
                    handleLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
