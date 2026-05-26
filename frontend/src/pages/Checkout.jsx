import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import { formatBDT } from '../utils/format';
import './Checkout.css';

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ fullName: '', street: '', city: '', state: '', zip: '', phone: '' });
  const [placing, setPlacing] = useState(false);

  if (!user) { navigate('/login'); return null; }
  if (items.length === 0) { navigate('/cart'); return null; }

  const handleChange = (e) => {
    setAddress((a) => ({ ...a, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.fullName || !address.street || !address.city) return;
    setPlacing(true);
    try {
      const res = await orderAPI.create({ shipping_address: address });
      await clearCart();
      navigate(`/order-confirmation/${res.data.id}`);
    } catch (err) {
      alert('Failed to place order: ' + (err.response?.data?.message || err.message));
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
              <input name="phone" placeholder="Phone Number" value={address.phone} onChange={handleChange} className="form-input" />
            </div>

            <h2>Payment</h2>
            <div className="simulated-payment">
              <p>This is a simulated checkout — no real payment will be processed.</p>
              <div className="card-preview">
                <div className="card-field">
                  <label>Card Number</label>
                  <input type="text" placeholder="4242 4242 4242 4242" disabled className="form-input" />
                </div>
                <div className="card-row">
                  <div className="card-field">
                    <label>Expiry</label>
                    <input type="text" placeholder="12/28" disabled className="form-input" />
                  </div>
                  <div className="card-field">
                    <label>CVC</label>
                    <input type="text" placeholder="123" disabled className="form-input" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary place-order-btn" disabled={placing}>
              {placing ? 'Placing Order...' : `Place Order — ${formatBDT(subtotal)}`}
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
            <div className="summary-total">
              <span>Total</span>
<span>{formatBDT(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
