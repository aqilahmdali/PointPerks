import React, { useEffect, useState, useRef } from 'react';
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

const getUserStatus = (user) => {
  if (user.isActive) return 'active';
  return 'inactive';
};

/* Small reusable select dropdown */
const FilterSelect = ({ value, onChange, options }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundColor: '#ffffff',
        border: '1px solid #dddde0',
        borderRadius: 8,
        padding: '7px 32px 7px 12px',
        fontSize: 13,
        fontWeight: 500,
        color: '#1a1c1c',
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.4,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#022448'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(2,36,72,0.15)'; }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = '#dddde0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    {/* chevron icon */}
    <span
      style={{
        position: 'absolute',
        right: 9,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: '#74777f',
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      ▾
    </span>
  </div>
);

/* ════════════════════════════════════════════════════════ */
const ManageUsers = () => {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [pointsDialog, setPointsDialog] = useState(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsDesc, setPointsDesc]     = useState('');
  const [roleFilter, setRoleFilter]     = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [currentPage, setCurrentPage]   = useState(1);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const menuRef   = useRef(null);
  const rowsPerPage = 10;

  const fetchData = () => {
    setLoading(true);
    userAPI
      .getAll({ search: search || undefined, limit: 100 })
      .then((res) => setUsers(res.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handle = setTimeout(fetchData, 300);
    return () => clearTimeout(handle);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActionMenuOpen(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3)              return [1, 2, 3, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage, '...', totalPages];
  };

  /* ── Avatar initials helper ── */
  const getInitials = (name) => (name || '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  /* ── Stat card colours ── */
  const STAT_CARDS = [
    { icon: 'groups',         iconBg: '#e8eeff', iconColor: '#1a3a6b', label: 'Total Users',      value: stats.total.toLocaleString(),  badge: { text: '12%',                    type: 'up'      } },
    { icon: 'bolt',           iconBg: '#fff8e1', iconColor: '#7a5200', label: 'Active Users',     value: stats.active.toLocaleString(), badge: { text: 'Stable',                  type: 'neutral' } },
    { icon: 'stars',          iconBg: '#f0f4ff', iconColor: '#3b4fa8', label: 'Points Issued',    value: formatPoints(stats.points),    badge: { text: `+${stats.newSignups} today`, type: 'info'  } },
    { icon: 'person_add_alt', iconBg: '#fff0f0', iconColor: '#ba1a1a', label: 'New Signups (7d)', value: stats.newSignups.toString(),   badge: { text: '28%',                    type: 'up'      } },
  ];

  /* ════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0 }}>

      {/* ── Page title ── */}
      <div>
        <h1 style={{ fontSize: 24, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1.2, margin: 0 }}>
          Manage Users
        </h1>
        <p style={{ fontSize: 13, color: '#74777f', margin: '3px 0 0' }}>
          Directory of all registered members
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e8e7',
              borderRadius: 16,
              padding: '20px 20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              cursor: 'default',
              transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
              boxShadow: '0 2px 10px rgba(30,58,95,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform    = 'translateY(-3px)';
              e.currentTarget.style.boxShadow    = '0 10px 28px rgba(30,58,95,0.09)';
              e.currentTarget.style.borderColor  = 'rgba(2,36,72,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform    = 'translateY(0)';
              e.currentTarget.style.boxShadow    = '0 2px 10px rgba(30,58,95,0.04)';
              e.currentTarget.style.borderColor  = '#e8e8e7';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ backgroundColor: card.iconBg, padding: '8px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: card.iconColor, fontVariationSettings: "'FILL' 1" }}>
                  {card.icon}
                </span>
              </span>
              {card.badge.type === 'up' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>trending_up</span>
                  {card.badge.text}
                </span>
              )}
              {card.badge.type === 'neutral' && (
                <span style={{ backgroundColor: '#f2f2f2', color: '#74777f', fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 20 }}>
                  {card.badge.text}
                </span>
              )}
              {card.badge.type === 'info' && (
                <span style={{ backgroundColor: '#e8eeff', color: '#1a3a6b', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20 }}>
                  {card.badge.text}
                </span>
              )}
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#74777f', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              {card.label}
            </p>
            <h3 style={{ fontSize: 30, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1.1, margin: 0 }}>
              {card.value}
            </h3>
          </div>
        ))}
      </section>

      {/* ── Table Card ── */}
      <section style={{ backgroundColor: '#ffffff', border: '1px solid #e8e8e7', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(30,58,95,0.04)' }}>

        {/* Filter bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e8e8e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {/* Left: search + dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Search input */}
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

            <FilterSelect
              value={roleFilter}
              onChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
              options={['All Roles', 'Admin', 'Member']}
            />
            <FilterSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              options={['All Statuses', 'Active', 'Inactive']}
            />
          </div>

          {/* Right: icon buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['filter_list', 'file_download'].map((ic) => (
              <button
                key={ic}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#74777f', lineHeight: 0, transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{ic}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 0', gap: 12 }}>
              <div style={{ width: 30, height: 30, border: '3px solid #e2e2e2', borderTopColor: '#022448', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: '#74777f', fontSize: 13, margin: 0 }}>Loading users…</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 0', color: '#74777f' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#c4c6cf', marginBottom: 10 }}>group_off</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#43474e', margin: 0 }}>No users found</p>
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
                {paginatedUsers.map((user) => {
                  const role      = ROLE_CONFIG[user.role?.toLowerCase()] || ROLE_CONFIG.user;
                  const statusKey = getUserStatus(user);
                  const status    = STATUS_CONFIG[statusKey];

                  return (
                    <tr
                      key={user._id}
                      style={{ borderBottom: '1px solid #f2f2f1', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* User */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              backgroundColor: '#d5e3ff', color: '#022448',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 13, fontFamily: 'Poppins, sans-serif',
                              userSelect: 'none',
                            }}>
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1c1c', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.name}
                            </p>
                            <p style={{ fontSize: 12, color: '#74777f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          title="Click to cycle role"
                          onClick={() => handleRoleToggle(user)}
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 6,
                            border: `1px solid ${role.border}`,
                            backgroundColor: role.bg,
                            color: role.color,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: '#022448', padding: 0 }}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }} ref={actionMenuOpen === user._id ? menuRef : null}>
                          <button
                            onClick={() => setPointsDialog(user)}
                            title="Adjust points"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 7, color: '#43474e', lineHeight: 0, transition: 'background 0.12s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                          </button>

                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 7, color: '#43474e', lineHeight: 0, transition: 'background 0.12s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>more_vert</span>
                            </button>

                            {actionMenuOpen === user._id && (
                              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', width: 196, backgroundColor: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.11)', zIndex: 50, overflow: 'hidden' }}>
                                {[
                                  { icon: user.isActive ? 'person_off' : 'person_check', label: user.isActive ? 'Deactivate' : 'Activate', action: () => { handleToggleStatus(user); setActionMenuOpen(null); }, danger: false },
                                  { icon: 'swap_horiz', label: 'Toggle Role',    action: () => { handleRoleToggle(user);   setActionMenuOpen(null); }, danger: false },
                                  { icon: 'stars',      label: 'Adjust Points', action: () => { setPointsDialog(user);    setActionMenuOpen(null); }, danger: false },
                                ].map(({ icon, label, action }) => (
                                  <button key={label} onClick={action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1a1c1c', textAlign: 'left', transition: 'background 0.12s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f3'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#74777f' }}>{icon}</span>
                                    {label}
                                  </button>
                                ))}
                                <div style={{ height: 1, backgroundColor: '#f0f0ef', margin: '3px 10px' }} />
                                <button onClick={() => setActionMenuOpen(null)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ba1a1a', textAlign: 'left', transition: 'background 0.12s' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff5f5'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ba1a1a' }}>block</span>
                                  Suspend User
                                </button>
                              </div>
                            )}
                          </div>
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
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e8e8e7', backgroundColor: '#f9f9f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, color: '#74777f', margin: 0 }}>
              Showing <strong style={{ color: '#1a1c1c' }}>{(currentPage - 1) * rowsPerPage + 1}</strong> to{' '}
              <strong style={{ color: '#1a1c1c' }}>{Math.min(currentPage * rowsPerPage, filteredUsers.length)}</strong> of{' '}
              <strong style={{ color: '#1a1c1c' }}>{filteredUsers.length.toLocaleString()}</strong> users
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{ background: 'none', border: '1px solid #dddde0', borderRadius: 7, padding: '4px 6px', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#c4c6cf' : '#43474e', lineHeight: 0, transition: 'background 0.12s' }}
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
                    style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, backgroundColor: currentPage === page ? '#022448' : 'transparent', color: currentPage === page ? '#ffffff' : '#43474e', transition: 'background 0.12s' }}
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
                style={{ background: 'none', border: '1px solid #dddde0', borderRadius: 7, padding: '4px 6px', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#c4c6cf' : '#43474e', lineHeight: 0, transition: 'background 0.12s' }}
                onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Points Adjustment Modal ── */}
      {pointsDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,28,28,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setPointsDialog(null); setPointsAmount(0); setPointsDesc(''); }}
          />
          <div style={{ position: 'relative', width: '100%', maxWidth: 400, backgroundColor: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 20, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', margin: 0, lineHeight: 1.3 }}>Adjust Points</h3>
                <p style={{ fontSize: 13, color: '#74777f', margin: '4px 0 0' }}>
                  {pointsDialog.name} — Current: <strong style={{ color: '#022448' }}>{(pointsDialog.points || 0).toLocaleString()} VP</strong>
                </p>
              </div>
              <button onClick={() => { setPointsDialog(null); setPointsAmount(0); setPointsDesc(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 7, color: '#74777f', lineHeight: 0, marginTop: -4, marginRight: -4 }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Points input */}
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

            {/* Reason input */}
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

            {/* Balance preview */}
            {pointsAmount !== 0 && (
              <div style={{ backgroundColor: (pointsDialog.points || 0) + pointsAmount < 0 ? '#fff5f5' : '#f0f7ff', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#74777f' }}>New balance</span>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 17, fontWeight: 700, color: (pointsDialog.points || 0) + pointsAmount < 0 ? '#ba1a1a' : '#022448' }}>
                  {((pointsDialog.points || 0) + pointsAmount).toLocaleString()}
                  <span style={{ fontSize: 10, color: '#74777f', fontWeight: 400, marginLeft: 3 }}>VP</span>
                </span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setPointsDialog(null); setPointsAmount(0); setPointsDesc(''); }} style={{ flex: 1, padding: '10px', border: '1px solid #dddde0', borderRadius: 10, background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#43474e', transition: 'background 0.12s' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Cancel
              </button>
              <button onClick={handlePointsAdjust} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, backgroundColor: '#022448', color: '#ffffff', cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 14px rgba(2,36,72,0.25)', transition: 'opacity 0.12s, transform 0.1s', fontFamily: 'Poppins, sans-serif' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
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