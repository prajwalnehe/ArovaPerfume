import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaShoppingCart, FaRupeeSign, FaArrowLeft, FaStar, FaRegStar, FaBolt, FaSpinner, FaTimes, FaExpand, FaHeart, FaRegHeart, FaShareAlt, FaComment } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { fetchSareeById } from "../services/api";
import ProductSuggestions from "./ProductSuggestions";

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

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const location = useLocation();
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchSareeById(id);
        setProduct(data);
        // Initialize selected size based on product type
        if (data?.product_info?.tshirtSize) {
          setSelectedSize(data.product_info.tshirtSize);
        } else if (data?.product_info?.shoeSize) {
          setSelectedSize(data.product_info.shoeSize);
        } else if (data?.product_info?.pantWaist) {
          setSelectedSize(data.product_info.pantWaist);
        } else if (data?.product_info?.availableSizes?.length > 0) {
          setSelectedSize(data.product_info.availableSizes[0]);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Initialize wishlist state when product loads
  useEffect(() => {
    if (!product) return;
    const list = readWishlist();
    const pid = product._id || id;
    setWishlisted(list.some(p => (p._id || p.id) === pid));
  }, [product, id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      await addToCart(id, quantity, selectedSize);
      alert(`${product.title} ${quantity > 1 ? `(${quantity} items) ` : ''}added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: product?.title || 'Product',
        text: product?.description?.slice(0, 120) || 'Check out this product!',
        url: window.location.href,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard');
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Product not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const sellingPrice = product.price || Math.round(product.mrp - (product.mrp * (product.discountPercent || 0) / 100));
  
  // Get all available images
  const productImages = [
    product.images?.image1,
    product.images?.image2,
    product.images?.image3,
  ].filter(Boolean);

  // Determine product type and available sizes
  const getProductType = () => {
    if (!product?.category || !product?.product_info) return null;
    const category = product.category.toLowerCase();
    const info = product.product_info;

    if (info.tshirtSize || info.tshirtMaterial || category.includes('tshirt') || category.includes('TShirt')) {
      return 'tshirt';
    }
    if (info.shoeSize || info.shoeType || category.includes('shoe') || category.includes('footwear')) {
      return 'shoe';
    }
    if (info.pantWaist || info.pantType || category.includes('pant') || category.includes('jeans')) {
      return 'pant';
    }
    return 'other';
  };

  const productType = getProductType();

  // Get available sizes based on product type
  const getAvailableSizes = () => {
    if (!product?.product_info) return [];
    const info = product.product_info;

    if (productType === 'tshirt') {
      return info.availableSizes?.length > 0 
        ? info.availableSizes 
        : ['S', 'M', 'L', 'XL', '2XL', '3XL'];
    }
    if (productType === 'shoe') {
      return info.availableSizes?.length > 0 
        ? info.availableSizes 
        : ['6', '7', '8', '9', '10', '11', '12'];
    }
    if (productType === 'pant') {
      return info.availableSizes?.length > 0 
        ? info.availableSizes 
        : ['28', '30', '32', '34', '36', '38', '40'];
    }
    return [];
  };

  const availableSizes = getAvailableSizes();
  const showSizeSelection = availableSizes.length > 0;

  // Get product information fields based on type
  const getProductInfoFields = () => {
    if (!product?.product_info) return [];
    const info = product.product_info;
    const fields = [];

    // Common fields
    if (info.brand) fields.push({ label: 'Brand', value: info.brand });
    if (info.manufacturer) fields.push({ label: 'Manufacturer', value: info.manufacturer });
    if (product.category) fields.push({ label: 'Category', value: product.category });

    // Tshirt specific fields
    if (productType === 'tshirt') {
      if (info.tshirtMaterial) fields.push({ label: 'Material', value: info.tshirtMaterial });
      if (info.tshirtColor) fields.push({ label: 'Color', value: info.tshirtColor });
      if (info.tshirtFit) fields.push({ label: 'Fit', value: info.tshirtFit });
      if (info.tshirtSleeve) fields.push({ label: 'Sleeve', value: info.tshirtSleeve });
      if (info.tshirtNeck) fields.push({ label: 'Neck Type', value: info.tshirtNeck });
    }

    // Shoe specific fields
    if (productType === 'shoe') {
      if (info.shoeMaterial) fields.push({ label: 'Material', value: info.shoeMaterial });
      if (info.shoeColor) fields.push({ label: 'Color', value: info.shoeColor });
      // Type field hidden
      // if (info.shoeType) fields.push({ label: 'Type', value: info.shoeType });
    }

    // Pant specific fields
    if (productType === 'pant') {
      if (info.pantMaterial) fields.push({ label: 'Material', value: info.pantMaterial });
      if (info.pantColor) fields.push({ label: 'Color', value: info.pantColor });
      if (info.pantFit) fields.push({ label: 'Fit', value: info.pantFit });
      // Type field hidden
      // if (info.pantType) fields.push({ label: 'Type', value: info.pantType });
    }

    // Common included components - hidden
    // if (info.IncludedComponents) {
    //   fields.push({ label: 'Included Components', value: info.IncludedComponents });
    // }

    return fields;
  };

  const productInfoFields = getProductInfoFields();

  const handleWishlistToggle = () => {
    if (!product) return;
    const pid = product._id || id;
    const list = readWishlist();
    const exists = list.some(p => (p._id || p.id) === pid);
    if (exists) {
      const next = list.filter(p => (p._id || p.id) !== pid);
      writeWishlist(next);
      setWishlisted(false);
      try { window.dispatchEvent(new Event('wishlist:updated')); } catch {}
    } else {
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
      setWishlisted(true);
      try { window.dispatchEvent(new Event('wishlist:updated')); } catch {}
      alert(`${product.title} added to wishlist`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-4 relative">
      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(false);
              }}
            >
              <FaTimes className="w-8 h-8" />
            </button>
            <img
              src={productImages[0] || 'https://via.placeholder.com/600x800?text=Image+Not+Available'}
              alt={product.title}
              className="max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/600x800?text=Image+Not+Available';
              }}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6">
        {/* Main Product Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:items-start">
            
            {/* Image Section */}
            <div className="relative group">
              <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={productImages[0] || 'https://via.placeholder.com/600x800?text=Image+Not+Available'}
                  alt={product.title}
                  className="w-full h-auto object-contain cursor-zoom-in"
                  onClick={() => setIsImageModalOpen(true)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/600x800?text=Image+Not+Available';
                  }}
                />
                <div 
                  className="absolute bottom-4 right-4 bg-white bg-opacity-80 p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageModalOpen(true);
                  }}
                  title="Click to enlarge"
                >
                  <FaExpand className="text-gray-700" />
                </div>
              </div>
              {/* Thumbnail images if available */}
              {productImages.length > 1 && (
                <div className="flex gap-2 mt-4">
                  {productImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.title} view ${idx + 1}`}
                      className="w-20 h-20 object-cover border-2 border-gray-200 rounded cursor-pointer hover:border-black transition-colors"
                      onClick={() => {
                        // Swap main image with thumbnail
                        const newImages = [...productImages];
                        [newImages[0], newImages[idx]] = [newImages[idx], newImages[0]];
                        // This would require state management for images
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="py-2 flex flex-col h-full">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
                
                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                  <div className="flex items-baseline">
                    <FaRupeeSign className="text-gray-700 text-xl" />
                    <span className="text-3xl font-bold text-gray-900">
                      {sellingPrice.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{product.mrp.toLocaleString()}
                  </span>
                  {product.discountPercent > 0 && (
                    <span className="text-base font-medium text-green-600">
                      ({product.discountPercent}% off)
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      star <= 4 ? <FaStar key={star} className="w-4 h-4" /> : <FaRegStar key={star} className="w-4 h-4" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">4</span>
                  <span className="text-sm text-gray-500">out of 5</span>
                  <span className="text-sm text-gray-500">(24 Reviews)</span>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Size Selection */}
                {showSizeSelection && (
                  <div className="mb-6">
                    <div className="mb-4">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        Select {productType === 'shoe' ? 'Size' : productType === 'pant' ? 'Waist Size' : 'Size'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          className={`min-w-[45px] sm:min-w-[50px] px-4 sm:px-5 py-2 sm:py-2.5 border-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                            selectedSize === size
                              ? 'border-black bg-black text-white shadow-sm'
                              : 'border-gray-300 hover:border-gray-500 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={decrementQuantity}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(val > 0 ? val : 1);
                      }}
                      className="w-20 h-10 border-2 border-gray-300 rounded-lg text-center font-semibold text-gray-900 focus:outline-none focus:border-black"
                      min="1"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Free shipping on orders over ₹1,000</span>
                  </div>
                </div>

                {/* Product Information */}
                {productInfoFields.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Product Information</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      {productInfoFields.map((field, idx) => (
                        <div key={idx} className="flex">
                          <span className="w-40 font-medium text-gray-600">{field.label}:</span>
                          <span>{field.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mb-6 hidden sm:block">
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 bg-white text-black border-2 border-black py-3 px-6 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                    >
                      <FaShoppingCart className="w-4 h-4" />
                      {isAdding ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button 
                      className="flex-1 bg-black text-white py-3 px-6 rounded-lg text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                      onClick={handleBuyNow}
                      disabled={isAdding}
                    >
                      <FaBolt className="w-4 h-4" />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Buttons for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-3 z-50 sm:hidden">
          <div className="flex gap-2 max-w-md mx-auto">
            <button 
              className="flex-1 bg-white text-black border-2 border-black py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-70 text-sm flex items-center justify-center gap-2"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              <FaShoppingCart className="w-4 h-4" />
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button 
              className="flex-1 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2"
              onClick={handleBuyNow}
            >
              <FaBolt className="w-4 h-4" />
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Product Suggestions */}
      {product && (
        <ProductSuggestions 
          currentProductId={product._id || id}
          category={product.category}
          maxProducts={8}
        />
      )}
    </div>
  );
};

export default ProductDetail;
