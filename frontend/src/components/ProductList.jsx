import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaRupeeSign, FaSpinner, FaFilter, FaTimes } from 'react-icons/fa';
// import { IoEyeOutline } from 'react-icons/io5'; // IoEyeOutline is imported but not used, can be removed if not needed later

// --- IMPORTANT: This line is now the intended data source. Ensure 'fetchSarees' is available. ---
import { fetchSarees } from '../services/api';
import ProductFilters from './ProductFilters'; 
import { useCart } from '../context/CartContext';
import ProductImage from './ProductImage';
// If '../services/api' does not exist, the component will fail to load data.

// Add CSS to hide scrollbar (Good for Tailwind UI)
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// NOTE: staticCategories and CategoryFilterList have been removed as requested.

// Wishlist helper functions
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

const ProductList = ({ defaultCategory } = {}) => {
    const { categoryName, subCategoryName } = useParams();
    const navigate = useNavigate();
    
    // --- State Initialization ---
    const [products, setProducts] = useState([]); // Raw fetched products
    const [filteredProducts, setFilteredProducts] = useState([]); // Products after filtering/sorting
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortOption, setSortOption] = useState('featured');
    const [wishlist, setWishlist] = useState([]); // Wishlist products 

    const { addToCart } = useCart();
    const [addingToCartId, setAddingToCartId] = useState(null);
    const [toast, setToast] = useState({ show: false, text: '', type: 'success' });
    
    // Filter states
    const [selectedPriceRange, setSelectedPriceRange] = useState(null);
    const [selectedFabrics, setSelectedFabrics] = useState([]);
    const [customMinPrice, setCustomMinPrice] = useState('');
    const [customMaxPrice, setCustomMaxPrice] = useState('');
    
    // Accordion states for desktop filters
    const [openSections, setOpenSections] = useState({
      price: true,
      material: true
    });
    
    // --- Constants ---
    const allPossibleFabrics = [
        '100% Cotton', 'Cotton', 'Cotton Blend', 'Cotton Lycra', 'Cotton Poly', 
        'Cotton Poly Blend', 'Cotton Poly Mix', 'Cotton Rich', 'Lycra Blend', 'Pure Cotton',
        'Silk', 'Georgette', 'Chiffon', 'Linen', 'Satin', 'Velvet', 'Organza', 
        'Banarasi', 'Kanjivaram', 'Tussar', 'Maheshwari', 'Chanderi', 'Zari', 
        'Zardosi', 'Kalamkari', 'Bandhani', 'Patola', 'Paithani'
    ]; 
    
    // Derive available fabrics from fetched products
    const availableFabrics = React.useMemo(() => {
        const fabricSet = new Set();
        products.forEach(product => {
            const possibleFabricFields = [
                product.fabric, 
                product.material, 
                product.product_info?.fabric, 
                product.product_info?.material,
                product.product_info?.tshirtMaterial,
                product.product_info?.pantMaterial,
                product.product_info?.shoeMaterial,
                product.details?.fabric, 
                product.details?.material, 
                product.description, 
                product.title
            ];
            possibleFabricFields.forEach(field => {
                if (field) {
                    const fieldStr = String(field).toLowerCase();
                    // Check for exact matches first (for specific blends)
                    allPossibleFabrics.forEach(fabric => {
                        const fabricLower = fabric.toLowerCase();
                        // Check for exact phrase match or word boundary match
                        if (fieldStr.includes(fabricLower) || 
                            fieldStr.includes(fabricLower.replace(/\s+/g, '')) ||
                            (fabricLower.includes('cotton') && fieldStr.includes('cotton'))) {
                            // For cotton variants, try to match more specifically
                            if (fabricLower.includes('cotton')) {
                                if (fabricLower.includes('100%') && (fieldStr.includes('100%') || fieldStr.includes('100 percent'))) {
                                    fabricSet.add(fabric);
                                } else if (fabricLower.includes('pure') && fieldStr.includes('pure')) {
                                    fabricSet.add(fabric);
                                } else if (fabricLower.includes('blend') && fieldStr.includes('blend')) {
                                    fabricSet.add(fabric);
                                } else if (fabricLower.includes('lycra') && fieldStr.includes('lycra')) {
                                    fabricSet.add(fabric);
                                } else if (fabricLower.includes('poly') && fieldStr.includes('poly')) {
                                    fabricSet.add(fabric);
                                } else if (fabricLower.includes('rich') && fieldStr.includes('rich')) {
                                    fabricSet.add(fabric);
                                } else if (fabricLower === 'cotton' && !fieldStr.includes('blend') && !fieldStr.includes('poly') && !fieldStr.includes('lycra')) {
                                    fabricSet.add(fabric);
                                }
                            } else {
                                fabricSet.add(fabric);
                            }
                        }
                    });
                }
            });
        });
        
        // Always include common cotton variants if cotton is detected
        if (Array.from(fabricSet).some(f => f.toLowerCase().includes('cotton'))) {
            fabricSet.add('Cotton');
            if (!Array.from(fabricSet).some(f => f.includes('100%'))) {
                fabricSet.add('100% Cotton');
            }
        }
        
        // Fallback or initialization fabrics if the API returns no specific fabric fields
        if (fabricSet.size === 0) {
            return ['Cotton', '100% Cotton', 'Cotton Blend']; 
        }
        return Array.from(fabricSet).sort();
    }, [products]);
    
    // --- UPDATED PRICE RANGES ---
    // Get raw category from URL to check if it's formal-shirts
    const rawCategory = subCategoryName || categoryName || defaultCategory || '';
    const isFormalShirts = rawCategory.toLowerCase().includes('formal') && rawCategory.toLowerCase().includes('shirt');
    
    const allPriceRanges = [
      { id: 0, label: '₹99 - ₹200', min: 99, max: 200 },
      { id: 1, label: '₹201 - ₹400', min: 201, max: 400 },
      { id: 2, label: '₹401 - ₹600', min: 401, max: 600 },
      { id: 3, label: '₹601 - ₹800', min: 601, max: 800 },
      { id: 4, label: '₹801 - ₹1,000', min: 801, max: 1000 },
      { id: 5, label: '₹1,001 - ₹1,200', min: 1001, max: 1200 },
      { id: 6, label: '₹1,201 - ₹1,500', min: 1201, max: 1500 },
      { id: 7, label: 'Above ₹1,500', min: 1501, max: Infinity },
    ];
    
    // Filter out ₹99 - ₹200 range for Formal Shirts
    const priceRanges = isFormalShirts 
      ? allPriceRanges.filter(range => range.id !== 0)
      : allPriceRanges;
    // ----------------------------
    
    // --- Utility Functions ---
    const normalize = (s) => {
        if (!s) return '';
        const t = s.replace(/-/g, ' ').toLowerCase();
        return t.replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // Category display name mapping to match navbar
    const getCategoryDisplayName = (category) => {
        const categoryMap = {
            'accessories': 'PERFUMES',
            't-shirts': 'Tshirts',
            't shirts': 'Tshirts',
            'tshirts': 'Tshirts',
            'shirts': 'Shirts',
            'pants': 'Pants',
            'shoes': 'Shoes',
        };
        const normalized = category ? category.toLowerCase() : '';
        if (normalized === 'men') return 'Perfumes For Men';
        if (normalized === 'women') return 'Perfumes For Women';
        return categoryMap[normalized] || normalize(category || '');
    };

    // For display purposes, normalize the category
    const effectiveCategory = normalize(rawCategory);
    const displayCategoryName = getCategoryDisplayName(rawCategory);
        
    // --- Load Wishlist ---
    useEffect(() => {
        const loadWishlist = () => {
            setWishlist(readWishlist());
        };
        
        loadWishlist();
        
        // Listen for wishlist updates
        const handleWishlistUpdate = () => {
            loadWishlist();
        };
        
        window.addEventListener('wishlist:updated', handleWishlistUpdate);
        window.addEventListener('storage', (e) => {
            if (e.key === 'wishlist') {
                loadWishlist();
            }
        });
        
        return () => {
            window.removeEventListener('wishlist:updated', handleWishlistUpdate);
        };
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        const load = async () => {
            if (!fetchSarees) {
                setError("Error: fetchSarees function is not defined. Please check your '../services/api' import.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                // Send raw category to backend (backend will handle normalization and mapping)
                const data = await fetchSarees(rawCategory || '');
                const list = Array.isArray(data) ? data : (data?.products || []);
                const isWatches = (rawCategory || '').toLowerCase() === 'watches';
                setProducts(isWatches ? list.slice(0, 100) : list);
            } catch (err) {
                console.error('Failed to load products:', err);
                setError('Failed to load products. Please try again later.');
                setProducts([]); // Clear products on error
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [categoryName, subCategoryName, defaultCategory, effectiveCategory]);

    // --- Filter Application & Sorting ---
    useEffect(() => {
        let result = [...products];
        
        // 1. Filter by price range
        if (selectedPriceRange !== null) {
            const range = priceRanges.find(r => r.id === selectedPriceRange);
            if (range) {
                result = result.filter(p => {
                    // Use a fallback price calculation if price field is missing
                    const price = p.price || (p.mrp * (1 - (p.discountPercent || 0) / 100)) || p.mrp || 0;
                    return price >= range.min && (range.max === Infinity ? true : price <= range.max);
                });
            }
        }
        
        // Filter by custom price range if set
        if (customMinPrice || customMaxPrice) {
            result = result.filter(p => {
                const price = p.price || (p.mrp * (1 - (p.discountPercent || 0) / 100)) || p.mrp || 0;
                const min = customMinPrice ? Number(customMinPrice) : 0;
                const max = customMaxPrice ? Number(customMaxPrice) : Infinity;
                return price >= min && price <= max;
            });
        }
        
        // 2. Filter by fabric
        if (selectedFabrics.length > 0) {
            result = result.filter(p => {
                const possibleFabricFields = [p.fabric, p.material, p.product_info?.fabric, p.product_info?.material, p.details?.fabric, p.details?.material, p.description, p.title];
                const fabricSearchString = possibleFabricFields.filter(Boolean).map(String).join(' ').toLowerCase();
                return selectedFabrics.some(fabric => 
                    fabricSearchString.includes(fabric.toLowerCase())
                );
            });
        }

        // 3. Apply Sorting
        const sorted = [...result];
        switch(sortOption) {
            case 'price-low-high':
                sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price-high-low':
                sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'newest':
                sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            case 'featured':
            default:
                // Default order (usually API or database default)
                break;
        }
        
        setFilteredProducts(sorted);
    }, [products, selectedPriceRange, selectedFabrics, sortOption, customMinPrice, customMaxPrice]); 
    
    // --- Filter Handlers ---
    const toggleFabric = useCallback((fabric) => {
        setSelectedFabrics(prev => 
            prev.includes(fabric)
              ? prev.filter(f => f !== fabric)
              : [...prev, fabric]
        );
    }, []);
    
    const resetFilters = useCallback(() => {
        setSelectedPriceRange(null);
        setSelectedFabrics([]);
        setCustomMinPrice('');
        setCustomMaxPrice('');
    }, []);

    const toggleSection = useCallback((section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [categoryName, subCategoryName]);

    const handleCardClick = useCallback((product) => {
        const pid = product?._id || product?.id;
        if (!pid) return;
        navigate(`/product/${pid}`);
    }, [navigate]);

    // Check if product is in wishlist
    const isWishlisted = useCallback((productId) => {
        return wishlist.some(item => (item._id || item.id) === productId);
    }, [wishlist]);

    // Toggle wishlist for a product
    const toggleWishlist = useCallback((product, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        
        const pid = product._id;
        if (!pid) return;
        
        const list = readWishlist();
        const exists = list.some(p => (p._id || p.id) === pid);
        
        let finalPrice = product.price || (product.mrp * (1 - (product.discountPercent || 0) / 100)) || product.mrp || 0;
        
        if (exists) {
            // Remove from wishlist
            const next = list.filter(p => (p._id || p.id) !== pid);
            writeWishlist(next);
            setWishlist(next);
        } else {
            // Add to wishlist
            const item = {
                _id: pid,
                title: product.title,
                images: product.images,
                price: finalPrice,
                mrp: product.mrp,
                discountPercent: product.discountPercent || 0,
            };
            const next = [item, ...list.filter(p => (p._id || p.id) !== pid)];
            writeWishlist(next);
            setWishlist(next);
        }
        
        // Dispatch event for other components
        try { 
            window.dispatchEvent(new Event('wishlist:updated')); 
        } catch {}
    }, []);

    const handleAddToCartFromCard = useCallback(async (product, e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        const pid = product?._id || product?.id || product?.productId;
        if (!pid) return;

        try {
            setAddingToCartId(pid);
            // For list view we don't force a size; server accepts `size` as optional.
            const result = await addToCart(product, 1, null);
            if (result?.redirected) return;
            setToast({ show: true, text: 'Added to cart', type: 'success' });
            setTimeout(() => setToast({ show: false, text: '', type: 'success' }), 1800);
        } catch (err) {
            console.error('Add to cart failed:', err);
            setToast({ show: true, text: err?.message || 'Failed to add to cart', type: 'error' });
            setTimeout(() => setToast({ show: false, text: '', type: 'success' }), 1800);
        } finally {
            setAddingToCartId(null);
        }
    }, [addToCart]);

    // Helper function to get category/type label for overlay
    const getCategoryLabel = (product) => {
        const info = product.product_info || {};
        const category = (product.category || '').toLowerCase();
        
        // Check for material-based labels
        if (info.tshirtMaterial || info.pantMaterial || info.shoeMaterial) {
            const material = info.tshirtMaterial || info.pantMaterial || info.shoeMaterial;
            if (material && material.toUpperCase().includes('LINEN')) {
                return 'LINEN BLEND';
            }
            if (material && material.toUpperCase().includes('COTTON')) {
                return 'COTTON BLEND';
            }
        }
        
        // Check for product type labels
        if (category.includes('utility') || info.pantType?.toLowerCase().includes('utility')) {
            return 'UTILITY POCKET';
        }
        if (category.includes('holiday') || product.title?.toLowerCase().includes('holiday')) {
            return 'HOLIDAY';
        }
        if (category.includes('oversized') || info.tshirtFit?.toLowerCase().includes('oversized')) {
            return 'OVERSIZED FIT';
        }
        
        // Fallback to category or manufacturer
        if (info.manufacturer) {
            return info.manufacturer.toUpperCase();
        }
        
        return null;
    };

    // Helper function to format product title for display
    const formatProductTitle = (product) => {
        const info = product.product_info || {};
        const title = product.title || '';
        
        // Try to extract color/material from title
        // Format like "Cotton Linen: Sky Blue"
        if (info.tshirtColor || info.pantColor || info.shoeColor) {
            const color = info.tshirtColor || info.pantColor || info.shoeColor;
            const material = info.tshirtMaterial || info.pantMaterial || info.shoeMaterial || 'Cotton';
            return `${material}: ${color}`;
        }
        
        return title;
    };

    // Helper function to get category display name
    const getCategoryDisplay = (product) => {
        const category = product.category || '';
        const info = product.product_info || {};
        
        // Map categories to display names
        if (category.toLowerCase().includes('tshirt') || category.toLowerCase().includes('t-shirt')) {
            return info.tshirtMaterial ? `${info.tshirtMaterial} Shirts` : 'T-Shirts';
        }
        if (category.toLowerCase().includes('shirt')) {
            return info.tshirtMaterial ? `${info.tshirtMaterial} Shirts` : 'Shirts';
        }
        if (category.toLowerCase().includes('pant')) {
            return info.pantType ? `Men ${info.pantType} Pants` : 'Pants';
        }
        if (category.toLowerCase().includes('holiday')) {
            return 'Holiday Shirts';
        }
        
        return category || 'Products';
    };

    const activeFilterCount = [
        selectedFabrics.length,
        selectedPriceRange !== null ? 1 : 0,
        (customMinPrice || customMaxPrice) ? 1 : 0
    ].reduce((a, b) => a + b, 0);


    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-500 text-xl font-semibold">❌ {error}</p>
          <p className="text-gray-600 mt-2">Check the console for details, and ensure `fetchSarees` is correctly implemented.</p>
        </div>
      );
    }

    // --- Main Render Block ---
    return (
        <div className="min-h-screen bg-white">
            <style>{styles}</style>
            {toast.show && (
                <div className={`${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} fixed bottom-4 right-4 z-[100] text-white px-4 py-2 rounded shadow-lg`}>
                    {toast.text}
                </div>
            )}
            
            {/* Loading Bar */}
            {loading && (
                <div className="fixed left-0 right-0 top-0 z-50">
                    <div className="h-0.5 bg-gradient-to-r from-[#7A2A2A] via-[#A56E2C] to-[#C89D4B] animate-pulse"></div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">

                {/* --- TOP HEADER --- */}
                <div className="mb-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 text-center">
                        {displayCategoryName || 'All Products'}
                    </h1>
                </div>

                <div className="flex gap-8 relative">
                    {/* --- MAIN CONTENT GRID --- */}
                    <div className="flex-1 min-w-0">
                        
                        {/* Product Grid */}
                        {loading ? (
                            <div className="flex justify-center items-center py-20 text-gray-600">
                                <FaSpinner className="w-6 h-6 animate-spin mr-3 text-amber-700" />
                                <span className="text-lg">Loading products...</span>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
                                <p className="text-gray-500 text-xl font-serif italic mb-4">No treasures found matching your selections.</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-4 text-amber-700 hover:text-amber-800 font-medium text-base transition-colors underline underline-offset-4"
                                >
                                    Clear all filters to see more
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                                {filteredProducts.map((p, idx) => {
                                    const pid = p._id || p.id || p.productId;
                                    const finalPrice = Math.round(p.price || (p.mrp * (1 - (p.discountPercent || 0) / 100)) || p.mrp || 0);
                                    return (
                                        <Link
                                            key={pid || p.title}
                                            to={pid ? `/product/${pid}` : '#'}
                                            className="group bg-white overflow-hidden transition-all duration-300 cursor-pointer"
                                            onClick={(e) => {
                                                if (!pid) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            {(() => {
                                                const badgeLabel = idx === 0 ? 'NEW LAUNCH' : idx === 1 ? 'BESTSELLER' : idx === 2 ? 'TRENDING' : null;
                                                const notes = p.type || p.subcategory || p.category || '';
                                                const mrpValue = Number(p.mrp || 0);

                                                return (
                                                    <div className="rounded-none border-0 bg-transparent overflow-hidden transition-all duration-300 hover:shadow-none">
                                                        <div className="relative bg-transparent overflow-hidden">
                                                            {badgeLabel && (
                                                                <span className="absolute top-2 left-2 bg-[#f16b80] text-white text-[9px] px-2 py-1 rounded-full font-semibold tracking-wide">
                                                                    {badgeLabel}
                                                                </span>
                                                            )}
                                                            <ProductImage
                                                                src={p.images?.image1 || p.image}
                                                                alt={p.title}
                                                                className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                        </div>

                                                        <div className="pt-2 pb-2 px-2 text-center">
                                                            <p className="text-xs sm:text-sm font-semibold text-black line-clamp-1 uppercase">
                                                                {p.title || 'Perfume'}
                                                            </p>
                                                            {notes ? (
                                                                <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 line-clamp-1">
                                                                    {notes}
                                                                </p>
                                                            ) : (
                                                                <div className="h-4" />
                                                            )}

                                                            <p className="mt-1 text-sm font-bold text-black">
                                                                ₹{finalPrice.toLocaleString('en-IN')}
                                                            </p>
                                                            {mrpValue > finalPrice && (
                                                                <p className="text-xs text-gray-400 line-through">
                                                                    ₹{mrpValue.toLocaleString('en-IN')}
                                                                </p>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleAddToCartFromCard(p, e)}
                                                                disabled={addingToCartId === pid}
                                                                className="mt-2 block w-full border border-black text-xs sm:text-sm py-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                                            >
                                                                {addingToCartId === pid ? 'Adding...' : 'Add to cart'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;