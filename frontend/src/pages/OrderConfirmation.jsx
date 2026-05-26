import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { formatBDT } from '../utils/format';
import './OrderConfirmation.css';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getById(id)
      .then((res) => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  if (!order) {
    return (
      <div className="page confirmation-page">
        <div className="container confirmation-empty">
          <h2>Order not found</h2>
          <Link to="/account" className="btn btn-primary">My Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <div className="confirmation-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 className="confirmation-title">Order Confirmed!</h1>
          <p className="confirmation-id">Order #{order.id}</p>
          <p className="confirmation-text">Thank you for your purchase. You'll receive an email confirmation shortly.</p>

          <div className="confirmation-details">
            <div className="conf-detail">
              <span>Status</span>
              <span className="status-badge">{order.status}</span>
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
