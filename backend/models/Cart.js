import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, alias: 'productId' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number },
    size: { type: String }, // Selected size (e.g., "5", "6", "7", "8", "9", "10", "S", "M", "L", "30", "32", etc.)
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true, alias: 'userId' },
    items: [CartItemSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CartSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

export default Cart;
