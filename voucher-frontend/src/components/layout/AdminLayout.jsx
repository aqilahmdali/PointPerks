import React, { useRef, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import Footer from '../common/Footer';

/* ─── Admin nav items ─── */
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Inventory',
    path: '/admin/vouchers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <path d="M12 12v4M10 14h4" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    path: '/admin/analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

const LOGOUT_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const USER_VIEW_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MORE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

/* ════════════════════════════════════════════════════════ */
const AdminLayout = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutUser());
    navigate('/landingpage');
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  /* ─── Active path check ─── */
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  /* ─── Reusable nav item ─── */
  const NavItem = ({ item, onClick, customStyle }) => {
    const active = isActive(item.path);
    const [hovered, setHovered] = useState(false);

    return (
      <button
        onClick={onClick || (() => navigate(item.path))}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '10px 14px',
          borderRadius: 10,
          border: customStyle?.border || 'none',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: active ? 700 : 500,
          textAlign: 'left',
          transition: 'all 0.15s ease',
          backgroundColor: customStyle?.backgroundColor || (active ? '#D4A017' : hovered ? 'rgba(0,0,0,0.05)' : 'transparent'),
          color: customStyle?.color || (active ? '#ffffff' : hovered ? '#1a1c1c' : '#43474e'),
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            opacity: active ? 1 : hovered ? 0.85 : 0.7,
            flexShrink: 0,
          }}
        >
          {item.icon}
        </span>
        {item.label}
      </button>
    );
  };

  /* ════════════════ RENDER ════════════════ */
  return (
    <div
      className="pp-app-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f4f4f3',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ═══════ LEFT SIDEBAR ═══════ */}
      <aside
        className="pp-app-sidebar"
        style={{
          width: 240, // Slightly increased width to fit new elements better
          flexShrink: 0,
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e8e8e7',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 20,
        }}
      >
        {/* ── Brand block ── */}
        <div
          style={{
            padding: '22px 20px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#022448',
              fontFamily: 'Poppins, sans-serif',
              marginBottom: 2,
            }}
          >
            PointPerks
          </p>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#74777f',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Management Console
          </p>
        </div>

        {/* ── User profile section with functional Dropdown ── */}
        <div
          ref={dropdownRef}
          style={{
            padding: '16px 12px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#022448',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'A'
            )}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1a1c1c',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {user?.name || 'Admin User'}
            </p>
            <p
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: '#74777f',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Super Admin
            </p>
          </div>

          {/* Dropdown toggle (Fixed empty button) */}
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              backgroundColor: userMenuOpen ? '#f0f0f0' : 'transparent',
              cursor: 'pointer',
              color: '#74777f',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (!userMenuOpen) e.currentTarget.style.backgroundColor = '#f9f9f9';
            }}
            onMouseLeave={(e) => {
              if (!userMenuOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {MORE_ICON}
          </button>

          {/* ── Dropdown Menu ── */}
          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #e8e8e7',
                borderRadius: 10,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                zIndex: 50,
                overflow: 'hidden',
                minWidth: '180px',
              }}
            >
              {/* Option 1: Switch to User View */}
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setUserMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#1a1c1c',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {USER_VIEW_ICON}
                Switch to User View
              </button>
              
              <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '4px 0' }} />

              {/* Option 2: Logout */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#ba1a1a', // Error red for logout
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {LOGOUT_ICON}
                Logout
              </button>
            </div>
          )}
        </div>

        {/* ── Main nav ── */}
        <nav
          className="pp-app-nav"
          style={{
            flex: 1,
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* ── Role Switcher Section (Distinct UI) ── */}
        <div
          style={{
            padding: '0px 10px 8px',
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#74777f',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              padding: '0 14px',
              marginBottom: 6,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Switch View
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(2, 36, 72, 0.04)';
              e.currentTarget.style.borderColor = '#022448';
              e.currentTarget.style.color = '#022448';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#c4c6cf';
              e.currentTarget.style.color = '#43474e';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px dashed #c4c6cf', // Distinct dashed border
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'left',
              backgroundColor: 'transparent',
              color: '#43474e',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ opacity: 0.8, display: 'flex' }}>
              {USER_VIEW_ICON}
            </span>
            User Dashboard
          </button>
        </div>

        {/* ── Bottom: Logout ── */}
        <div
          style={{
            padding: '10px 10px 16px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <NavItem
            item={{ label: 'Logout', path: '__logout__', icon: LOGOUT_ICON }}
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* ═══════ RIGHT: Content + Footer ═══════ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <main style={{ flex: 1, padding: '28px 28px 48px' }}>
            <div className="pp-page-content">
              <Outlet />
            </div>
          </main>

          {/* ─── Footer ─── */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;