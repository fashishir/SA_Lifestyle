import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { formatBDT } from '../utils/format';
import './OrderConfirmation.css';

function generateTrackingId(orderId) {
  return `SA${String(orderId).padStart(6, '0')}`;
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    orderAPI.getById(id)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('Order not found');
        } else {
          setError('Failed to load order');
        }
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="page confirmation-page">
        <div className="container">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page confirmation-page">
        <div className="container confirmation-container">
          <div className="confirmation-card">
            <div className="confirmation-icon error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cc0000" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="confirmation-title">Order Not Found</h1>
            <p className="confirmation-text">{error || 'This order could not be found.'}</p>
            <div className="confirmation-actions">
              <Link to="/account" className="btn btn-primary">My Orders</Link>
              <Link to="/men" className="btn btn-outline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const trackingId = generateTrackingId(order.id);

  return (
    <div className="page confirmation-page">
      <div className="container confirmation-container">
        <div className="confirmation-card">
          <div className="confirmation-icon success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="confirmation-title">Order Confirmed!</h1>
          <p className="confirmation-id">Order #{order.id}</p>
          <p className="confirmation-text">
            Thank you for your purchase. You'll receive an email confirmation shortly.
          </p>

          {/* Tracking Number */}
          <div className="tracking-section">
            <div className="tracking-label">Tracking Number</div>
            <div className="tracking-number">{trackingId}</div>
          </div>

          <div className="confirmation-actions" style={{ marginBottom: 24 }}>
            <Link to={`/track/${trackingId}`} className="btn btn-primary" style={{ width: '100%' }}>
              🚚 Track this order
            </Link>
          </div>

          <div className="confirmation-details">
            <div className="conf-detail">
              <span>Status</span>
              <span className={`status-badge status-${order.status}`}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
              </span>
            </div>
            <div className="conf-detail">
              <span>Total</span>
              <span>{formatBDT(order.total)}</span>
            </div>
            <div className="conf-detail">
              <span>Date</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/account" className="btn btn-outline">View My Orders</Link>
            <Link to="/men" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
