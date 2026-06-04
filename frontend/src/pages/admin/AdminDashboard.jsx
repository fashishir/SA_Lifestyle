import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { useCountUp } from '../../hooks/useCountUp';
import { usePolling } from '../../hooks/usePolling';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  formatBDT, formatNumber, formatCompact, formatPercent,
  formatDelta, timeAgo,
} from '../../utils/format';
import './AdminDashboard.css';

const REFRESH_MS = 30000;

const TIMEFRAMES = [
  { key: 'week', label: 'This Week', days: 7 },
  { key: 'month', label: 'This Month', days: 30 },
  { key: 'year', label: 'This Year', days: 365 },
];

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const KPI_META = [
  { key: 'totalProducts', label: 'Products', tone: 'blue', icon: '📦', format: 'number' },
  { key: 'totalOrders', label: 'Orders', tone: 'green', icon: '📋', format: 'number' },
  { key: 'totalRevenue', label: 'Revenue', tone: 'amber', icon: '৳', format: 'currency' },
  { key: 'totalUsers', label: 'Customers', tone: 'violet', icon: '👥', format: 'number' },
];

const RANK_GRADIENTS = [
  'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
];

function formatKpiValue(metric, value) {
  if (metric.format === 'currency') return formatCompact(value);
  return formatNumber(value);
}

function formatKpiFull(metric, value) {
  if (metric.format === 'currency') return formatBDT(value);
  return formatNumber(value);
}

