import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/alerts',
    label: 'Alert History',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    to: '/rules',
    label: 'Alert Rules',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 12h10M4 18h16" />
        <circle cx="17" cy="12" r="2" />
      </svg>
    ),
  },
];

const ADMIN_NAV_ITEMS = [
  {
    to: '/users',
    label: 'Media Buyers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const PROFILE_NAV_ITEM = {
  to: '/profile',
  label: 'My Profile',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  ),
};

export default function Sidebar() {
  const { name, username, role, isAdmin, logout } = useAuth();
  const navItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS, PROFILE_NAV_ITEM] : [...NAV_ITEMS, PROFILE_NAV_ITEM];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">CM</div>
        <div>
          <h1>Campaign Monitoring</h1>
          <p className="subtitle">Google Ads CPS alerts</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{(name || username || '?').slice(0, 1).toUpperCase()}</div>
          <div className="sidebar-user-text">
            <span>{name || username}</span>
            <span className="sidebar-role">{role === 'admin' ? 'Admin' : 'Media Buyer'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
