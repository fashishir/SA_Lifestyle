import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { formatBDT } from '../../utils/format';
import './AdminDashboard.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await adminAPI.getOrders(params);
      setOrders(res.data);
    } catch {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (id, status) => {
    await adminAPI.updateOrderStatus(id, status);
    fetchOrders();
  };

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setItemsLoading(true);
    try {
      const res = await adminAPI.getOrderItems(order.id);
      setOrderItems(res.data);
    } catch {}
    setItemsLoading(false);
  };

  const statusCounts = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <h1>Orders</h1>
        <div className="filter-group">
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
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>
                    <div className="td-name">{o.user_name}</div>
                    <div className="td-sub">{o.email}</div>
                  </td>
                  <td>{formatBDT(o.total)}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="status-select"
                    >
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openOrderDetail(o)}>View</button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="empty-state">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2>Order #{selectedOrder.id}</h2>
            <div className="order-detail-meta">
              <div><strong>Customer:</strong> {selectedOrder.user_name} ({selectedOrder.email})</div>
              <div><strong>Status:</strong> <span className={`order-status status-${selectedOrder.status}`}>{selectedOrder.status}</span></div>
              <div><strong>Total:</strong> {formatBDT(selectedOrder.total)}</div>
              <div><strong>Date:</strong> {formatDate(selectedOrder.created_at)}</div>
              <div><strong>Shipping Address:</strong><pre className="address-pre">{JSON.stringify(selectedOrder.shipping_address, null, 2)}</pre></div>
            </div>
            <h3 style={{ marginTop: 20, marginBottom: 12 }}>Items</h3>
            {itemsLoading ? <div className="spinner" /> : (
              <table className="admin-table">
                <thead>
                  <tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.size || '—'}</td>
                      <td>{item.color || '—'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatBDT(item.price)}</td>
                      <td>{formatBDT(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
