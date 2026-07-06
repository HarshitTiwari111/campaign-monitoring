import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bell, SlidersHorizontal, Users, User, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ConfirmModal from './ConfirmModal';
import Logo from './Logo';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { to: '/alerts', label: 'Alert History', icon: <Bell size={18} /> },
  { to: '/rules', label: 'Alert Rules', icon: <SlidersHorizontal size={18} /> },
];

const ADMIN_NAV_ITEMS = [{ to: '/users', label: 'Media Buyers', icon: <Users size={18} /> }];

const PROFILE_NAV_ITEM = { to: '/profile', label: 'My Profile', icon: <User size={18} /> };

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}

export default function Sidebar() {
  const { name, username, role, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS, PROFILE_NAV_ITEM] : [...NAV_ITEMS, PROFILE_NAV_ITEM];

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <aside className={`sidebar ${menuOpen ? 'menu-open' : ''}`}>
        <div className="sidebar-top-row">
          <div className="sidebar-brand">
            <div className="brand-mark">
              <Logo size={18} />
            </div>
            <h1>Campaign Monitoring</h1>
          </div>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
          <div className="sidebar-user">
            <div className="sidebar-avatar">{(name || username || '?').slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-user-text">
              <span>{name || username}</span>
              <span className="sidebar-role">{role === 'admin' ? 'Admin' : 'Media Buyer'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={() => setShowLogoutConfirm(true)}>
            Log out
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <ConfirmModal
          title="Log out?"
          message="Are you sure you want to log out of Campaign Monitoring?"
          confirmLabel="Log out"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
