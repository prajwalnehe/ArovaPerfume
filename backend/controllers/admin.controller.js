import { Product } from '../models/product.js';
import Order from '../models/Order.js';
import { Address } from '../models/Address.js';
import { Policy } from '../models/Policy.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';

const ORDER_STATUS_ALLOWED = new Set(['pending','confirmed','packed','shipped','delivered','cancelled','returned','created','on_the_way']);
const PAYMENT_STATUS_ALLOWED = new Set(['paid','pending','failed','refunded']);
const PAYMENT_METHOD_ALLOWED = new Set(['razorpay','cod','card','upi']);

const mapLegacyStatusToOrderStatus = (status = '') => {
  const s = String(status).toLowerCase();
  if (s === 'delivered') return 'delivered';
  if (s === 'on_the_way' || s === 'paid') return 'confirmed';
  if (s === 'failed') return 'cancelled';
  if (s === 'created' || s === 'pending') return 'pending';
  return 'pending';
};

const mapLegacyStatusToPaymentStatus = (status = '') => {
  const s = String(status).toLowerCase();
  if (s === 'failed') return 'failed';
  if (s === 'paid') return 'paid';
  return 'pending';
};

const normalizeOrder = (orderDoc) => {
  const o = orderDoc?.toObject ? orderDoc.toObject() : { ...(orderDoc || {}) };
  const orderStatus = o.orderStatus || mapLegacyStatusToOrderStatus(o.status);
  const paymentStatus = o.paymentStatus || mapLegacyStatusToPaymentStatus(o.status);
  const paymentMethod = o.paymentMethod || (o.razorpayPaymentId ? 'razorpay' : 'cod');
  const transactionId = o.transactionId || o.razorpayPaymentId || o.razorpayOrderId || '';

  // Calculate price breakdown with fallbacks for old orders
  const itemsPrice = o.itemsPrice || o.items?.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0) || 0;
  const taxPrice = o.taxPrice || Math.round(itemsPrice * 0.05) || 0;
  const shippingPrice = o.shippingPrice || (itemsPrice >= 5000 ? 0 : 99) || 0;
  const discount = o.discount || o.couponDiscount || 0;
  const totalPrice = o.totalPrice || (itemsPrice + taxPrice + shippingPrice - discount) || o.amount || 0;

  return {
    ...o,
    orderStatus,
    paymentStatus,
    paymentMethod,
    transactionId,
    // Price breakdown
    itemsPrice,
    taxPrice,
    shippingPrice,
    discount,
    totalPrice,
    couponCode: o.couponCode,
    isPaid: o.isPaid || paymentStatus === 'paid',
    paidAt: o.paidAt,
  };
};

