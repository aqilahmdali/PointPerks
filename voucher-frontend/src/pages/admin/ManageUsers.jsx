import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';

const formatPoints = (pts) => {
  if (!pts) return '0';
  if (pts >= 1000000) return (pts / 1000000).toFixed(1) + 'M';
  if (pts >= 1000) return pts.toLocaleString();
  return pts.toString();
};

const ROLE_CONFIG = {
  admin:  { label: 'Admin',  bg: '#e8eeff', color: '#1a3a6b', border: '#c5d3f5' },
  user:   { label: 'Member', bg: '#f2f2f2', color: '#43474e', border: '#dddde0' },
  member: { label: 'Member', bg: '#f2f2f2', color: '#43474e', border: '#dddde0' },
};

const STATUS_CONFIG = {
  active:    { label: 'Active',    dot: '#22c55e', color: '#15803d' },
  inactive:  { label: 'Inactive',  dot: '#ef4444', color: '#dc2626' },
};

const getUserStatus = (user) => (user.isActive ? 'active' : 'inactive');

/* ═══════ ANIMATED SUB-COMPONENTS ═══════ */
const AnimatedValue = ({ value, duration = 1400, animate = false }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!animate || value == null) { setDisplay(value || 0); return; }
    const numVal = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
    if (isNaN(numVal)) { setDisplay(value); return; }
    let startTs = null;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(ease * numVal));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(numVal);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, animate, duration]);
  return <>{display.toLocaleString()}</>;
};

const Skeleton = ({ style }) => (
  <div style={{ ...style, background: 'linear-gradient(90deg,#e8e8e7 25%,#f4f4f3 50%,#e8e8e7 75%)', backgroundSize: '200% 100%', animation: 'skPulse 1.5s ease-in-out infinite', borderRadius: style?.borderRadius ?? 16 }} />
);

/* Small reusable select dropdown */
const FilterSelect = ({ value, onChange, options }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        appearance: 'none', WebkitAppearance: 'none',
        backgroundColor: '#ffffff', border: '1px solid #dddde0', borderRadius: 8,
        padding: '7px 32px 7px 12px', fontSize: 13, fontWeight: 500, color: '#1a1c1c',
        cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.4,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#022448'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(2,36,72,0.15)'; }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = '#dddde0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#74777f', fontSize: 14, lineHeight: 1 }}>▾</span>
  </div>
);

