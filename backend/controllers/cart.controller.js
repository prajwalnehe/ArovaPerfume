import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import { Product } from '../models/product.js';

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const formatCartResponse = (cart, userId) => ({
  userId: String(userId),
  items: (cart?.items || []).map((item) => ({
    productId: String(item?.product?._id || item?.product || ''),
    product: item?.product?._id ? item.product : undefined,
    quantity: Number(item?.quantity || 1),
    size: item?.size || undefined,
  })),
});

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    return res.status(200).json(formatCartResponse(cart, req.userId));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body || {};

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be >= 1' });
    }

    const exists = await Product.exists({ _id: productId });
    if (!exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) cart = new Cart({ user: req.userId, items: [] });

    const idx = cart.items.findIndex(
      (i) => String(i.product) === String(productId) && String(i.size || '') === String(size || '')
    );

    if (idx > -1) {
      cart.items[idx].quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty, size: size || undefined });
    }

    await cart.save();
    await cart.populate('items.product');
    return res.status(200).json(formatCartResponse(cart, req.userId));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add item to cart' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(200).json(formatCartResponse(null, req.userId));

    cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
    await cart.save();
    await cart.populate('items.product');
    return res.status(200).json(formatCartResponse(cart, req.userId));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove item from cart' });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body || {};

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty)) {
      return res.status(400).json({ message: 'Quantity must be a number' });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const idx = cart.items.findIndex((i) => String(i.product) === String(productId));
    if (idx === -1) return res.status(404).json({ message: 'Item not found in cart' });

    if (qty <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = qty;
    }

    await cart.save();
    await cart.populate('items.product');
    return res.status(200).json(formatCartResponse(cart, req.userId));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update cart item quantity' });
  }
};
