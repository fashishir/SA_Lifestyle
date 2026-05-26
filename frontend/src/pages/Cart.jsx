import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatBDT } from '../utils/format';
import './Cart.css';

export default function Cart() {
  const { user } = useAuth();
  const { items, loading, subtotal, updateItem, removeItem } = useCart();

  if (!user) {
    return (
      <div className="page cart-page">
        <div className="container cart-empty">
          <h2>Sign in to view your cart</h2>
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page"><div className="spinner" /></div>;

  if (items.length === 0) {
    return (
      <div className="page cart-page">
        <div className="container cart-empty">
          <h2>Your Cart is Empty</h2>
          <p>Add some products to get started.</p>
          <Link to="/men" className="btn btn-primary">Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page cart-page">
      <div className="container">
        <h1 className="cart-title">Shopping Cart ({items.length} items)</h1>
        <div className="cart-content">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <Link to={`/product/${item.slug}`} className="cart-item-image">
                  <img src={item.image_urls?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200'} alt={item.name} />
                </Link>
                <div className="cart-item-info">
                  <h3><Link to={`/product/${item.slug}`}>{item.name}</Link></h3>
                  {item.size && <p className="cart-item-detail">Size: {item.size}</p>}
                  {item.color && <p className="cart-item-detail">Colour: {item.color}</p>}
                  <p className="cart-item-price">{formatBDT(item.price)}</p>
                </div>
                <div className="cart-item-qty">
                  <button onClick={() => updateItem(item.id, item.quantity - 1)} className="qty-btn">-</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button onClick={() => updateItem(item.id, item.quantity + 1)} className="qty-btn">+</button>
                </div>
                <div className="cart-item-total">
                  {formatBDT(parseFloat(item.price) * item.quantity)}
                </div>
                <button onClick={() => removeItem(item.id)} className="cart-item-remove" aria-label="Remove">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <hr />
            <Link to="/checkout" className="btn btn-primary checkout-btn">Checkout</Link>
            <Link to="/men" className="btn btn-outline continue-btn">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