export async function createProduct(req, res) {
  try {
    const {
      title,
      mrp,
      discountPercent = 0,
      description = '',
      category,
      product_info = {},
      images = {},
      categoryId,
    } = req.body || {};

    if (!title || typeof mrp === 'undefined' || !category) {
      return res.status(400).json({ message: 'title, mrp and category are required' });
    }

    const imageGallery = [images.image1, images.image2, images.image3].filter(Boolean);
    const salePrice = Number(mrp) - (Number(mrp) * (Number(discountPercent) || 0)) / 100;

    const payload = {
      title,
      brand: product_info.brand || '',
      gender: req.body?.gender || 'Unisex',
      salePrice: Math.max(0, Number(salePrice.toFixed(2))),
      mrp: Number(mrp),
      discountPercent: Number(discountPercent) || 0,
      description,
      category,
      type: req.body?.type || '',
      images: imageGallery,
    };

    if (categoryId) payload.categoryId = categoryId;

    const product = await Product.create(payload);
    const p = product.toObject();
    return res.status(201).json({
      ...p,
      imageGallery: p.images || [],
      images: { image1: p.images?.[0] || '', image2: p.images?.[1] || '', image3: p.images?.[2] || '' },
      product_info: { brand: p.brand || '' },
      price: p.salePrice,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const {
      status,
      orderStatus,
      paymentStatus,
      paymentMethod,
      transactionId,
      adminNote,
      action,
    } = req.body || {};

    const updates = {};
    const nextOrderStatus = (orderStatus || status || '').toString().toLowerCase();
    if (nextOrderStatus) {
      if (!ORDER_STATUS_ALLOWED.has(nextOrderStatus)) {
        return res.status(400).json({ message: 'Invalid order status', allowed: Array.from(ORDER_STATUS_ALLOWED) });
      }
      updates.orderStatus = nextOrderStatus;
      // Keep legacy status in sync for backward compatibility
      updates.status = nextOrderStatus;
      if (nextOrderStatus === 'cancelled') {
        updates.paymentStatus = updates.paymentStatus || 'refunded';
      }
    }

    if (paymentStatus) {
      const normalized = String(paymentStatus).toLowerCase();
      if (!PAYMENT_STATUS_ALLOWED.has(normalized)) {
        return res.status(400).json({ message: 'Invalid payment status', allowed: Array.from(PAYMENT_STATUS_ALLOWED) });
      }
      updates.paymentStatus = normalized;
      // Reflect into legacy status when possible
      if (!updates.status && (normalized === 'paid' || normalized === 'failed')) {
        updates.status = normalized === 'paid' ? 'paid' : 'failed';
      }
    }

    if (paymentMethod) {
      const normalized = String(paymentMethod).toLowerCase();
      if (!PAYMENT_METHOD_ALLOWED.has(normalized)) {
        return res.status(400).json({ message: 'Invalid payment method', allowed: Array.from(PAYMENT_METHOD_ALLOWED) });
      }
      updates.paymentMethod = normalized;
    }

    if (transactionId) {
      updates.transactionId = transactionId;
    }

    // Support quick actions
    if (action === 'cancel') {
      updates.orderStatus = 'cancelled';
      updates.status = 'cancelled';
      updates.paymentStatus = updates.paymentStatus || 'pending';
    }
    if (action === 'refund') {
      updates.paymentStatus = 'refunded';
      if (!updates.orderStatus) updates.orderStatus = 'cancelled';
      if (!updates.status) updates.status = 'cancelled';
    }

    const updateOps = { $set: updates };
    if (adminNote) {
      updateOps.$push = { adminNotes: { note: adminNote, createdAt: new Date() } };
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateOps,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(normalizeOrder(order));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
}

export async function adminListProducts(req, res) {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to list products', error: err.message });
  }
}

export async function deleteProductById(req, res) {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
}

export async function adminListOrders(req, res) {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();

    // Best-effort address enrichment; never fail the whole response for this step
    try {
      const userIds = Array.from(new Set(orders.map(o => String(o.user?._id)).filter(Boolean)));
      let addrMap = {};
      if (userIds.length > 0) {
        const addrs = await Address.find({ userId: { $in: userIds } }).lean();
        addrMap = Object.fromEntries(addrs.map(a => [String(a.userId), a]));
      }
      const enriched = orders.map(o => {
        const base = {
          ...o,
          address: o.shippingAddress || (o.user?._id ? (addrMap[String(o.user._id)] || null) : null),
        };
        return normalizeOrder(base);
      });
      return res.json(enriched);
    } catch {
      // Fallback: return orders without address enrichment
      return res.json(orders.map(normalizeOrder));
    }
  } catch (err) {
    return res.status(500).json({ message: 'Failed to list orders', error: err.message });
  }
}

export async function adminGetOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate({
        path: 'items.product',
        select: 'title price mrp images product_info',
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(normalizeOrder(order));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
}

export async function adminStats(req, res) {
  try {
    // Calculate revenue from delivered orders (using orderStatus field if available, fallback to status)
    const [revenueAgg] = await Order.aggregate([
      { 
        $match: { 
          $or: [
            { orderStatus: 'delivered' },
            { status: 'delivered' }
          ]
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalRevenue = revenueAgg?.total || 0;
    
    // Count all documents
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    
    return res.json({ 
      totalRevenue, 
      totalOrders, 
      totalProducts, 
      totalUsers,
      // Additional stats for frontend compatibility
      usersCount: totalUsers,
      productsCount: totalProducts,
      ordersCount: totalOrders,
      revenue: totalRevenue
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load stats', error: err.message });
  }
}

export async function adminListAddresses(req, res) {
  try {
    const addrs = await Address.find({}).sort({ createdAt: -1 }).populate('userId', 'name email').lean();
    return res.json(addrs);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to list addresses', error: err.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { mrp, discountPercent } = req.body;

    if (typeof mrp === 'undefined' && typeof discountPercent === 'undefined') {
      return res.status(400).json({ message: 'At least one field (mrp or discountPercent) is required' });
    }

    const updates = {};
    if (typeof mrp !== 'undefined') {
      updates.mrp = Number(mrp);
    }
    if (typeof discountPercent !== 'undefined') {
      updates.discountPercent = Number(discountPercent) || 0;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
}

// Policy management functions
export async function getPolicy(req, res) {
  try {
    const { type } = req.params;
    const allowedTypes = ['privacy', 'terms', 'shipping', 'returns'];
    
    if (!allowedTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid policy type' });
    }

    const policy = await Policy.findOne({ type: type.toLowerCase() });
    
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    return res.json(policy);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch policy', error: err.message });
  }
}

export async function getAllPolicies(req, res) {
  try {
    const policies = await Policy.find({}).sort({ type: 1 });
    return res.json(policies);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch policies', error: err.message });
  }
}

export async function updatePolicy(req, res) {
  try {
    const { type } = req.params;
    const { title, content } = req.body;
    
    const allowedTypes = ['privacy', 'terms', 'shipping', 'returns'];
    
    if (!allowedTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid policy type' });
    }

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const policy = await Policy.findOneAndUpdate(
      { type: type.toLowerCase() },
      { 
        title, 
        content, 
        lastUpdated: new Date() 
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    return res.json(policy);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update policy', error: err.message });
  }
}

// Logo/Settings management functions
export async function getLogo(req, res) {
  try {
    const navbarLogo = await Settings.findOne({ key: 'navbar_logo' });
    const footerLogo = await Settings.findOne({ key: 'footer_logo' });
    
    return res.json({
      navbarLogo: navbarLogo?.value || 'https://res.cloudinary.com/dvkxgrcbv/image/upload/v1766485714/Untitled_design_gpc5ty.svg',
      footerLogo: footerLogo?.value || 'https://res.cloudinary.com/duc9svg7w/image/upload/v1765301725/Black_and_White_Bold_Line_Minimalist_Design_Studio_Logo_1_wfnkbf.png'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch logo settings', error: err.message });
  }
}

export async function updateLogo(req, res) {
  try {
    const { navbarLogo, footerLogo } = req.body;
    
    if (!navbarLogo && !footerLogo) {
      return res.status(400).json({ message: 'At least one logo URL is required' });
    }

    const updates = [];
    
    if (navbarLogo) {
      const navbarSetting = await Settings.findOneAndUpdate(
        { key: 'navbar_logo' },
        { 
          key: 'navbar_logo',
          value: navbarLogo,
          description: 'Logo displayed in the navigation bar'
        },
        { new: true, upsert: true, runValidators: true }
      );
      updates.push(navbarSetting);
    }
    
    if (footerLogo) {
      const footerSetting = await Settings.findOneAndUpdate(
        { key: 'footer_logo' },
        { 
          key: 'footer_logo',
          value: footerLogo,
          description: 'Logo displayed in the footer'
        },
        { new: true, upsert: true, runValidators: true }
      );
      updates.push(footerSetting);
    }

    return res.json({ 
      message: 'Logo updated successfully',
      navbarLogo: updates.find(s => s.key === 'navbar_logo')?.value,
      footerLogo: updates.find(s => s.key === 'footer_logo')?.value
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update logo', error: err.message });
  }
}

// Hero Slider management functions
export async function getHeroSlider(req, res) {
  try {
    const heroSliderSetting = await Settings.findOne({ key: 'hero_slider' });
    
    // Default banners if none exist
    const defaultSlides = [
      {
        desktop: "https://res.cloudinary.com/duc9svg7w/image/upload/v1765299332/Blue_and_White_Modern_Fashion_Store_Banner_2048_x_594_px_ga4muy.png",
        alt: 'TickNTrack - Premium Shoes & Watches Collection',
      },
      {
        desktop: 'https://res.cloudinary.com/duc9svg7w/image/upload/v1765299330/Bone_Pink_Luxury_Premium_Isolated_Parfum_Banner_Landscape_2048_x_594_px_jqytrt.png',
        alt: 'Festive Offer - TickNTrack',
      },
      {
        desktop: 'https://res.cloudinary.com/duc9svg7w/image/upload/v1765299332/Brown_White_Modern_Fashion_Banner_2048_x_594_px_kfx9s8.png',
        alt: 'Festive Offer - TickNTrack',
      },
      {
        desktop: 'https://res.cloudinary.com/duc9svg7w/image/upload/v1765304356/White_Fashion_Shoes_For_Men_Themes_Facebook_Cover_2048_x_594_px_ihwivu.png',
        alt: 'Festive Offer - TickNTrack',
      },
    ];
    const defaultMobileSrc = 'https://res.cloudinary.com/duc9svg7w/image/upload/v1765299343/Brown_Minimalist_Lifestyle_Fashion_Instagram_Post_1080_x_1080_px_yi1bzg.png';
    
    if (!heroSliderSetting || !heroSliderSetting.value) {
      return res.json({
        slides: defaultSlides,
        mobileSrc: defaultMobileSrc
      });
    }
    
    try {
      const parsed = JSON.parse(heroSliderSetting.value);
      return res.json({
        slides: parsed.slides || defaultSlides,
        mobileSrc: parsed.mobileSrc || defaultMobileSrc
      });
    } catch {
      return res.json({
        slides: defaultSlides,
        mobileSrc: defaultMobileSrc
      });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch hero slider settings', error: err.message });
  }
}

export async function updateHeroSlider(req, res) {
  try {
    const { slides, mobileSrc } = req.body;
    
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ message: 'Slides array is required and must not be empty' });
    }

    // Validate slides structure
    for (const slide of slides) {
      if (!slide.desktop || typeof slide.desktop !== 'string') {
        return res.status(400).json({ message: 'Each slide must have a desktop URL' });
      }
    }

    const value = JSON.stringify({
      slides: slides.map(s => ({
        desktop: s.desktop,
        alt: s.alt || `Banner ${slides.indexOf(s) + 1}`
      })),
      mobileSrc: mobileSrc || slides[0]?.desktop || ''
    });

    const heroSliderSetting = await Settings.findOneAndUpdate(
      { key: 'hero_slider' },
      { 
        key: 'hero_slider',
        value: value,
        description: 'Hero slider banners for homepage'
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({ 
      message: 'Hero slider updated successfully',
      slides: JSON.parse(heroSliderSetting.value).slides,
      mobileSrc: JSON.parse(heroSliderSetting.value).mobileSrc
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update hero slider', error: err.message });
  }
}
