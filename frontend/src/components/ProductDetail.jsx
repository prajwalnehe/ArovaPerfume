import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaBolt, FaShoppingCart, FaSpinner } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { fetchSareeById } from "../services/api";
import ProductSuggestions from "./ProductSuggestions";

const FALLBACK_IMAGE = "/no-image.png";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [toast, setToast] = useState({ show: false, text: "", type: "success" });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const loadProduct = async () => {
      try {
        if (!id) {
          navigate("/", { replace: true });
          return;
        }
        setLoading(true);
        const data = await fetchSareeById(id);
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product details:", err);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, navigate]);

  const images = useMemo(() => {
    const list = [
      product?.images?.image1,
      product?.images?.image2,
      product?.images?.image3,
      ...(Array.isArray(product?.imageGallery) ? product.imageGallery : []),
    ]
      .filter(Boolean)
      .map((u) => String(u));
    const unique = [...new Set(list)];
    return unique.length ? unique.slice(0, 6) : [FALLBACK_IMAGE];
  }, [product]);

  useEffect(() => {
    setSelectedImageIdx(0);
  }, [id, images.length]);

  const rating = Number(product?.rating || 0);
  const reviews = Number(product?.totalReviews || 0);
  const mrp = Number(product?.mrp || 0);
  const sellingPrice = Number(product?.price || product?.salePrice || Math.round(mrp - (mrp * Number(product?.discountPercent || 0)) / 100) || 0);
  const discountPercent = Number(product?.discountPercent || 0);

  const notes = [
    ...(product?.topNotes || []),
    ...(product?.middleNotes || []),
    ...(product?.baseNotes || []),
  ].filter(Boolean);

  const infoFields = [
    { label: "Brand", value: product?.product_info?.brand || product?.brand },
    { label: "Category", value: product?.category },
    { label: "Type", value: product?.type || product?.subcategory },
    { label: "Stock", value: product?.quantity != null ? `${product.quantity} available` : null },
    { label: "Secure Transaction", value: product?.secureTransaction ? "Yes" : "No" },
    { label: "Easy Tracking", value: product?.easyTracking ? "Yes" : "No" },
    { label: "Free Delivery", value: product?.freeDelivery ? "Yes" : "No" },
  ].filter((f) => f.value !== null && f.value !== undefined && f.value !== "");

  const handleAddToCart = async () => {
    if (!product) return;
    const cartProductId = String(product?._id || id || "");
    if (!cartProductId) return;
    setIsAdding(true);
    try {
      const result = await addToCart({ ...product, _id: cartProductId }, quantity, null);
      if (result?.redirected) return;
      setToast({ show: true, text: "Added to cart", type: "success" });
      setTimeout(() => setToast({ show: false, text: "", type: "success" }), 1800);
    } catch (e) {
      console.error("Error adding to cart:", e);
      setToast({ show: true, text: e?.message || "Failed to add to cart", type: "error" });
      setTimeout(() => setToast({ show: false, text: "", type: "success" }), 1800);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-black" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || "Product not found"}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-20 sm:pb-6">
      {toast.show && (
        <div className={`${toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"} fixed bottom-4 right-4 z-[100] text-white px-4 py-2 rounded shadow-lg`}>
          {toast.text}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 pt-4">
        <div className="text-xs text-gray-500 mb-3">
          Home <span className="mx-1">›</span> {product.category || "Collection"} <span className="mx-1">›</span> {product.title}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left image gallery */}
          <div>
            <div className="bg-white p-2 border border-gray-100">
              <img
                src={images[selectedImageIdx] || FALLBACK_IMAGE}
                alt={product.title}
                className="w-full aspect-square object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`bg-white border p-1 ${
                      idx === selectedImageIdx ? "border-black" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right details panel */}
          <div className="bg-white p-4 sm:p-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold uppercase tracking-wide text-gray-900 leading-tight">
                {product.title}
              </h1>
              <p className="text-xs tracking-[0.2em] mt-1 text-gray-700">EAU DE PARFUM</p>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div className="text-sm">{"★".repeat(Math.round(rating || 4))}{"☆".repeat(5 - Math.round(rating || 4))}</div>
              <span className="text-xs text-gray-600">{reviews || 12} reviews</span>
            </div>

            {notes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold tracking-wider text-gray-800 mb-2">NOTES</h3>
                <div className="flex flex-wrap gap-2">
                  {notes.slice(0, 8).map((note, idx) => (
                    <span key={`${note}-${idx}`} className="text-xs px-3 py-1.5 border border-gray-300 rounded-full bg-white">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-end gap-2">
              <span className="text-3xl font-semibold text-gray-900">₹ {sellingPrice.toLocaleString("en-IN")}</span>
              {mrp > sellingPrice && (
                <span className="text-sm text-gray-400 line-through">MRP ₹ {mrp.toLocaleString("en-IN")}</span>
              )}
              {discountPercent > 0 && (
                <span className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 font-semibold">SAVE {Math.round(discountPercent)}%</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{product.taxIncluded ? "Tax included." : "Tax extra."}</p>

            <div className="mt-5">
              <label className="block text-xs font-semibold tracking-wide mb-2 text-gray-800">QUANTITY</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 text-gray-700 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 text-gray-700 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 border border-black text-black py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <FaShoppingCart className="w-4 h-4" />
                  {isAdding ? "Adding..." : "Add to cart"}
                </button>
              </div>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={isAdding}
              className="w-full mt-3 bg-black text-white py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FaBolt className="w-4 h-4" />
              Buy Now
            </button>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-center text-gray-600 border-t border-b py-3">
              <div>Secure Transaction</div>
              <div>Easy Order Tracking</div>
            </div>

            {product.description && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900 tracking-wide">DESCRIPTION</h3>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* All Information */}
        <div className="mt-6 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 tracking-wide">ALL PRODUCT INFORMATION</h3>
          {infoFields.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {infoFields.map((field) => (
                <div key={field.label} className="flex justify-between gap-3 border-b border-gray-100 py-1.5">
                  <span className="text-gray-600">{field.label}</span>
                  <span className="text-gray-900 font-medium text-right">{String(field.value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No additional information available.</p>
          )}
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
