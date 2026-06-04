import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { formatBDT } from '../utils/format';
import './Account.css';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderAPI.getAll()
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="page account-page">
      <div className="container">
        <div className="account-header">
          <div>
            <h1 className="account-greeting">Welcome, {user.name}</h1>
            <p className="account-email">{user.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="btn btn-outline">Sign Out</button>
        </div>

        <section className="account-section">
          <h2>Order History</h2>
          {loading ? (
            <div className="spinner" />
          ) : orders.length === 0 ? (
            <div className="account-empty">
              <p>No orders yet.</p>
              <Link to="/men" className="btn btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const trackingId = order.tracking_id || `SA${String(order.id).padStart(6, '0')}`;
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      <span className="order-id">Order #{order.id}</span>
                      <span className={`order-status status-${order.status}`}>{order.status}</span>
                      <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="order-total">{formatBDT(order.total)}</span>
                    </div>
                    <div className="order-card-tracking">
                      <span className="order-tracking-label">Tracking:</span>
                      <span className="order-tracking-id">{trackingId}</span>
                    </div>
                    <div className="order-card-actions">
                      <Link to={`/track/${trackingId}`} className="order-link">Track Order</Link>
                      <Link to={`/order-confirmation/${order.id}`} className="order-link">View Details</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
