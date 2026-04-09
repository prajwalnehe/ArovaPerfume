import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required']
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maxDiscount: {
    type: Number,
    default: null,
    min: [0, 'Maximum discount cannot be negative']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  usageLimit: {
    type: Number,
    default: null,
    min: [0, 'Usage limit cannot be negative']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFirstOrderOnly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
CouponSchema.index({ code: 1, isActive: 1 });
CouponSchema.index({ expiryDate: 1 });

// Method to check if coupon is valid
CouponSchema.methods.isValid = function() {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now > this.expiryDate) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  return { valid: true };
};

// Method to calculate discount
CouponSchema.methods.calculateDiscount = function(orderAmount) {
  const check = this.isValid();
  if (!check.valid) {
    return { success: false, message: check.message };
  }
  
  if (orderAmount < this.minOrderAmount) {
    return { 
      success: false, 
      message: `Minimum order amount of ₹${this.minOrderAmount} required` 
    };
  }
  
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = (orderAmount * this.discountValue) / 100;
    
    // Apply max discount cap if set
    if (this.maxDiscount !== null && discountAmount > this.maxDiscount) {
      discountAmount = this.maxDiscount;
    }
  } else {
    // Fixed discount
    discountAmount = this.discountValue;
    
    // Ensure discount doesn't exceed order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }
  }
  
  const finalAmount = orderAmount - discountAmount;
  
  return {
    success: true,
    discountAmount: Math.round(discountAmount),
    finalAmount: Math.round(finalAmount),
    couponCode: this.code,
    discountType: this.discountType,
    discountValue: this.discountValue
  };
};

const Coupon = mongoose.model('Coupon', CouponSchema);

export default Coupon;
