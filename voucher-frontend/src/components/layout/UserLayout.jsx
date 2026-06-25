import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import Footer from '../common/Footer';

/* ─── Nav item definition ─── */
const NAV_ITEMS = [
  {
    label: 'Overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    path: '/dashboard',
  },
  {
    label: 'My Redemptions',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 15h.01M12 15h.01" />
      </svg>
    ),
    path: '/my-redemptions',
  },
  {
    label: 'Voucher List',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    path: '/vouchers',
  },
  {
    label: 'Referral',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
    ),
    path: '/referral',
  },
];

const ADMIN_VIEW_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/* ════════════════════════════════════════════════════════ */
const UserLayout = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/landingpage');
  };

  /* ─── Helper: is this nav item active? ─── */
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  /* ─── Reusable nav item renderer ─── */
  const NavItem = ({ item, onClick }) => {
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
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: active ? 700 : 500,
          textAlign: 'left',
          transition: 'background-color 0.15s ease, color 0.15s ease',
          backgroundColor: active
            ? '#D4A017'
            : hovered
            ? 'rgba(0,0,0,0.05)'
            : 'transparent',
          color: active ? '#ffffff' : hovered ? '#1a1c1c' : '#43474e',
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
          width: 210,
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
        {/* User Profile Section */}
        <div
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
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>

          {/* User Info + Dropdown Toggle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#1a1c1c',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name || 'User'}
            </p>
          </div>

          {/* Dropdown Toggle Button */}
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
              transition: 'background-color 0.15s ease',
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                backgroundColor: '#ffffff',
                border: '1px solid #e8e8e7',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                zIndex: 1000,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => {
                  navigate('/profile');
                  setUserMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#1a1c1c',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background-color 0.15s ease',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Profile
              </button>
              <button
                onClick={() => {
                  navigate('/points-history');
                  setUserMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#1a1c1c',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                My Points
              </button>
            </div>
          )}
        </div>

        {/* Main nav */}
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

        {/* ═══════ ADMIN ONLY: Role Switcher Section ═══════ */}
        {user?.role?.toLowerCase() === 'admin' && (
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
              onClick={() => navigate('/admin/dashboard')}
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
                border: '1.5px dashed #c4c6cf',
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
                {ADMIN_VIEW_ICON}
              </span>
              Admin Dashboard
            </button>
          </div>
        )}

        {/* Bottom nav: Logout */}
        <div
          style={{
            padding: '10px 10px 16px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Logout */}
          <NavItem
            item={{
              label: 'Logout',
              path: '__logout__',
              icon: (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              ),
            }}
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* ═══════ RIGHT: Header + Content ═══════ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* ─── Page Content ─── */}
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
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default UserLayout;