import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const NAV_LINKS = [
  { label: 'New & Featured', path: '/new-and-featured' },
  { label: 'Men', path: '/men' },
  { label: 'Women', path: '/women' },
  { label: 'Kids', path: '/kids' },
  { label: 'Sale', path: '/sale' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/men?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-top-left">
          <Link to="/" className="header-logo">
            <svg viewBox="0 0 40 24" fill="#111" width="80" height="24">
              <path d="M8 2c-2 0-3.5.5-4.5 1.5S2 5.8 2 8c0 2.5.7 4.3 2 5.5s3.2 2 5.5 2c2.8 0 4.8-.8 6-2.5s1.8-3.8 1.8-6.5c0-1.8-.4-3.2-1.2-4.2S10.5 2 8 2zm0 10.5c-1.2 0-2-.3-2.5-1s-.8-1.7-.8-3.5c0-1.5.3-2.5.8-3s1.3-1 2.5-1 2 .3 2.5 1 .8 1.5.8 3c0 1.8-.3 2.8-.8 3.5s-1.3 1-2.5 1z"/>
              <text x="14" y="14" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#111">SA</text>
              <text x="29" y="14" font-family="Arial, sans-serif" font-size="9" fill="#111" font-weight="500">Lifestyle</text>
            </svg>
          </Link>
          <nav className="header-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.path} className="nav-link">{link.label}</Link>
            ))}
          </nav>
        </div>
        <div className="header-top-right">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                className="search-input"
              />
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="icon-btn" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
          )}
          <Link to={user ? '/account' : '/login'} className="icon-btn" aria-label="Account">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>
            </svg>
          </Link>
          <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </Link>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="mobile-menu">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.path} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
          <hr />
          {user ? (
            <>
              <Link to="/account" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Account</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="mobile-nav-link logout-btn">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>Join Us</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
