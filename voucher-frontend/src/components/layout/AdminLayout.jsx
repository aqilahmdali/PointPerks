// AdminLayout.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import Footer from '../common/Footer';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

/* ═══════ STYLES ═══════ */
const STYLES = {
  appShell: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f4f3', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: 240, flexShrink: 0, backgroundColor: '#ffffff', borderRight: '1px solid #e8e8e7', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', zIndex: 20 },
  brandBlock: { padding: '22px 20px 16px', borderBottom: '1px solid #f0f0f0' },
  brandName: { fontSize: 16, fontWeight: 700, color: '#022448', fontFamily: 'Poppins, sans-serif', margin: 0 },
  brandSubtitle: { fontSize: 11, fontWeight: 600, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif', margin: '4px 0 0 0' },
  profileWrapper: { padding: '14px 12px', borderBottom: '1px solid #f0f0f0' },
  profilePill: { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f4f4f3', borderRadius: 999, padding: '8px 14px 8px 8px' },
  avatar: { width: 38, height: 38, borderRadius: '50%', backgroundColor: '#022448', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif', flexShrink: 0, overflow: 'hidden' },
  profileName: { fontSize: 13, fontWeight: 600, color: '#1a1c1c', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' },
  profileRole: { fontSize: 10, fontWeight: 500, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif' },
  navContainer: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  roleSwitcherSection: { padding: '0px 10px 8px' },
  roleSwitcherLabel: { fontSize: 10, fontWeight: 600, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '0 14px', fontFamily: 'Inter, sans-serif', margin: '0 0 6px 0' },
  roleSwitcherBtn: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px dashed #c4c6cf', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, textAlign: 'left', backgroundColor: 'transparent', color: '#43474e', transition: 'all 0.15s ease' },
  bottomSection: { padding: '10px 10px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 2 },
};

const MOBILE_STYLES = {
  header: { position: 'fixed', top: 0, left: 0, right: 0, height: 60, backgroundColor: '#ffffff', borderBottom: '1px solid #e8e8e7', zIndex: 40, display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' },
  mobilePill: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#f4f4f3', borderRadius: 999, padding: '6px 12px 6px 6px', cursor: 'pointer', transition: 'background-color 0.15s ease', border: 'none' },
  mobileAvatar: { ...STYLES.avatar, width: 32, height: 32, fontSize: 12 },
  mobileName: { fontSize: 12, fontWeight: 600, color: '#1a1c1c', margin: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dropdown: { position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200, backgroundColor: '#ffffff', border: '1px solid #e8e8e7', borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#1a1c1c', textAlign: 'left', transition: 'background-color 0.15s' },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: 65, backgroundColor: '#ffffff', borderTop: '1px solid #e8e8e7', zIndex: 40, display: 'none', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' },
  bottomNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flex: 1, height: '100%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500, color: '#43474e', transition: 'color 0.15s ease', padding: 0 },
};

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

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NavItem = ({ item, onClick, isLogout }) => {
    const active = isActive(item.path);
    const [hovered, setHovered] = useState(false);
    return (
      <button
        onClick={onClick || (() => navigate(item.path))}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px',
          borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          fontSize: 14, fontWeight: 700, textAlign: 'left', transition: 'all 0.15s ease',
          backgroundColor: isLogout ? (hovered ? 'rgba(186, 26, 26, 0.08)' : 'transparent') : active ? '#D4A017' : hovered ? 'rgba(0,0,0,0.05)' : 'transparent',
          color: isLogout ? '#ba1a1a' : active ? '#ffffff' : hovered ? '#1a1c1c' : '#43474e',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', opacity: isLogout ? (hovered ? 1 : 0.7) : active ? 1 : hovered ? 0.85 : 0.7, flexShrink: 0 }}>{item.icon}</span>
        {item.label}
      </button>
    );
  };

  return (
    <div className="pp-app-shell" style={STYLES.appShell}>
      <style>{`
        @media (max-width: 768px) {
          .pp-app-sidebar { display: none !important; }
          .pp-mobile-header { display: flex !important; }
          .pp-mobile-nav { display: flex !important; }
          .pp-mobile-spacer-top { display: block !important; }
          .pp-mobile-spacer-bottom { display: block !important; }
          .pp-main-content { padding: 16px !important; padding-bottom: 20px !important; }
          .pp-footer { display: none !important; }
        }
        @media (min-width: 769px) {
          .pp-mobile-header, .pp-mobile-nav, .pp-mobile-spacer-top, .pp-mobile-spacer-bottom { display: none !important; }
        }
      `}</style>

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="pp-app-sidebar" style={STYLES.sidebar}>
        <div style={STYLES.brandBlock}>
          <p style={STYLES.brandName}>PointPerks</p>
          <p style={STYLES.brandSubtitle}>Management Console</p>
        </div>
        <div style={STYLES.profileWrapper}>
          <div style={STYLES.profilePill}>
            <div style={STYLES.avatar}>
              {user?.avatar ? <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={STYLES.profileName}>{user?.name || 'Admin User'}</p>
              <p style={STYLES.profileRole}>Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="pp-app-nav" style={STYLES.navContainer}>
          {NAV_ITEMS.map((item) => <NavItem key={item.path} item={item} />)}
        </nav>
        <div style={STYLES.roleSwitcherSection}>
          <p style={STYLES.roleSwitcherLabel}>Switch View</p>
          <button
            onClick={() => navigate('/dashboard')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(2, 36, 72, 0.04)'; e.currentTarget.style.borderColor = '#022448'; e.currentTarget.style.color = '#022448'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#c4c6cf'; e.currentTarget.style.color = '#43474e'; }}
            style={STYLES.roleSwitcherBtn}
          >
            <span style={{ opacity: 0.8, display: 'flex' }}>{USER_VIEW_ICON}</span>
            User Dashboard
          </button>
        </div>
        <div style={STYLES.bottomSection}>
          <NavItem item={{ label: 'Logout', path: '__logout__', icon: LOGOUT_ICON }} onClick={handleLogout} isLogout />
        </div>
      </aside>

      {/* ═══ MOBILE TOP HEADER ═══ */}
      <header className="pp-mobile-header" style={MOBILE_STYLES.header}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#022448', fontFamily: 'Poppins, sans-serif', margin: 0 }}>PointPerks</p>
        
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ebebea'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f4f4f3'}
            style={MOBILE_STYLES.mobilePill}
          >
            <div style={MOBILE_STYLES.mobileAvatar}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <p style={MOBILE_STYLES.mobileName}>{user?.name || 'Admin'}</p>
          </button>

          {userMenuOpen && (
            <div style={MOBILE_STYLES.dropdown}>
              <button
                onClick={() => { navigate('/dashboard'); setUserMenuOpen(false); }}
                style={MOBILE_STYLES.dropdownItem}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {USER_VIEW_ICON} Switch to User View
              </button>
              <div style={{ height: 1, backgroundColor: '#f0f0f0', margin: '4px 0' }} />
              <button
                onClick={handleLogout}
                style={{ ...MOBILE_STYLES.dropdownItem, color: '#ba1a1a' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {LOGOUT_ICON} Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="pp-mobile-spacer-top" style={{ height: 60 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <main className="pp-main-content" style={{ flex: 1, padding: '28px 28px 48px' }}>
            <div className="pp-page-content"><Outlet /></div>
          </main>
          <div className="pp-footer"><Footer /></div>
        </div>
        <div className="pp-mobile-spacer-bottom" style={{ height: 65 }} />
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <nav className="pp-mobile-nav" style={MOBILE_STYLES.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...MOBILE_STYLES.bottomNavItem,
                color: active ? '#D4A017' : '#43474e',
                fontWeight: active ? 700 : 500,
              }}
            >
              <span style={{ display: 'flex', opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;