import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Get all orders for logged-in user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Find all orders for this user, sorted by newest first
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'title images pricing') // Populate product for additional info
      .sort({ createdAt: -1 })
      .lean();

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order._id.toString().slice(-8).toUpperCase(), // Short order ID for display
      createdAt: order.createdAt,
      orderStatus: order.orderStatus || order.status || 'pending',
      paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
      paymentMethod: order.paymentMethod || 'cod',
      isPaid: order.isPaid || false,
      paidAt: order.paidAt,
      
      // Items with details
      items: (order.items || []).map(item => ({
        productId: item.product?._id || item.product,
        name: item.name || item.product?.title || 'Product',
        image: item.image || item.product?.images?.[0] || item.product?.images?.image1 || '',
        quantity: item.quantity,
        price: item.price,
        size: item.size
      })),
      
      // Price breakdown
      priceDetails: {
        itemsPrice: order.itemsPrice || order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
        taxPrice: order.taxPrice || 0,
        shippingPrice: order.shippingPrice || 0,
        discount: order.discount || order.couponDiscount || 0,
        totalPrice: order.totalPrice || order.amount || 0,
        couponCode: order.couponCode
      },
      
      // Shipping address
      shippingAddress: order.shippingAddress || {}
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get single order by ID for logged-in user
export const getUserOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId 
    }).populate('items.product', 'title images pricing description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Format order for frontend
    const formattedOrder = {
      _id: order._id,
      orderId: order._id.toString().slice(-8).toUpperCase(),
      createdAt: order.createdAt,
      orderStatus: order.orderStatus || order.status || 'pending',
      paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
      paymentMethod: order.paymentMethod || 'cod',
      isPaid: order.isPaid || false,
      paidAt: order.paidAt,
      
      items: (order.items || []).map(item => ({
        productId: item.product?._id || item.product,
        name: item.name || item.product?.title || 'Product',
        image: item.image || item.product?.images?.[0] || item.product?.images?.image1 || '',
        quantity: item.quantity,
        price: item.price,
        size: item.size
      })),
      
      priceDetails: {
        itemsPrice: order.itemsPrice || 0,
        taxPrice: order.taxPrice || 0,
        shippingPrice: order.shippingPrice || 0,
        discount: order.discount || order.couponDiscount || 0,
        totalPrice: order.totalPrice || order.amount || 0,
        couponCode: order.couponCode
      },
      
      shippingAddress: order.shippingAddress || {}
    };

    return res.status(200).json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};
