import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // Product name at time of order
    image: { type: String }, // Product image at time of order
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true }, // Price per unit
    size: { type: String }, // Selected size (e.g., "5", "6", "7", "8", "9", "10", "S", "M", "L", "30", "32", etc.)
  },
  { _id: false }
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    mobileNumber: String,
    pincode: String,
    locality: String,
    address: String,
    city: String,
    state: String,
    landmark: String,
    alternatePhone: String,
    addressType: String,
  },
  { _id: false }
);

// Price Breakdown Schema for detailed price information
const PriceBreakdownSchema = new mongoose.Schema(
  {
    itemsPrice: { type: Number, required: true, default: 0 }, // Sum of (price * qty) for all items
    taxPrice: { type: Number, required: true, default: 0 }, // 5% tax on itemsPrice
    shippingPrice: { type: Number, required: true, default: 0 }, // Shipping cost
    discount: { type: Number, required: true, default: 0 }, // Coupon discount
    totalPrice: { type: Number, required: true, default: 0 }, // itemsPrice + tax + shipping - discount
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [OrderItemSchema], default: [] },
    
    // Price breakdown (as per requirements)
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    
    // Legacy fields (kept for backward compatibility)
    amount: { type: Number }, // Old field, keep for compatibility
    subtotal: { type: Number }, // Old field
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    
    // Payment details
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    
    // Shipping and order status
    orderStatus: { 
      type: String, 
      enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'], 
      default: 'pending' 
    },
    paymentStatus: { 
      type: String, 
      enum: ['paid', 'pending', 'failed', 'refunded'], 
      default: 'pending' 
    },
    paymentMethod: { 
      type: String, 
      enum: ['razorpay', 'cod', 'card', 'upi'], 
      default: 'cod' 
    },
    
    // Legacy status field (kept for backward compatibility)
    status: { 
      type: String, 
      enum: [
        'created', 'paid', 'pending', 'failed',
        'confirmed', 'on_the_way', 'delivered', 'cancelled', 'returned', 'packed', 'shipped'
      ], 
      default: 'pending' 
    },
    
    transactionId: { type: String },
    adminNotes: {
      type: [
        {
          note: String,
          createdAt: { type: Date, default: Date.now },
        }
      ],
      default: []
    },
    
    // Razorpay payment details
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    
    // Shipping address
    shippingAddress: { type: ShippingAddressSchema },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export default Order;
