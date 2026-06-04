import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatBDT } from '../../utils/format';
import './AdminDashboard.css';
import './AdminOrders.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function generateTrackingId(orderId) {
  return `SA${String(orderId).padStart(6, '0')}`;
}

function getTrackingId(order) {
  return order?.tracking_id || generateTrackingId(order?.id);
}

const PAYMENT_LABEL = {
  cod: 'Cash on Delivery',
  sslcommerz: 'Online (SSLCommerz)',
};

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusSteps = { 'pending': 0, 'confirmed': 1, 'shipped': 2, 'delivered': 3, 'cancelled': 4 };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminAPI.getOrders(params);
      setOrders(res.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(id, newStatus);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setItemsLoading(true);
    try {
      const res = await adminAPI.getOrderItems(order.id);
      setOrderItems(res.data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
    setItemsLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const filteredOrders = orders.filter(order => {
    const trackingId = getTrackingId(order);
    const searchLower = searchQuery.toLowerCase();
    return (
      trackingId.toLowerCase().includes(searchLower) ||
      (order.user_name && order.user_name.toLowerCase().includes(searchLower)) ||
      (order.email && order.email.toLowerCase().includes(searchLower))
    );
  });

  const statusCounts = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <div>
          <h1>Orders Management</h1>
          <p className="admin-page-subtitle">Track and manage customer orders with real-time updates</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="orders-search-bar">
        <input
          type="text"
          placeholder="Search by tracking #, customer name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-modern"
        />
      </div>

      {/* Filter Buttons */}
      <div className="filter-group" style={{ marginBottom: '24px' }}>
        {['', ...statuses].map((s) => (
          <button
            key={s}
            className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'} {s ? `(${statusCounts[s] || 0})` : `(${orders.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="table-wrapper">
          <table className="admin-table-modern">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const trackingId = getTrackingId(o);
                return (
                  <tr key={o.id} className={`order-table-row status-${o.status}`}>
                    <td className="tracking-col">
                      <div className="tracking-badge-modern">{trackingId}</div>
                      {o.payment_method && (
                        <div className={`payment-pill payment-pill-${o.payment_method}`}>
                          {o.payment_method === 'cod' ? 'COD' : 'Online'}
                        </div>
                      )}
                    </td>
                    <td className="name-col">
                      <div className="td-name">{o.user_name}</div>
                    </td>
                    <td className="email-col">{o.email}</td>
                    <td className="amount-col"><strong>{formatBDT(o.total)}</strong></td>
                    <td className="status-col">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`status-select status-select-${o.status}`}
                      >
                        {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="date-col">{formatDate(o.created_at)}</td>
                    <td className="actions-col">
                      <button
                        className="btn btn-sm btn-primary-outline"
                        onClick={() => openOrderDetail(o)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={7} className="empty-state">
                  {searchQuery ? 'No orders match your search' : 'No orders found'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              {/* Tracking & Status Section */}
              <div className="order-detail-section">
                <div className="order-detail-title">Tracking Information</div>
                <div className="order-detail-grid">
                  <div className="order-detail-item">
                    <div className="order-detail-label">Tracking Number</div>
                    <div className="order-detail-value">{getTrackingId(selectedOrder)}</div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Current Status</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`order-status-badge status-${selectedOrder.status}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Payment Method</div>
                    <div className="order-detail-value">
                      {PAYMENT_LABEL[selectedOrder.payment_method] || selectedOrder.payment_method || '—'}
                    </div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Payment Status</div>
                    <div className="order-detail-value" style={{ textTransform: 'capitalize' }}>
                      {selectedOrder.payment_status || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Section */}
              <div className="order-detail-section">
                <div className="order-detail-title">Customer Information</div>
                <div className="order-detail-grid">
                  <div className="order-detail-item">
                    <div className="order-detail-label">Name</div>
                    <div className="order-detail-value">{selectedOrder.user_name}</div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Email</div>
                    <div className="order-detail-value">{selectedOrder.email}</div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="order-detail-section">
                <div className="order-detail-title">Order Summary</div>
                <div className="order-detail-grid">
                  <div className="order-detail-item">
                    <div className="order-detail-label">Order Total</div>
                    <div className="order-detail-value" style={{ color: '#10b981' }}>
                      {formatBDT(selectedOrder.total)}
                    </div>
                  </div>
                  <div className="order-detail-item">
                    <div className="order-detail-label">Order Date</div>
                    <div className="order-detail-value">{formatDate(selectedOrder.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div className="order-detail-section">
                <div className="order-detail-title">Update Status</div>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className={`status-select status-select-${selectedOrder.status}`}
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items */}
              <div className="order-detail-section">
                <div className="order-detail-title">Items</div>
                {itemsLoading ? (
                  <div className="loading-spinner">
                    <div className="spinner-circle"></div>
                  </div>
                ) : orderItems.length > 0 ? (
                  <div className="order-items-list">
                    {orderItems.map((item) => (
                      <div key={item.id} className="order-item">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.product_name} className="order-item-img" />
                        )}
                        <div className="order-item-info">
                          <div className="order-item-name">{item.product_name}</div>
                          <div className="order-item-details">
                            {item.size && <span>{item.size}</span>}
                            {item.size && item.color && <span> • </span>}
                            {item.color && <span>{item.color}</span>}
                          </div>
                        </div>
                        <div className="order-item-qty">
                          <div className="order-item-qty-label">Qty</div>
                          <div className="order-item-qty-value">{item.quantity}</div>
                        </div>
                        <div className="order-item-price">
                          <div className="order-item-price-label">Price</div>
                          <div className="order-item-price-value">{formatBDT(item.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No items in this order</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
