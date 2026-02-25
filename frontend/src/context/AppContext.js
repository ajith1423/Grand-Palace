import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0, vat: 0, shipping: 0, total: 0 });
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]); // Main categories with children
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([]); // Flat list of all categories for lookups
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('session_id') || null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const params = sessionId ? { session_id: sessionId } : {};
      const res = await axios.get(`${API}/cart`, { headers: getAuthHeaders(), params });
      setCart(res.data);
    } catch (e) {
      console.error('Failed to fetch cart', e);
    }
  }, [getAuthHeaders, sessionId]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/settings`);
      setSettings(res.data);
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      // API now returns main categories with children arrays
      // Sort main categories A-Z
      const sortedCategories = [...res.data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // Sort children of each category A-Z
      sortedCategories.forEach(cat => {
        if (cat.children && Array.isArray(cat.children)) {
          cat.children.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
      });

      setCategories(sortedCategories);

      // Build flat list for lookups
      const flat = [];
      sortedCategories.forEach(cat => {
        flat.push(cat);
        if (cat.children) {
          cat.children.forEach(child => flat.push(child));
        }
      });
      setAllCategoriesFlat(flat);
    } catch (e) {
      console.error('Failed to fetch categories', e);
    }
  }, [API]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
      } catch (e) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([checkAuth(), fetchSettings(), fetchCategories()]);
      await fetchCart();
    };
    init();
  }, [checkAuth, fetchSettings, fetchCategories, fetchCart]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    await fetchCart();
    return res.data;
  };

  const loginWithPhone = async (idToken) => {
    const res = await axios.post(`${API}/auth/firebase/verify-phone`, { idToken });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    await fetchCart();
    return res.data;
  };

  const register = async (data) => {
    const res = await axios.post(`${API}/auth/register`, data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    await fetchCart();
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart({ items: [], subtotal: 0, vat: 0, shipping: 0, total: 0 });
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
        return res.data;
      } catch (e) {
        console.error('Failed to refresh user', e);
      }
    }
    return null;
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const params = sessionId ? { session_id: sessionId } : {};
      const res = await axios.post(`${API}/cart/add`, { product_id: productId, quantity }, { headers: getAuthHeaders(), params });
      if (res.data.session_id && !sessionId) {
        setSessionId(res.data.session_id);
        localStorage.setItem('session_id', res.data.session_id);
      }
      await fetchCart();
      toast.success('Added to cart');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const params = sessionId ? { session_id: sessionId } : {};
      await axios.put(`${API}/cart/update`, { product_id: productId, quantity }, { headers: getAuthHeaders(), params });
      await fetchCart();
    } catch (e) {
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const params = sessionId ? { session_id: sessionId } : {};
      await axios.delete(`${API}/cart/remove/${productId}`, { headers: getAuthHeaders(), params });
      await fetchCart();
      toast.success('Item removed');
    } catch (e) {
      toast.error('Failed to remove item');
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser, cart, setCart, settings, categories, allCategoriesFlat, loading,
      login, loginWithPhone, register, logout, refreshUser, addToCart, updateCartItem, removeFromCart,
      fetchCart, getAuthHeaders, sessionId, API
    }}>
      {children}
    </AppContext.Provider>
  );
};
