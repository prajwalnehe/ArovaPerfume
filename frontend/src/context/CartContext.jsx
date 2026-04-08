import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const CartContext = createContext();
const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const hasToken = () => Boolean(localStorage.getItem('auth_token'));
  const isUnauthorizedError = (error) => /no token|invalid token|unauthorized|401/i.test(String(error?.message || ''));

  const mapServerCartToUI = useCallback((data) => {
    const items = data?.items || [];
    return items.map((i) => {
      const p = i.product || i.productId || {};
      const price = typeof p.price === 'number'
        ? p.price
        : (typeof p.mrp === 'number' ? Math.round(p.mrp - (p.mrp * (p.discountPercent || 0) / 100)) : 0);
      return {
        id: p._id || i.productId, // used by UI and for remove
        name: p.title || 'Product',
        image: p.images?.image1,
        material: p.product_info?.SareeMaterial,
        work: p.product_info?.IncludedComponents,
        brand: p.product_info?.brand,
        color: p.product_info?.KurtiColor || p.product_info?.SareeColor,
        price,
        originalPrice: p.mrp,
        quantity: i.quantity || 1,
      };
    });
  }, []);

  const loadCart = useCallback(async () => {
    if (!hasToken()) {
      setCart([]);
      return;
    }
    const data = await api.getCart();
    setCart(mapServerCartToUI(data));
  }, [mapServerCartToUI]);

  const addToCart = useCallback(async (productIdOrObj, quantity = 1, size = null) => {
    const isObj = typeof productIdOrObj === 'object' && productIdOrObj;
    const productId = String(isObj ? (productIdOrObj._id || productIdOrObj.id) : productIdOrObj || '');
    const qty = Math.max(1, Number(quantity) || 1);
    if (!productId) return { ok: false, redirected: false };

    if (!hasToken()) {
      navigate('/signin', { state: { from: location } });
      return { ok: false, redirected: true };
    }

    if (!isMongoObjectId(productId)) {
      throw new Error('This product is not cart-enabled yet (invalid productId).');
    }

    // Optimistic update for instant cart count/UI feedback.
    if (isObj) {
      const p = productIdOrObj;
      const price = Number(p.price || p.salePrice || p.mrp || 0);
      setCart((prev) => {
        const list = [...prev];
        const idx = list.findIndex((i) => String(i.id) === String(productId));
        if (idx > -1) {
          list[idx] = { ...list[idx], quantity: (list[idx].quantity || 1) + qty };
          return list;
        }
        list.push({
          id: String(productId),
          name: p.title || p.name || 'Product',
          image: p.images?.image1 || p.image || '',
          brand: p.product_info?.brand || p.brand || '',
          price,
          originalPrice: Number(p.mrp || price),
          quantity: qty,
          size: size || null,
        });
        return list;
      });
    }

    try {
      await api.addToCart({ productId, quantity: qty, size });
      await loadCart();
      try {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: 'Added to cart', type: 'success' } }));
      } catch {}
      return { ok: true, redirected: false };
    } catch (error) {
      if (isUnauthorizedError(error)) {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_is_admin');
        } catch {}
        navigate('/signin', { state: { from: location } });
        return { ok: false, redirected: true };
      }
      await loadCart(); // rollback optimistic state from server truth
      throw error;
    }
  }, [loadCart, navigate, location]);

  const removeFromCart = useCallback(async (productId) => {
    if (!hasToken()) {
      navigate('/signin', { state: { from: location } });
      return;
    }
    setCart((prev) => prev.filter((i) => String(i.id) !== String(productId)));
    try {
      await api.removeFromCart(productId);
      await loadCart();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_is_admin');
        } catch {}
        navigate('/signin', { state: { from: location } });
        return;
      }
      await loadCart();
      throw error;
    }
  }, [loadCart, navigate, location]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (!hasToken()) {
      navigate('/signin', { state: { from: location } });
      return;
    }

    const qty = Number(newQuantity);
    if (!Number.isFinite(qty)) return;

    if (qty < 1) {
      await removeFromCart(productId);
      return;
    }

    const previousCart = cart;
    setCart((prev) => prev.map((item) => (
      String(item.id) === String(productId) ? { ...item, quantity: qty } : item
    )));

    try {
      await api.updateCart({ productId, quantity: qty });
      await loadCart();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_is_admin');
        } catch {}
        navigate('/signin', { state: { from: location } });
        return;
      }
      setCart(previousCart);
      throw error;
    }
  }, [removeFromCart, cart, loadCart, navigate, location]);

  const clearCart = useCallback(async () => {
    if (!hasToken()) {
      setCart([]);
      return;
    }

    const current = [...cart];
    setCart([]);
    try {
      for (const item of current) {
        await api.removeFromCart(item.id);
      }
      await loadCart();
    } catch (error) {
      setCart(current);
      throw error;
    }
  }, [cart, loadCart]);

  const cartTotal = cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

  useEffect(() => {
    loadCart();
    const onStorage = (e) => {
      if (!e || e.key === 'auth_token') loadCart();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadCart]);

  // Also reload on route changes to reflect auth changes in the same tab.
  useEffect(() => {
    loadCart();
  }, [location.pathname, loadCart]);

  // Reload in same tab on auth updates.
  useEffect(() => {
    const onAuthUpdated = () => loadCart();
    window.addEventListener('auth:updated', onAuthUpdated);
    return () => window.removeEventListener('auth:updated', onAuthUpdated);
  }, [loadCart]);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      loadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
