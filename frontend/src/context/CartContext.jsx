import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await cartAPI.get();
      setItems(res.data);
    } catch { setItems([]); }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = async (product_id, size, color, quantity = 1) => {
    const res = await cartAPI.add({ product_id, size, color, quantity });
    await fetchCart();
    return res.data;
  };

  const updateItem = async (id, quantity) => {
    const res = await cartAPI.update(id, { quantity });
    await fetchCart();
    return res.data;
  };

  const removeItem = async (id) => {
    await cartAPI.remove(id);
    await fetchCart();
  };

  const clearCart = async () => {
    await cartAPI.clear();
    setItems([]);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, itemCount, subtotal, addItem, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
