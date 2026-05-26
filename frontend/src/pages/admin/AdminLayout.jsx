import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { path: '/admin/products', label: 'Products', icon: '📦' },
  { path: '/admin/categories', label: 'Categories', icon: '📁' },
  { path: '/admin/orders', label: 'Orders', icon: '📋' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <span className="sidebar-logo">SA</span>
          <div>
            <div className="sidebar-brand-name">SA_Lifestyle</div>
            <div className="sidebar-brand-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user?.name?.[0] || 'A'}</div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
