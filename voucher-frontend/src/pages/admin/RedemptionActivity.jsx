import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { redemptionAPI } from '../../services/api';

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago, ${timeStr}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AVATAR_COLORS = ['#022448','#795900','#1e3a5f','#166534','#6b21a8','#0e7490','#be123c'];
const avatarColor = (str = '') => AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

/* ══════════════════════════════════════════════════════════
   STATUS BADGE
══════════════════════════════════════════════════════════ */
const STATUS_STYLE = {
  pending:   { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  success:   { bg: '#dcfce7', color: '#166534', label: 'Success' },
  redeemed:  { bg: '#dcfce7', color: '#166534', label: 'Redeemed' },
  expired:   { bg: '#fee2e2', color: '#991b1b', label: 'Expired' },
  failed:    { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
  cancelled: { bg: '#f0f0f0', color: '#74777f', label: 'Cancelled' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status?.toLowerCase()] ?? { bg: '#f0f0f0', color: '#74777f', label: status ?? '—' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif',
      backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════
   ICON BUTTON (reusable)
══════════════════════════════════════════════════════════ */
const IconBtn = ({ icon, title, onClick, danger = false }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      width: 32, height: 32, display: 'flex', alignItems: 'center',
      justifyContent: 'center', borderRadius: 8, border: 'none',
      backgroundColor: 'transparent', color: '#74777f', cursor: 'pointer',
      transition: 'background-color 0.15s ease, color 0.15s ease',
      flexShrink: 0,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = danger ? '#fee2e2' : '#eeeeed';
      e.currentTarget.style.color = danger ? '#ba1a1a' : '#022448';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = '#74777f';
    }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
  </button>
);

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
const ROW_OPTIONS = [10, 20, 50];

const RedemptionActivity = () => {
  const navigate = useNavigate();

  /* ─── data ─── */
  const [redemptions, setRedemptions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [currentPage, setCurrentPage]   = useState(1);
  const [rowsPerPage, setRowsPerPage]   = useState(10);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [search, setSearch]             = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteRef = useRef(null);

  /* ─── fetch ─── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await redemptionAPI.getAll({ limit: 500 });
      const data = res.data?.data ?? res.data?.redemptions ?? res.data ?? [];
      /* normalise each record */
      const normalised = data.map((r) => ({
        _id: r._id,
        userName:  r.user?.name  ?? r.userId?.name  ?? 'Unknown User',
        userEmail: r.user?.email ?? r.userId?.email ?? '',
        voucherTitle:    r.voucher?.title    ?? r.voucherId?.title    ?? 'Unknown Voucher',
        voucherCategory: r.voucher?.category ?? r.voucherId?.category ?? '',
        merchant:        r.voucher?.merchant ?? r.voucherId?.merchant ?? '',
        pointsUsed: r.pointsUsed || 0,
        status:     r.status ?? 'pending',
        redemptionCode: r.redemptionCode ?? '—',
        createdAt:  r.createdAt ?? r.updatedAt,
      }));
      /* sort newest first */
      normalised.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRedemptions(normalised);
    } catch (err) {
      console.error('RedemptionActivity fetch error:', err);
      toast.error('Failed to load redemptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* close delete modal on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (deleteRef.current && !deleteRef.current.contains(e.target)) setDeleteTarget(null);
    };
    if (deleteTarget) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [deleteTarget]);

  /* ─── delete ─── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await redemptionAPI.delete(deleteTarget._id);
      toast.success('Redemption record removed');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  /* ─── filter + search ─── */
  const filtered = redemptions.filter((r) => {
    if (statusFilter !== 'All Status' && r.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.voucherTitle.toLowerCase().includes(q) ||
        r.redemptionCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ─── pagination ─── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [totalPages, currentPage]);

  const getPageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage, '...', totalPages];
  };

  /* ─── summary badges ─── */
  const summary = {
    total:     redemptions.length,
    success:   redemptions.filter((r) => ['success','redeemed'].includes(r.status?.toLowerCase())).length,
    pending:   redemptions.filter((r) => r.status?.toLowerCase() === 'pending').length,
    expired:   redemptions.filter((r) => ['expired','failed','cancelled'].includes(r.status?.toLowerCase())).length,
    totalPts:  redemptions.reduce((s, r) => s + r.pointsUsed, 0),
  };

  /* ─── shared styles ─── */
  const inputStyle = {
    height: 36, borderRadius: 8, border: '1px solid #e2e2e2',
    backgroundColor: '#f7f7f6', fontSize: 13, fontFamily: 'Inter, sans-serif',
    color: '#1a1c1c', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    paddingLeft: 12, paddingRight: 12, boxSizing: 'border-box',
  };
  const focusInput = (e) => {
    e.currentTarget.style.borderColor = '#022448';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(2,36,72,0.08)';
    e.currentTarget.style.backgroundColor = '#ffffff';
  };
  const blurInput = (e) => {
    e.currentTarget.style.borderColor = '#e2e2e2';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.backgroundColor = '#f7f7f6';
  };

  /* ════════════════ RENDER ════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ─── Page Header ─── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#74777f', fontSize: 13, fontFamily: 'Inter, sans-serif', padding: 0, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#022448'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#74777f'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Dashboard
          </button>
          <span style={{ color: '#c4c6cf', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#022448', fontFamily: 'Inter, sans-serif' }}>Redemption Activity</span>
        </div>
        <h2 style={{ fontSize: 24, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', marginBottom: 4 }}>
          Redemption Activity
        </h2>
        <p style={{ fontSize: 14, color: '#43474e', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
          Full history of all voucher redemptions across users.
        </p>
      </div>

      {/* ─── Summary Strip ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Records',   value: summary.total.toLocaleString(),   color: '#022448', bg: '#d5e3ff' },
          { label: 'Successful',      value: summary.success.toLocaleString(), color: '#166534', bg: '#dcfce7' },
          { label: 'Pending',         value: summary.pending.toLocaleString(), color: '#854d0e', bg: '#fef9c3' },
          { label: 'Expired / Failed',value: summary.expired.toLocaleString(), color: '#991b1b', bg: '#fee2e2' },
          { label: 'Points Spent',    value: summary.totalPts >= 1e6 ? (summary.totalPts/1e6).toFixed(1)+'M' : summary.totalPts >= 1e3 ? (summary.totalPts/1e3).toFixed(1)+'K' : summary.totalPts.toLocaleString(), color: '#5c4300', bg: '#ffdfa0' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: '#ffffff', border: '1px solid #e5e5e4', borderRadius: 12,
              padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6,
              boxShadow: '0px 2px 8px rgba(30,58,95,0.04)',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: '#74777f', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {s.label}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
              <p style={{ fontSize: 22, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filters Row ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

        {/* Left: search + status filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#74777f', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search user, voucher, code…"
              style={{ ...inputStyle, paddingLeft: 34, width: 240 }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderRadius: 8, backgroundColor: '#eeeeed', border: '1px solid rgba(196,198,207,0.4)', height: 36 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#43474e' }}>filter_list</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#43474e', fontFamily: 'Inter, sans-serif', padding: 0 }}
            >
              <option>All Status</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Right: rows-per-page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#74777f', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            style={{ ...inputStyle, width: 64, paddingLeft: 8, cursor: 'pointer' }}
            onFocus={focusInput}
            onBlur={blurInput}
          >
            {ROW_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* ─── Table Card ─── */}
      <section
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e2e2',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0px 2px 8px rgba(30,58,95,0.04)',
        }}
      >
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #022448', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#74777f', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Loading redemptions…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#74777f' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>receipt_long</span>
              <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>No redemptions found</p>
              <p style={{ fontSize: 12, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ backgroundColor: '#f7f7f6', borderBottom: '1px solid #e2e2e2' }}>
                  {[
                    { label: 'User',           align: 'left'  },
                    { label: 'Voucher',        align: 'left'  },
                    { label: 'Code',           align: 'left'  },
                    { label: 'Date',           align: 'left'  },
                    { label: 'Status',         align: 'left'  },
                    { label: 'Points Used',    align: 'right' },
                    { label: 'Actions',        align: 'right' },
                  ].map((h) => (
                    <th
                      key={h.label}
                      style={{
                        padding: '14px 20px', fontSize: 11, fontWeight: 600,
                        color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.06em',
                        textAlign: h.align, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                      }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, idx) => (
                  <tr
                    key={r._id}
                    style={{
                      borderBottom: idx < paginated.length - 1 ? '1px solid rgba(226,226,226,0.6)' : 'none',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* User */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: avatarColor(r.userName), color: '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                        }}>
                          {initials(r.userName)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#022448', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                            {r.userName}
                          </p>
                          <p style={{ fontSize: 11, color: '#74777f', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                            {r.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Voucher */}
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1c1c', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                        {r.voucherTitle}
                      </p>
                      <p style={{ fontSize: 11, color: '#74777f', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                        {r.merchant || r.voucherCategory || '—'}
                      </p>
                    </td>

                    {/* Code */}
                    <td style={{ padding: '14px 20px' }}>
                      <code style={{
                        fontSize: 11, fontFamily: 'monospace',
                        backgroundColor: '#f4f4f3', color: '#43474e',
                        padding: '3px 8px', borderRadius: 6, letterSpacing: '0.04em',
                        border: '1px solid #e8e8e7',
                      }}>
                        {r.redemptionCode}
                      </code>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: 12, color: '#43474e', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                        {formatRelativeDate(r.createdAt)}
                      </p>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Points Used */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#022448', fontFamily: 'Inter, sans-serif' }}>
                        {r.pointsUsed > 0 ? `-${r.pointsUsed.toLocaleString()} pts` : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                        <IconBtn
                          icon="visibility"
                          title="View user"
                          onClick={() => navigate(`/admin/users`)}
                        />
                        <IconBtn
                          icon="delete"
                          title="Delete record"
                          danger
                          onClick={() => setDeleteTarget(r)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ─── Pagination ─── */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e2e2', backgroundColor: 'rgba(247,247,246,0.6)' }}>
            <p style={{ fontSize: 12, color: '#74777f', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
              Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} records
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Prev */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: currentPage === 1 ? '#c4c6cf' : '#43474e', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.backgroundColor = '#eeeeed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
              </button>

              {/* Page numbers */}
              {getPageNums().map((p, i) =>
                p === '...' ? (
                  <span key={`d${i}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#74777f', fontFamily: 'Inter, sans-serif' }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: currentPage === p ? 700 : 500, backgroundColor: currentPage === p ? '#022448' : 'transparent', color: currentPage === p ? '#ffffff' : '#43474e', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => { if (currentPage !== p) e.currentTarget.style.backgroundColor = '#eeeeed'; }}
                    onMouseLeave={(e) => { if (currentPage !== p) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: currentPage === totalPages ? '#c4c6cf' : '#43474e', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#eeeeed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ─── DELETE MODAL ─── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,28,28,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteTarget(null)} />
          <div
            ref={deleteRef}
            style={{ position: 'relative', width: '100%', maxWidth: 400, backgroundColor: '#ffffff', border: '1px solid #c4c6cf', borderRadius: 20, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#ffdad6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ba1a1a' }}>warning</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#022448', marginBottom: 8 }}>Delete Record</h3>
              <p style={{ fontSize: 14, color: '#43474e', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                Remove the redemption by <strong>{deleteTarget.userName}</strong> for <strong>{deleteTarget.voucherTitle}</strong>? This cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #c4c6cf', backgroundColor: 'transparent', fontSize: 14, fontWeight: 500, color: '#43474e', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', backgroundColor: '#ba1a1a', color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(186,26,26,0.28)', transition: 'opacity 0.15s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedemptionActivity;