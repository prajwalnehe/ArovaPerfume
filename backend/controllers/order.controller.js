import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Helper function to format order for frontend
const formatOrderForFrontend = (order) => {
  // Get price details with fallbacks
  const itemsPrice = order.itemsPrice || order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;
  const taxPrice = order.taxPrice || Math.round(itemsPrice * 0.05) || 0;
  const shippingPrice = order.shippingPrice || (itemsPrice >= 5000 ? 0 : 99) || 0;
  const discount = order.discount || order.couponDiscount || 0;
  const totalPrice = order.totalPrice || (itemsPrice + taxPrice + shippingPrice - discount) || order.amount || 0;
  
  return {
    _id: order._id,
    orderId: order._id.toString().slice(-8).toUpperCase(), // Short order ID
    createdAt: order.createdAt,
    orderStatus: order.orderStatus || order.status || 'pending',
    paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
    paymentMethod: order.paymentMethod || 'cod',
    isPaid: order.isPaid || false,
    paidAt: order.paidAt,
    
    // Items with details
    items: (order.items || []).map(item => ({
      productId: item.product?._id || item.product,
      name: item.name || item.product?.title || item.product?.name || 'Product',
      image: item.image || item.product?.images?.[0] || item.product?.images?.image1 || item.product?.image || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
      size: item.size
    })),
    
    // Price breakdown
    priceDetails: {
      itemsPrice,
      taxPrice,
      shippingPrice,
      discount,
      totalPrice,
      couponCode: order.couponCode
    },
    
    // Shipping address
    shippingAddress: order.shippingAddress || {}
  };
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('items.product');

    // Format orders for frontend
    const formattedOrders = orders.map(formatOrderForFrontend);

    return res.json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders', 
      error: err.message 
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    
    const order = await Order.findOne({ _id: id, user: userId }).populate('items.product');
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Format order for frontend
    const formattedOrder = formatOrderForFrontend(order);

    return res.json({
      success: true,
      order: formattedOrder
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch order', 
      error: err.message 
    });
  }
};
