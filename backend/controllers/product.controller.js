import { Product } from '../models/product.js';
import mongoose from 'mongoose';
const normalizeGender = (gender) => {
  const value = String(gender || '').trim().toLowerCase();
  if (value === 'men' || value === 'male') return 'Men';
  if (value === 'women' || value === 'female') return 'Women';
  if (value === 'unisex') return 'Unisex';
  return undefined;
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCategoryTerm = (value = '') => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  const mapped = {
    perfumes: 'perfume',
    fragrance: 'perfume',
    fragrances: 'perfume',
  };
  if (mapped[raw]) return mapped[raw];
  // Basic singularization for common plural inputs
  if (raw.endsWith('es')) return raw.slice(0, -2);
  if (raw.endsWith('s')) return raw.slice(0, -1);
  return raw;
};

const toImageArray = (images) => {
  if (Array.isArray(images)) return images.filter(Boolean).map((url) => String(url).trim()).filter(Boolean);
  if (images && typeof images === 'object') {
    return Object.values(images).filter(Boolean).map((url) => String(url).trim()).filter(Boolean);
  }
  return [];
};

const mapPayload = (body = {}) => {
  const images = toImageArray(body.images);
  const mrp = Number(body?.pricing?.mrp ?? body.mrp ?? 0);
  const salePrice = Number(body?.pricing?.salePrice ?? body.salePrice ?? body.price ?? mrp);
  const gender = normalizeGender(body.gender);

  return {
    title: body.title,
    brand: body.brand ?? body.product_info?.brand,
    gender,
    category: body.category,
    subcategory: body.subcategory,
    type: body.type,
    reviews: {
      totalReviews: Number(body?.reviews?.totalReviews ?? body.totalReviews ?? 0),
      rating: Number(body?.reviews?.rating ?? body.rating ?? 0),
    },
    pricing: {
      salePrice,
      mrp,
      discountPercent: Number(body?.pricing?.discountPercent ?? body.discountPercent ?? 0),
      taxIncluded: Boolean(body?.pricing?.taxIncluded ?? body.taxIncluded ?? true),
    },
    stock: {
      quantity: Number(body?.stock?.quantity ?? body.quantity ?? 0),
      sku: body?.stock?.sku ?? body.sku ?? '',
    },
    notes: {
      topNotes: body?.notes?.topNotes ?? body.topNotes ?? [],
      middleNotes: body?.notes?.middleNotes ?? body.middleNotes ?? [],
      baseNotes: body?.notes?.baseNotes ?? body.baseNotes ?? [],
    },
    description: body.description,
    offers: {
      couponCode: body?.offers?.couponCode ?? body.couponCode ?? '',
      discount: Number(body?.offers?.discount ?? body.discount ?? 0),
      applicableOn: body?.offers?.applicableOn ?? body.applicableOn ?? '',
    },
    services: {
      secureTransaction: Boolean(body?.services?.secureTransaction ?? body.secureTransaction ?? true),
      payOnDelivery: Boolean(body?.services?.payOnDelivery ?? body.payOnDelivery ?? false),
      easyTracking: Boolean(body?.services?.easyTracking ?? body.easyTracking ?? true),
      freeDelivery: Boolean(body?.services?.freeDelivery ?? body.freeDelivery ?? false),
    },
    shippingAndReturns: body.shippingAndReturns || undefined,
    images,
    pincodeServiceable: body.pincodeServiceable,
  };
};

const toClientShape = (product) => {
  const doc = product.toObject ? product.toObject() : product;
  const gallery = Array.isArray(doc.images) ? doc.images : [];
  const pricing = doc.pricing || {};
  const reviews = doc.reviews || {};
  const stock = doc.stock || {};
  const notes = doc.notes || {};
  const offers = doc.offers || {};
  const services = doc.services || {};
  return {
    ...doc,
    salePrice: pricing.salePrice,
    mrp: pricing.mrp,
    discountPercent: pricing.discountPercent,
    taxIncluded: pricing.taxIncluded,
    totalReviews: reviews.totalReviews,
    rating: reviews.rating,
    quantity: stock.quantity,
    sku: stock.sku,
    topNotes: notes.topNotes || [],
    middleNotes: notes.middleNotes || [],
    baseNotes: notes.baseNotes || [],
    couponCode: offers.couponCode || '',
    discount: offers.discount || 0,
    applicableOn: offers.applicableOn || '',
    secureTransaction: services.secureTransaction,
    payOnDelivery: services.payOnDelivery,
    easyTracking: services.easyTracking,
    freeDelivery: services.freeDelivery,
    imageGallery: gallery,
    // Keep backward compatibility for current frontend usage.
    images: { image1: gallery[0] || '', image2: gallery[1] || '', image3: gallery[2] || '' },
    product_info: { brand: doc.brand || '' },
    price: pricing.salePrice,
  };
};

export const createProduct = async (req, res) => {
  try {
    const payload = mapPayload(req.body);
    const product = await Product.create(payload);
    return res.status(201).json(toClientShape(product));
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create product', error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { category, subcategory, gender, q } = req.query;
    const query = {};

    // Filter by category (strict match on category field only)
    if (category) {
      const term = category.trim();
      // Use exact match for category to prevent cross-contamination
      query.category = { $regex: new RegExp(`^${escapeRegex(term)}$`, 'i') };
    }

    if (subcategory) {
      query.subcategory = { $regex: new RegExp(escapeRegex(String(subcategory).trim()), 'i') };
    }

    if (q) {
      const keyword = String(q).trim();
      const searchOr = [
        { title: { $regex: new RegExp(keyword, 'i') } },
        { brand: { $regex: new RegExp(keyword, 'i') } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const products = await Product.find(query).sort({ category: 1, createdAt: -1 }).lean();
    return res.json(products.map(toClientShape));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).lean();
    } else {
      // Compatibility: allow string _id records inserted directly in MongoDB.
      product = await Product.collection.findOne({ _id: id });
    }
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(toClientShape(product));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const payload = mapPayload(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(toClientShape(product));
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};