function TooltipCard({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="dash-tooltip">
      {label && <div className="dash-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="dash-tooltip-row">
          <span className="dash-tooltip-dot" style={{ background: p.color || p.fill || '#3b82f6' }} />
          <span className="dash-tooltip-name">{p.name || 'Value'}</span>
          <span className="dash-tooltip-value">
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('week');
  const [refreshing, setRefreshing] = useState(false);

  const fetcher = useMemo(
    () => async () => {
      const res = await adminAPI.getDashboard();
      return res.data;
    },
    [],
  );

  const { data, error, loading, lastUpdated, refetch } = usePolling(fetcher, REFRESH_MS, !!user);

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const sparkData = useMemo(() => {
    if (!data?.recentOrders) return [];
    return [...data.recentOrders]
      .reverse()
      .map((o) => ({ value: Number(o.total) || 0 }));
  }, [data]);

  const kpis = useMemo(() => {
    if (!data) return [];
    return KPI_META.map((m) => {
      const current = Number(data[m.key] || 0);
      const previous = Number(data[`previous${m.key.charAt(0).toUpperCase()}${m.key.slice(1)}`] || 0);
      return { ...m, current, previous, delta: formatDelta(current, previous) };
    });
  }, [data]);

  const revenueChartData = useMemo(() => {
    if (!data?.recentOrders) return [];
    return [...data.recentOrders].reverse().map((o) => ({
      name: `#${o.id}`,
      total: Number(o.total) || 0,
    }));
  }, [data]);

  const orderStatusData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Pending', value: data.pendingOrders || 0, color: STATUS_COLORS.pending },
      { name: 'Confirmed', value: data.confirmedOrders || 0, color: STATUS_COLORS.confirmed },
      { name: 'Shipped', value: data.shippedOrders || 0, color: STATUS_COLORS.shipped },
      { name: 'Delivered', value: data.deliveredOrders || 0, color: STATUS_COLORS.delivered },
      { name: 'Cancelled', value: data.cancelledOrders || 0, color: STATUS_COLORS.cancelled },
    ].filter((d) => d.value > 0);
  }, [data]);

  const topProducts = data?.topProducts || [];
  const recentOrders = data?.recentOrders || [];
  const avgRating = Number(data?.avgRating || 0);
  const avgOrderValue = Number(data?.avgOrderValue || 0);

  return (
    <div className="admin-dashboard">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, {user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p className="dash-subtitle">Here's what's happening in your store today.</p>
        </div>
        <div className="dash-header-actions">
          <div className="dash-live" aria-live="polite">
            <span className={`dash-live-dot ${refreshing ? 'pulsing' : ''}`} />
            <span className="dash-live-text">
              {refreshing ? 'Refreshing…' : `Live • Updated ${timeAgo(lastUpdated)}`}
            </span>
          </div>
          <button
            type="button"
            className="dash-refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing}
            aria-label="Refresh dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'spin' : ''}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {error && !data && (
        <div className="dash-error-banner" role="alert">
          <div className="dash-error-text">
            <strong>Couldn't load dashboard.</strong>
            <span>{error.response?.data?.message || error.message}</span>
          </div>
          <button type="button" className="dash-error-retry" onClick={handleManualRefresh}>
            Try again
          </button>
        </div>
      )}

      {error && data && (
        <div className="dash-warn-banner" role="status">
          Showing cached data — refresh failed. {error.response?.data?.message || error.message}
          <button type="button" className="dash-warn-retry" onClick={handleManualRefresh}>Retry</button>
        </div>
      )}

      <section className="kpi-grid">
        {loading && !data
          ? KPI_META.map((m, i) => <KpiSkeleton key={m.key} delay={i * 60} />)
          : kpis.map((k, i) => <KpiCard key={k.key} metric={k} delay={i * 60} />)}
      </section>

      <section className="dash-grid">
        <article className="dash-card dash-card-wide" style={{ animationDelay: '200ms' }}>
          <div className="dash-card-head">
            <div>
              <h3 className="dash-card-title">Revenue Overview</h3>
              <p className="dash-card-subtitle">Last {TIMEFRAMES.find((t) => t.key === timeframe)?.days} orders</p>
            </div>
            <div className="timeframe-selector">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.key}
                  type="button"
                  className={`timeframe-btn ${timeframe === tf.key ? 'active' : ''}`}
                  onClick={() => setTimeframe(tf.key)}
                >
                  {tf.label.replace('This ', '')}
                </button>
              ))}
            </div>
          </div>
          <div className="dash-card-body chart-wrapper">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipCard formatter={(v) => formatBDT(v)} />} />
                  <Area type="monotone" dataKey="total" name="Revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No revenue yet"
                body="New orders will show up here as they come in."
              />
            )}
          </div>
        </article>

        <article className="dash-card" style={{ animationDelay: '260ms' }}>
          <div className="dash-card-head">
            <h3 className="dash-card-title">Order Status</h3>
          </div>
          <div className="dash-card-body chart-wrapper">
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipCard />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No orders yet" body="Status breakdown appears once orders arrive." />
            )}
            {orderStatusData.length > 0 && (
              <ul className="dash-legend">
                {orderStatusData.map((s) => (
                  <li key={s.name}>
                    <span className="dash-legend-dot" style={{ background: s.color }} />
                    <span className="dash-legend-name">{s.name}</span>
                    <span className="dash-legend-value">{s.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      <section className="dash-grid">
        <article className="dash-card dash-card-wide" style={{ animationDelay: '320ms' }}>
          <div className="dash-card-head">
            <div>
              <h3 className="dash-card-title">Recent Orders</h3>
              <p className="dash-card-subtitle">Latest 10 orders</p>
            </div>
            <button type="button" className="dash-link-btn" onClick={() => navigate('/admin/orders')}>
              View all →
            </button>
          </div>
          <div className="dash-card-body table-scroll">
            {loading && !data ? (
              <TableSkeleton rows={5} cols={5} />
            ) : recentOrders.length > 0 ? (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Tracking</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="dash-table-row">
                      <td><span className="dash-tracking">{`SA${String(o.id).padStart(6, '0')}`}</span></td>
                      <td>
                        <div className="dash-customer">
                          <div className="dash-avatar">{o.user_name?.[0]?.toUpperCase() || '?'}</div>
                          <div className="dash-customer-name">{o.user_name}</div>
                        </div>
                      </td>
                      <td><strong>{formatBDT(o.total)}</strong></td>
                      <td>
                        <span className={`dash-pill dash-pill-${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="dash-muted">{formatDateTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No orders yet" body="They'll appear here as soon as customers check out." />
            )}
          </div>
        </article>
      </section>

      <section className="dash-grid">
        <article className="dash-card" style={{ animationDelay: '380ms' }}>
          <div className="dash-card-head">
            <h3 className="dash-card-title">Top Products</h3>
          </div>
          <div className="dash-card-body">
            {loading && !data ? (
              <ListSkeleton rows={5} />
            ) : topProducts.length > 0 ? (
              <ul className="dash-product-list">
                {topProducts.map((p, i) => (
                  <li key={p.product_name} className="dash-product-item">
                    <div
                      className="dash-rank"
                      style={{ background: i < 3 ? RANK_GRADIENTS[i] : 'linear-gradient(135deg, #e5e7eb 0%, #cbd5e1 100%)' }}
                    >
                      {i + 1}
                    </div>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.product_name} className="dash-product-thumb" />
                    ) : (
                      <div className="dash-product-thumb dash-product-thumb-placeholder">📦</div>
                    )}
                    <div className="dash-product-info">
                      <div className="dash-product-name">{p.product_name}</div>
                      <div className="dash-product-meta">{p.sold} units sold</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No sales data" body="Top sellers will appear once you have orders." />
            )}
          </div>
        </article>

        <article className="dash-card" style={{ animationDelay: '440ms' }}>
          <div className="dash-card-head">
            <h3 className="dash-card-title">Quick Stats</h3>
          </div>
          <div className="dash-card-body">
            {loading && !data ? (
              <ListSkeleton rows={4} />
            ) : (
              <ul className="dash-quick-stats">
                <QuickStat label="Avg Order Value" value={formatBDT(avgOrderValue)} />
                <QuickStat label="Pending Orders" value={formatNumber(data?.pendingOrders || 0)} />
                <QuickStat label="Delivered Orders" value={formatNumber(data?.deliveredOrders || 0)} />
                <QuickStat label="Avg Rating" value={`${avgRating.toFixed(1)} ⭐`} />
              </ul>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function KpiCard({ metric, delay }) {
  const animated = useCountUp(metric.current, { duration: 900 });
  const delta = metric.delta;
  const arrow = delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '·';
  const deltaTone = delta.direction === 'up' ? 'up' : delta.direction === 'down' ? 'down' : 'flat';

  return (
    <div className={`kpi-card kpi-${metric.tone}`} style={{ animationDelay: `${delay}ms` }} title={formatKpiFull(metric, metric.current)}>
      <div className="kpi-stripe" />
      <div className="kpi-row">
        <div className="kpi-label">{metric.label}</div>
        <div className="kpi-icon" aria-hidden="true">{metric.icon}</div>
      </div>
      <div className="kpi-value">{formatKpiValue(metric, animated)}</div>
      <div className={`kpi-delta kpi-delta-${deltaTone}`}>
        <span className="kpi-delta-arrow">{arrow}</span>
        <span>{formatPercent(delta.value)}</span>
        <span className="kpi-delta-sub">vs prev</span>
      </div>
      <Sparkline data={[]} />
    </div>
  );
}

function KpiSkeleton({ delay }) {
  return <div className="kpi-card kpi-skeleton" style={{ animationDelay: `${delay}ms` }} />;
}

function TableSkeleton({ rows, cols }) {
  return (
    <div className="dash-skel-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="dash-skel-row">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="dash-skel-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ rows }) {
  return (
    <div className="dash-skel-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="dash-skel-list-row" />
      ))}
    </div>
  );
}

function Sparkline({ data }) {
  if (!data || data.length < 2) {
    return <div className="kpi-spark kpi-spark-empty" />;
  }
  return (
    <div className="kpi-spark">
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="currentColor" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuickStat({ label, value }) {
  return (
    <li className="dash-quick-stat">
      <span className="dash-quick-label">{label}</span>
      <span className="dash-quick-value">{value}</span>
    </li>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-icon">✨</div>
      <div className="dash-empty-title">{title}</div>
      <div className="dash-empty-body">{body}</div>
    </div>
  );
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
