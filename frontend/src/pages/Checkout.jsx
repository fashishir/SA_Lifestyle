import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import { formatBDT } from '../utils/format';
import './Checkout.css';

const PAYMENT_METHODS = [
  {
    key: 'cod',
    title: 'Cash on Delivery',
    description: 'Pay with cash when your order arrives.',
    icon: '💵',
    accent: '#10b981',
  },
  {
    key: 'sslcommerz',
    title: 'Online Payment',
    description: 'Pay securely with card / mobile banking (SSLCommerz).',
    icon: '💳',
    accent: '#3b82f6',
  },
];

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    fullName: '', street: '', city: '', state: '', zip: '', phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  if (!user) { navigate('/login'); return null; }
  if (items.length === 0) { navigate('/cart'); return null; }

  const handleChange = (e) => {
    setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!address.fullName || !address.street || !address.city) {
      setError('Please fill in your name, street and city.');
      return;
    }
    if (paymentMethod === 'cod') {
      const phoneClean = (address.phone || '').replace(/\s|-/g, '');
      if (phoneClean.length < 7) {
        setError('A valid phone number is required for Cash on Delivery.');
        return;
      }
    }

    setPlacing(true);
    try {
      const res = await orderAPI.create({
        shipping_address: address,
        payment_method: paymentMethod,
        phone: address.phone || null,
        notes: notes.trim() || null,
      });
      await clearCart();
      navigate(`/order-confirmation/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
    setPlacing(false);
  };

  return (
    <div className="page checkout-page">
      <div className="container">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-content">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Shipping Address</h2>
            <div className="form-grid">
              <input name="fullName" placeholder="Full Name" value={address.fullName} onChange={handleChange} required className="form-input full" />
              <input name="street" placeholder="Street Address" value={address.street} onChange={handleChange} required className="form-input full" />
              <input name="city" placeholder="City" value={address.city} onChange={handleChange} required className="form-input" />
              <input name="state" placeholder="State/Province" value={address.state} onChange={handleChange} className="form-input" />
              <input name="zip" placeholder="Postal Code" value={address.zip} onChange={handleChange} className="form-input" />
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number (required for COD)"
                value={address.phone}
                onChange={handleChange}
                required={paymentMethod === 'cod'}
                className="form-input"
              />
            </div>

            <h2>Payment Method</h2>
            <div className="payment-methods" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((m) => {
                const active = paymentMethod === m.key;
                return (
                  <label
                    key={m.key}
                    className={`payment-option ${active ? 'active' : ''}`}
                    style={active ? { borderColor: m.accent, boxShadow: `0 0 0 3px ${m.accent}1f` } : undefined}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.key}
                      checked={active}
                      onChange={() => setPaymentMethod(m.key)}
                    />
                    <div className="payment-option-icon" style={{ background: `${m.accent}1a`, color: m.accent }}>
                      <span aria-hidden="true">{m.icon}</span>
                    </div>
                    <div className="payment-option-body">
                      <div className="payment-option-title">{m.title}</div>
                      <div className="payment-option-desc">{m.description}</div>
                    </div>
                    <div className="payment-option-check" aria-hidden="true">
                      {active ? '●' : '○'}
                    </div>
                  </label>
                );
              })}
            </div>

            {paymentMethod === 'cod' && (
              <div className="cod-note">
                <span className="cod-note-icon" aria-hidden="true">ℹ️</span>
                <div>
                  <strong>Pay in cash on delivery.</strong>
                  <p>Please keep exact change ready. Our delivery agent will collect {formatBDT(subtotal)} at your door.</p>
                </div>
              </div>
            )}

            <h2>Delivery Notes <span className="optional-tag">(optional)</span></h2>
            <textarea
              name="notes"
              placeholder="Any special instructions for delivery?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input full"
              rows={2}
            />

            {error && (
              <div className="checkout-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary place-order-btn" disabled={placing}>
              {placing ? 'Placing Order…' : `Place Order — ${formatBDT(subtotal)}`}
            </button>
          </form>

          <div className="checkout-summary">
            <h3>Order Summary</h3>
            {items.map((item) => (
              <div key={item.id} className="checkout-item">
                <img src={item.image_urls?.[0] || ''} alt={item.name} className="checkout-item-img" />
                <div>
                  <p className="checkout-item-name">{item.name}</p>
                  <p className="checkout-item-detail">Qty: {item.quantity} {item.size && `| Size: ${item.size}`}</p>
                </div>
                <span className="checkout-item-price">{formatBDT(parseFloat(item.price) * item.quantity)}</span>
              </div>
            ))}
            <hr />
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className="summary-free">Free</span>
            </div>
            <div className="summary-row">
              <span>Payment</span>
              <span>{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (SSLCommerz)'}</span>
            </div>
            <hr />
            <div className="summary-total">
              <span>Total</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
            <div className="checkout-trust">
              <span>🔒 Secure checkout</span>
              <span>↩️ 7-day easy returns</span>
            </div>
          </div>
        </div>
        <p className="checkout-back-link">
          <Link to="/cart">← Back to cart</Link>
        </p>
      </div>
    </div>
  );
}
