import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBDT } from '../../utils/format';
import './AdminDashboard.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    adminAPI.getDashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <div className="spinner" />;
  if (!data) return <div className="admin-error">Failed to load dashboard data</div>;

  const chartData = (data.recentOrders || []).map((o) => ({
    name: `#${o.id}`,
    total: parseFloat(o.total),
  })).reverse();

  const stats = [
    { label: 'Total Products', value: data.totalProducts, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Orders', value: data.totalOrders, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Total Revenue', value: formatBDT(data.totalRevenue), color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total Users', value: data.totalUsers, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p className="admin-page-subtitle">Welcome back, {user?.name}</p>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stats-card" style={{ background: s.bg }}>
            <div className="stats-card-icon" style={{ color: s.color }}>{s.label === 'Total Products' ? '📦' : s.label === 'Total Orders' ? '📋' : s.label === 'Total Revenue' ? '💰' : '👥'}</div>
            <div className="stats-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stats-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="card-title">Recent Orders</h3>
          <div className="card-body">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.user_name}</td>
                    <td>{formatBDT(o.total)}</td>
                    <td><span className={`order-status status-${o.status}`}>{o.status}</span></td>
                    <td>{formatDate(o.created_at)}</td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Revenue (Recent Orders)</h3>
          <div className="card-body chart-wrapper">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [formatBDT(v), 'Total']} />
                  <Bar dataKey="total" fill="#111" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No revenue data yet</div>
            )}
          </div>
        </div>

        <div className="dashboard-card dashboard-card-full">
          <h3 className="card-title">Top Selling Products</h3>
          <div className="card-body">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div className="top-product">
                        {p.image_url && <img src={p.image_url} alt="" className="top-product-img" />}
                        <span>{p.product_name}</span>
                      </div>
                    </td>
                    <td><strong>{p.sold}</strong></td>
                  </tr>
                ))}
                {data.topProducts.length === 0 && (
                  <tr><td colSpan={2} className="empty-state">No sales data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