/* ════════════════════════════════════════════════════════ */
const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [animated, setAnimated]         = useState(false);
  const [search, setSearch]             = useState('');
  const [pointsDialog, setPointsDialog] = useState(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsDesc, setPointsDesc]     = useState('');
  const [roleFilter, setRoleFilter]     = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [currentPage, setCurrentPage]   = useState(1);


  /* ── Action menu: stores the full user object + position ── */
  const [actionMenuUser, setActionMenuUser] = useState(null);
  const [menuPos, setMenuPos]               = useState(null);
  const menuIdRef = useRef('action-menu-portal');
  const rowsPerPage = 10;

  const fetchData = () => {
    setLoading(true);
    setAnimated(false);
    userAPI
      .getAll({ search: search || undefined, limit: 100 })
      .then((res) => setUsers(res.data.data || []))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setAnimated(true), 150);
      });
  };

  useEffect(() => {
    const handle = setTimeout(fetchData, 300);
    return () => clearTimeout(handle);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Open the portaled action menu ── */
  const openActionMenu = useCallback((e, user) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth  = 196;
    const menuHeight = 176;
    let top  = rect.bottom + 4;
    let left = rect.right - menuWidth;
    if (top + menuHeight > window.innerHeight - 12) top = rect.top - menuHeight - 4;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    setMenuPos({ top, left });
    setActionMenuUser(user);
  }, []);

  const closeActionMenu = useCallback(() => {
    setActionMenuUser(null);
    setMenuPos(null);
  }, []);

  /* ── Close menu on outside click ── */
  useEffect(() => {
    if (!actionMenuUser) return;
    const handler = (e) => {
      const el = document.getElementById(menuIdRef.current);
      if (el && !el.contains(e.target)) closeActionMenu();
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [actionMenuUser, closeActionMenu]);

  /* ── Close menu on scroll or resize ── */
  useEffect(() => {
    if (!actionMenuUser) return;
    const close = closeActionMenu;
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [actionMenuUser, closeActionMenu]);

  const handleToggleStatus = async (user) => {
    try {
      await userAPI.toggleStatus(user._id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleRoleToggle = async (user) => {
    const roles = ['user', 'admin'];
    const idx   = roles.indexOf(user.role?.toLowerCase());
    const newRole = roles[(idx + 1) % roles.length];
    try {
      await userAPI.updateRole(user._id, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchData();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handlePointsAdjust = async () => {
    try {
      await userAPI.adjustPoints(pointsDialog._id, { points: pointsAmount, description: pointsDesc });
      toast.success('Points adjusted successfully');
      setPointsDialog(null); setPointsAmount(0); setPointsDesc('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    }
  };

  /* ── Filtering & Pagination ── */
  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'All Roles') {
      const f = roleFilter.toLowerCase();
      const r = user.role?.toLowerCase();
      if (f === 'member' && r !== 'user' && r !== 'member') return false;
      if (f === 'admin'  && r !== 'admin')  return false;
    }
    const st = getUserStatus(user);
    if (statusFilter === 'Active'    && st !== 'active')    return false;
    if (statusFilter === 'Inactive'  && st !== 'inactive')  return false;
    return true;
  });

  const totalPages    = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  /* ── Stats ── */
  const stats = {
    total:      users.length,
    active:     users.filter((u) => u.isActive).length,
    points:     users.reduce((s, u) => s + (u.points || 0), 0),
    newSignups: users.filter((u) => {
      const ago = new Date(); ago.setDate(ago.getDate() - 7);
      return new Date(u.createdAt) >= ago;
    }).length,
    inactive:   users.filter((u) => !u.isActive).length,
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3)              return [1, 2, 3, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage, '...', totalPages];
  };

  const getInitials = (name) => (name || '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  /* ── Shared Card Styles ── */
  const baseCard = { backgroundColor: '#ffffff', border: '1px solid #c4c6cf', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.25s ease' };
  const hoverCard = { onMouseEnter: (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 36, 72, 0.08)'; }, onMouseLeave: (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'; } };

  /* ════════════════ LOADING SKELETON ════════════════ */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes skPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div>
        <Skeleton style={{ width: 220, height: 28, marginBottom: 8, borderRadius: 8 }} />
        <Skeleton style={{ width: 280, height: 16, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {[1,2,3,4].map(i => <Skeleton key={i} style={{ height: 160 }} />)}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Skeleton style={{ width: 260, height: 40, borderRadius: 8 }} />
        <Skeleton style={{ width: 150, height: 40, borderRadius: 8 }} />
        <Skeleton style={{ width: 160, height: 40, borderRadius: 8 }} />
        <div style={{ flex: 1 }} />
        <Skeleton style={{ width: 80, height: 40, borderRadius: 8 }} />
      </div>
      <Skeleton style={{ height: 520 }} />
    </div>
  );

  /* ════════════════ MAIN RENDER ════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0, fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes skPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeInRow{
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:translateY(0)}
        }
        .pp-row-animate{opacity:0;animation:fadeInRow 0.4s ease forwards}
      `}</style>

       {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#43474e' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#022448', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3a5f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#022448'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>home</span>
          Home
        </button>
        <span style={{ color: '#c4c6cf' }}>/</span>
        <span style={{ color: '#1a1c1c', fontWeight: 600 }}>Users</span>
      </nav>

      {/* ── Page title ── */}
      <div>
        <h1 style={{ fontSize: 26, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1.2, margin: 0 }}>
          Manage Users
        </h1>
        <p style={{ fontSize: 14, color: '#74777f', margin: '4px 0 0' }}>
          Directory of all registered members
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Total Users */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#d5e3ff', color: '#022448', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>group</span>
            </div>
            <span style={{ color: '#166534', fontSize: 11, fontWeight: 600, backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: 6 }}>
              +{stats.newSignups} this week
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#43474e', marginBottom: 4 }}>Total Users</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={stats.total} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: '#74777f', marginTop: 8 }}>{stats.active.toLocaleString()} currently active</p>
        </div>

        {/* Active Users */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#dcfce7', color: '#166534', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>bolt</span>
            </div>
            <span style={{ color: '#795900', fontSize: 11, fontWeight: 600, backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: 6 }}>
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% rate
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#43474e', marginBottom: 4 }}>Active Users</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={stats.active} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: '#74777f', marginTop: 8 }}>{stats.inactive} inactive</p>
        </div>

        {/* Points Issued */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#fef3c7', color: '#795900', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <span style={{ color: '#74777f', fontSize: 11, fontWeight: 600, backgroundColor: '#f4f4f3', padding: '4px 8px', borderRadius: 6 }}>
              In circulation
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#43474e', marginBottom: 4 }}>Points Issued</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1, margin: 0 }}>
            {formatPoints(stats.points)}
          </h3>
          <p style={{ fontSize: 12, color: '#74777f', marginTop: 8 }}>Across all users</p>
        </div>

        {/* New Signups */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#e0e7ff', color: '#1e3a5f', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person_add_alt</span>
            </div>
            <span style={{ color: '#1e3a5f', fontSize: 11, fontWeight: 600, backgroundColor: '#e0e7ff', padding: '4px 8px', borderRadius: 6 }}>
              Last 7 days
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#43474e', marginBottom: 4 }}>New Signups</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={stats.newSignups} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: '#74777f', marginTop: 8 }}>Weekly registration count</p>
        </div>
      </section>

      {/* ── Table Card ── */}
      <section style={{ ...baseCard, borderRadius: 16, overflow: 'hidden' }}>

        {/* Filter bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e8e8e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#f4f4f3', border: '1px solid #e2e2e2', borderRadius: 8, padding: '6px 10px', minWidth: 220 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#74777f', flexShrink: 0 }}>search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name or email…"
                style={{ outline: 'none', background: 'transparent', border: 'none', fontSize: 13, color: '#1a1c1c', width: '100%', fontFamily: 'Inter, sans-serif' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#74777f', lineHeight: 0, padding: 0, flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              )}
            </div>

            <FilterSelect value={roleFilter} onChange={(v) => { setRoleFilter(v); setCurrentPage(1); }} options={['All Roles', 'Admin', 'Member']} />
            <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} options={['All Statuses', 'Active', 'Inactive']} />
          </div>

        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {paginatedUsers.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 0', color: '#74777f' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#c4c6cf', marginBottom: 12 }}>group_off</span>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No users found</p>
              <p style={{ fontSize: 12, marginTop: 4, margin: '4px 0 0' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f9f8', borderBottom: '1px solid #e8e8e7' }}>
                  {[
                    { label: 'User',           align: 'left'  },
                    { label: 'Role',           align: 'left'  },
                    { label: 'Status',         align: 'left'  },
                    { label: 'Points Balance', align: 'right' },
                    { label: 'Joined Date',    align: 'left'  },
                    { label: 'Actions',        align: 'center'},
                  ].map(({ label, align }) => (
                    <th key={label} style={{ padding: '10px 18px', textAlign: align, fontSize: 11, fontWeight: 700, color: '#74777f', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user, idx) => {
                  const role      = ROLE_CONFIG[user.role?.toLowerCase()] || ROLE_CONFIG.user;
                  const statusKey = getUserStatus(user);
                  const status    = STATUS_CONFIG[statusKey];
                  const isMenuOpen = actionMenuUser?._id === user._id;

                  return (
                    <tr
                      key={user._id}
                      className="pp-row-animate"
                      style={{ borderBottom: '1px solid #f2f2f1', transition: 'background 0.12s', backgroundColor: 'transparent', animationDelay: `${idx * 40}ms` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* User */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, backgroundColor: '#d5e3ff', color: '#022448', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, fontFamily: 'Poppins, sans-serif', userSelect: 'none' }}>
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1c1c', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                            <p style={{ fontSize: 12, color: '#74777f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          title="Click to cycle role"
                          onClick={() => handleRoleToggle(user)}
                          style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, border: `1px solid ${role.border}`, backgroundColor: role.bg, color: role.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                        >
                          {role.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: status.color }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: status.dot, flexShrink: 0 }} />
                          {status.label}
                        </span>
                      </td>

                      {/* Points */}
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setPointsDialog(user)}
                          title="Click to adjust points"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: '#022448', padding: 0, transition: 'text-decoration-color 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.textDecorationColor = 'rgba(2,36,72,0.3)'; e.currentTarget.style.textUnderlineOffset = '3px'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          {(user.points || 0).toLocaleString()}
                          <span style={{ fontSize: 10, color: '#74777f', fontWeight: 400, marginLeft: 3 }}>VP</span>
                        </button>
                      </td>

                      {/* Joined */}
                      <td style={{ padding: '12px 18px', fontSize: 13, color: '#74777f', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <button
                            onClick={() => setPointsDialog(user)}
                            title="Adjust points"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 7, color: '#43474e', lineHeight: 0, transition: 'background 0.12s, color 0.12s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f2f2'; e.currentTarget.style.color = '#022448'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#43474e'; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                          </button>

                          <button
                            onClick={(e) => openActionMenu(e, user)}
                            title="More actions"
                            style={{
                              background: isMenuOpen ? '#e8eeff' : 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 5,
                              borderRadius: 7,
                              color: isMenuOpen ? '#022448' : '#43474e',
                              lineHeight: 0,
                              transition: 'background 0.12s, color 0.12s',
                            }}
                            onMouseEnter={(e) => { if (!isMenuOpen) { e.currentTarget.style.backgroundColor = '#f2f2f2'; e.currentTarget.style.color = '#022448'; } }}
                            onMouseLeave={(e) => { if (!isMenuOpen) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#43474e'; } }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredUsers.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e8e8e7', backgroundColor: 'rgba(249,249,248,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, color: '#74777f', margin: 0, fontWeight: 500 }}>
              Showing <strong style={{ color: '#1a1c1c' }}>{(currentPage - 1) * rowsPerPage + 1}</strong> to{' '}
              <strong style={{ color: '#1a1c1c' }}>{Math.min(currentPage * rowsPerPage, filteredUsers.length)}</strong> of{' '}
              <strong style={{ color: '#1a1c1c' }}>{filteredUsers.length.toLocaleString()}</strong> users
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{ background: 'none', border: 'none', borderRadius: 7, padding: '4px 6px', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#c4c6cf' : '#43474e', lineHeight: 0, transition: 'background 0.15s' }}
                onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
              </button>

              {getPageNumbers().map((page, i) =>
                page === '...' ? (
                  <span key={`d-${i}`} style={{ padding: '0 5px', color: '#74777f', fontSize: 13 }}>…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, backgroundColor: currentPage === page ? '#022448' : 'transparent', color: currentPage === page ? '#ffffff' : '#43474e', transition: 'background 0.15s', fontFamily: 'Inter, sans-serif' }}
                    onMouseEnter={(e) => { if (currentPage !== page) e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                    onMouseLeave={(e) => { if (currentPage !== page) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ background: 'none', border: 'none', borderRadius: 7, padding: '4px 6px', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#c4c6cf' : '#43474e', lineHeight: 0, transition: 'background 0.15s' }}
                onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══ PORTALED ACTION MENU ═══ */}
      {actionMenuUser && menuPos && createPortal(
        <div
          id={menuIdRef.current}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            width: 196,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e2e2',
            borderRadius: 12,
            boxShadow: '0 8px 28px rgba(0,0,0,0.11)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'menuFadeIn 0.12s ease',
          }}
        >
          <style>{`@keyframes menuFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {[
            { icon: actionMenuUser.isActive ? 'person_off' : 'person_check', label: actionMenuUser.isActive ? 'Deactivate' : 'Activate', action: () => { handleToggleStatus(actionMenuUser); closeActionMenu(); } },
            { icon: 'swap_horiz', label: 'Toggle Role',    action: () => { handleRoleToggle(actionMenuUser);   closeActionMenu(); } },
            { icon: 'stars',      label: 'Adjust Points', action: () => { setPointsDialog(actionMenuUser);    closeActionMenu(); } },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1a1c1c', textAlign: 'left', transition: 'background 0.12s', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#74777f' }}>{icon}</span>
              {label}
            </button>
          ))}
          <div style={{ height: 1, backgroundColor: '#f0f0ef', margin: '3px 10px' }} />
          <button onClick={closeActionMenu} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ba1a1a', textAlign: 'left', transition: 'background 0.12s', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff5f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ba1a1a' }}>block</span>
            Suspend User
          </button>
        </div>,
        document.body
      )}

      {/* ── Points Adjustment Modal ── */}
      {pointsDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,28,28,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => { setPointsDialog(null); setPointsAmount(0); setPointsDesc(''); }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 400, backgroundColor: '#ffffff', border: '1px solid #c4c6cf', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 20, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', margin: 0, lineHeight: 1.3 }}>Adjust Points</h3>
                <p style={{ fontSize: 13, color: '#74777f', margin: '4px 0 0' }}>
                  {pointsDialog.name} — Current: <strong style={{ color: '#022448' }}>{(pointsDialog.points || 0).toLocaleString()} VP</strong>
                </p>
              </div>
              <button onClick={() => { setPointsDialog(null); setPointsAmount(0); setPointsDesc(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 7, color: '#74777f', lineHeight: 0, marginTop: -4, marginRight: -4, transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1c1c', marginBottom: 6 }}>
                Points <span style={{ fontWeight: 400, color: '#74777f' }}>(negative to deduct)</span>
              </label>
              <input
                type="number"
                value={pointsAmount || ''}
                onChange={(e) => setPointsAmount(Number(e.target.value) || 0)}
                placeholder="e.g. 500 or -200"
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dddde0', borderRadius: 10, padding: '9px 13px', fontSize: 14, backgroundColor: '#f9f9f8', color: '#1a1c1c', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#022448'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(2,36,72,0.2)'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#dddde0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1c1c', marginBottom: 6 }}>Reason</label>
              <input
                type="text"
                value={pointsDesc}
                onChange={(e) => setPointsDesc(e.target.value)}
                placeholder="e.g. Customer support adjustment"
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #dddde0', borderRadius: 10, padding: '9px 13px', fontSize: 14, backgroundColor: '#f9f9f8', color: '#1a1c1c', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#022448'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(2,36,72,0.2)'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#dddde0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {pointsAmount !== 0 && (
              <div style={{ backgroundColor: (pointsDialog.points || 0) + pointsAmount < 0 ? '#fff5f5' : '#f0f7ff', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#74777f' }}>New balance</span>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 17, fontWeight: 700, color: (pointsDialog.points || 0) + pointsAmount < 0 ? '#ba1a1a' : '#022448' }}>
                  {((pointsDialog.points || 0) + pointsAmount).toLocaleString()}
                  <span style={{ fontSize: 10, color: '#74777f', fontWeight: 400, marginLeft: 3 }}>VP</span>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setPointsDialog(null); setPointsAmount(0); setPointsDesc(''); }} style={{ flex: 1, padding: '10px', border: '1px solid #c4c6cf', borderRadius: 10, background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#43474e', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Cancel
              </button>
              <button onClick={handlePointsAdjust} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, backgroundColor: '#022448', color: '#ffffff', cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 14px rgba(2,36,72,0.25)', transition: 'opacity 0.15s, transform 0.1s', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseDown={(e)  => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onMouseUp={(e)    => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;