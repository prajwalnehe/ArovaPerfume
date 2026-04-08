import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

function Cart() {
  const navigate = useNavigate();
  const { 
    cart = [], 
    updateQuantity, 
    removeFromCart, 
    cartTotal = 0, 
    cartCount = 0,
    clearCart 
  } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const shippingCost = cartTotal >= 1000 ? 0 : 99;
  const tax = Math.round(cartTotal * 0.05);
  const total = cartTotal + shippingCost + tax;
  const getProductId = (item) => item?.id || item?._id || item?.productId;

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-700 hover:text-gray-900 cursor-pointer"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Cart</h1>
          <button 
            onClick={clearCart}
            className="text-gray-700 hover:text-gray-900 cursor-pointer disabled:cursor-not-allowed"
            disabled={cart.length === 0}
          >
            <FaTrash className="w-5 h-5" />
          </button>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12 px-4">
          <FaShoppingCart className="mx-auto text-5xl text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Listings - Left Side */}  
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain cursor-pointer"
                        onError={(e) => {
                          if (e.currentTarget.src.endsWith('/no-image.png')) return;
                          e.currentTarget.src = '/no-image.png';
                        }}
                        onClick={() => {
                          const pid = getProductId(item);
                          if (!pid) return;
                          navigate(`/product/${pid}`);
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-base font-bold text-gray-900 mb-1 truncate cursor-pointer"
                        onClick={() => {
                          const pid = getProductId(item);
                          if (!pid) return;
                          navigate(`/product/${pid}`);
                        }}
                      >
                        {item.name}
                      </h3>
                      {item.brand && (
                        <p className="text-sm text-blue-600 mb-1">{item.brand}</p>
                      )}
                      {item.color && (
                        <p className="text-xs text-gray-500 mb-2">Color: {item.color}</p>
                      )}
                      <p className="text-base font-bold text-gray-900">₹{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                      
                      {/* Quantity, Delete */}
                      <div className="flex items-center gap-3 mt-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button 
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            <FaMinus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1 border-x border-gray-300 text-sm">{item.quantity || 1}</span>
                          <button 
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            <FaPlus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {/* Delete Icon */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-500 hover:text-red-500 cursor-pointer"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary - Right Side */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <div className="bg-white rounded-lg p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sub Total</span>
                    <span className="text-gray-900">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping & Tax</span>
                    <span className="text-gray-900">₹{(shippingCost + tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">₹{total.toLocaleString()}</span>
                  </div>
                  
                  {/* Checkout Button */}
                  <button 
                    onClick={() => navigate('/checkout/address')}
                    className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors mt-4 cursor-pointer"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
