import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { formatBDT, formatNumber, timeAgo } from '../utils/format';
import './TrackOrder.css';

const STATUS_META = {
  pending:   { label: 'Order Placed',     color: '#f59e0b', icon: '📝' },
  confirmed: { label: 'Confirmed',        color: '#3b82f6', icon: '✅' },
  shipped:   { label: 'Shipped',          color: '#8b5cf6', icon: '🚚' },
  delivered: { label: 'Delivered',        color: '#10b981', icon: '🎉' },
  cancelled: { label: 'Cancelled',        color: '#ef4444', icon: '✕' },
};

const PAYMENT_LABEL = {
  cod: 'Cash on Delivery',
  sslcommerz: 'Online Payment',
};

export default function TrackOrder() {
  const { trackingId: rawId } = useParams();
  const navigate = useNavigate();
  const trackingId = (rawId || '').toUpperCase();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState(trackingId);

  useEffect(() => {
    if (!trackingId) return;
    setLoading(true);
    setError(null);
    orderAPI.track(trackingId)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setError('Order not found. Please check your tracking ID.');
        else setError(err.response?.data?.message || err.message || 'Failed to load tracking info.');
      })
      .finally(() => setLoading(false));
  }, [trackingId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const v = searchValue.trim().toUpperCase();
    if (!v) return;
    navigate(`/track/${v}`);
  };

  return (
    <div className="page track-page">
      <div className="container">
        <header className="track-header">
          <h1 className="track-title">Track Your Order</h1>
          <p className="track-subtitle">Enter your tracking number to see real-time updates.</p>
          <form className="track-search" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="SA000123"
              className="track-search-input"
              aria-label="Tracking number"
              spellCheck={false}
              autoCapitalize="characters"
            />
            <button type="submit" className="track-search-btn" disabled={!searchValue.trim()}>
              Track
            </button>
          </form>
        </header>

        {loading && (
          <div className="track-card track-card-loading">
            <div className="track-spinner" />
            <p>Looking up your order…</p>
          </div>
        )}

        {error && !loading && (
          <div className="track-card track-card-error" role="alert">
            <div className="track-error-icon" aria-hidden="true">⚠️</div>
            <h2>Couldn't find that order</h2>
            <p>{error}</p>
            <p className="track-error-hint">
              Tracking IDs look like <code>SA000123</code>. You can find it in your order confirmation email or account page.
            </p>
          </div>
        )}

        {order && !loading && (
          <div className="track-result">
            <div className="track-card track-summary">
              <div className="track-summary-head">
                <div>
                  <div className="track-summary-label">Tracking Number</div>
                  <div className="track-summary-id">{order.trackingId}</div>
                </div>
                <div className={`track-status-pill track-status-${order.status}`}>
                  <span className="track-status-dot" />
                  {STATUS_META[order.status]?.label || order.status}
                </div>
              </div>

              <div className="track-meta-grid">
                <div className="track-meta">
                  <div className="track-meta-label">Status</div>
                  <div className="track-meta-value">{STATUS_META[order.status]?.label || order.status}</div>
                </div>
                <div className="track-meta">
                  <div className="track-meta-label">Payment</div>
                  <div className="track-meta-value">{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</div>
                </div>
                <div className="track-meta">
                  <div className="track-meta-label">Order Total</div>
                  <div className="track-meta-value">{formatBDT(order.total)}</div>
                </div>
                <div className="track-meta">
                  <div className="track-meta-label">Items</div>
                  <div className="track-meta-value">{formatNumber(order.items.length)}</div>
                </div>
                <div className="track-meta">
                  <div className="track-meta-label">Placed</div>
                  <div className="track-meta-value">{new Date(order.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div className="track-meta">
                  <div className="track-meta-label">Last Update</div>
                  <div className="track-meta-value">{timeAgo(order.lastUpdatedAt)}</div>
                </div>
              </div>

              {order.shippingCity && (
                <div className="track-meta">
                  <div className="track-meta-label">Shipping To</div>
                  <div className="track-meta-value">{order.shippingRegion?.region || order.shippingCity}</div>
                </div>
              )}
            </div>

            <div className="track-card">
              <h3 className="track-section-title">Shipment Progress</h3>
              {order.cancelled ? (
                <div className="track-cancelled">
                  <strong>This order was cancelled.</strong>
                  <p>If you have any questions, please contact support with your tracking number.</p>
                </div>
              ) : (
                <ol className="track-timeline">
                  {order.timeline.map((step, i) => (
                    <li
                      key={step.key}
                      className={`track-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
                    >
                      <span className="track-step-marker">
                        {step.completed ? '✓' : i + 1}
                      </span>
                      <div className="track-step-body">
                        <div className="track-step-label">{step.label}</div>
                        {step.current && <div className="track-step-sub">Current status</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="track-card">
              <h3 className="track-section-title">Items in this order</h3>
              <ul className="track-items">
                {order.items.map((it, i) => (
                  <li key={i} className="track-item">
                    <div className="track-item-thumb" aria-hidden="true">📦</div>
                    <div className="track-item-info">
                      <div className="track-item-name">{it.product_name}</div>
                      <div className="track-item-meta">
                        {it.size && <span>Size: {it.size}</span>}
                        {it.size && it.color && <span> · </span>}
                        {it.color && <span>Color: {it.color}</span>}
                      </div>
                    </div>
                    <div className="track-item-qty">×{it.quantity}</div>
                    <div className="track-item-price">{formatBDT(it.price)}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="track-help">
              Need help? <Link to="/">Contact support</Link> with your tracking number.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
