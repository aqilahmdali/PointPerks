import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { voucherAPI } from '../../services/api';
import { formatDate, formatDiscount } from '../../utils/helpers';

/* ─── Helpers ─── */
const getStockInfo = (voucher) => {
  const total    = voucher.totalLimit   || 0;
  const redeemed = voucher.redeemedCount || 0;
  const left     = Math.max(0, total - redeemed);
  const pct      = total > 0 ? Math.round((left / total) * 100) : 0;

  // Status logic — 10% threshold for "Low Stock"
  let status = 'Active', statusBg = '#dcfce7', statusColor = '#166534';

  if (!voucher.isActive) {
    status = 'Inactive'; statusBg = '#e8e8e7'; statusColor = '#74777f';
  } else if (total > 0 && pct <= 10) {
    status = 'Low Stock'; statusBg = '#ffc641'; statusColor = '#5c4300';
  }

  let barColor = '#022448';
  if (!voucher.isActive)           barColor = '#c4c6cf';
  else if (total > 0 && pct <= 10) barColor = '#ba1a1a';

  return { left, pct, status, statusBg, statusColor, barColor };
};

const formatPts = (n) => (n || 0).toLocaleString();

/* ════════════════════════════════════════════════════════════════════ */
const ManageVouchers = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter]   = useState('All Status');
  const [currentPage, setCurrentPage]     = useState(1);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const deleteRef = useRef(null);
  const rowsPerPage = 10;

  /* ─── Fetch ─── */
  const fetchData = () => {
    setLoading(true);
    voucherAPI
      .getAll({ search: search || undefined, showExpired: 'true', limit: 100 })
      .then((res) => setVouchers(res.data.data || []))
      .catch(() => toast.error('Failed to load vouchers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Close delete modal on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (deleteRef.current && !deleteRef.current.contains(e.target)) setDeleteTarget(null);
    };
    if (deleteTarget) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [deleteTarget]);

  /* ─── Actions ─── */
  const handleToggle = async (voucher) => {
    try {
      await voucherAPI.toggle(voucher._id);
      toast.success(`"${voucher.title}" ${voucher.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await voucherAPI.delete(deleteTarget._id);
      toast.success('Voucher removed');
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  /* ─── Filtering & Pagination ─── */
  const filtered = vouchers.filter((v) => {
    if (categoryFilter !== 'All Categories' && v.category !== categoryFilter) return false;
    if (statusFilter === 'Active'   && !v.isActive) return false;
    if (statusFilter === 'Inactive' &&  v.isActive) return false;
    if (statusFilter === 'Low Stock') {
      const total = v.totalLimit || 0;
      const left  = Math.max(0, total - (v.redeemedCount || 0));
      if (total === 0 || (left / total) * 100 > 10 || !v.isActive) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  /* ─── Unique categories from data ─── */
  const categories = ['All Categories', ...Array.from(new Set(vouchers.map((v) => v.category).filter(Boolean)))];

  /* ─── Computed Stats ─── */
  const stats = {
    active:      vouchers.filter((v) => v.isActive).length,
    redemptions: vouchers.reduce((s, v) => s + (v.redeemedCount || 0), 0),
    lowStock:    vouchers.filter((v) => {
      const t = v.totalLimit || 0;
      const l = Math.max(0, t - (v.redeemedCount || 0));
      return v.isActive && t > 0 && (l / t) * 100 <= 10;
    }).length,
    // FIX: was pointCost → pointsCost (matches DB schema)
    avgCost: vouchers.length
      ? Math.round(vouchers.reduce((s, v) => s + (v.pointsCost || 0), 0) / vouchers.length)
      : 0,
  };

  const getPageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage, '...', totalPages];
  };

  /* ════════════════ RENDER ════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page title ── */}
      <div>
        <h1 style={{ fontSize: 24, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1.2, margin: 0 }}>
          Manage Vouchers
        </h1>
        <p style={{ fontSize: 13, color: '#74777f', margin: '3px 0 0' }}>
          Directory of all registered vouchers
        </p>
      </div>

      {/* ────────── STAT CARDS ────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { label: 'Active Vouchers',   value: stats.active.toLocaleString(),
            sub: 'Currently live',      subColor: '#74777f', valueColor: '#022448' },
          { label: 'Total Redemptions', value: stats.redemptions >= 1000 ? (stats.redemptions / 1000).toFixed(1) + 'k' : String(stats.redemptions),
            sub: 'Lifetime total',      subColor: '#74777f', valueColor: '#795900' },
          { label: 'Stock Low Alerts',  value: String(stats.lowStock).padStart(2, '0'),
            sub: 'Requires attention',  subColor: '#ba1a1a', valueColor: '#ba1a1a' },
          { label: 'Avg. Point Cost',   value: stats.avgCost >= 1000 ? (stats.avgCost / 1000).toFixed(1) + 'k' : String(stats.avgCost),
            sub: 'Weighted average',    subColor: '#74777f', valueColor: '#022448' },
        ].map((card, i) => (
          <div
            key={i}
            style={{ backgroundColor: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 16, padding: 24, cursor: 'default', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0px 2px 8px rgba(30,58,95,0.04)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0px 10px 28px rgba(30,58,95,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0px 2px 8px rgba(30,58,95,0.04)'; }}
          >
            <p style={{ fontSize: 11, fontWeight: 600, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif', marginBottom: 10 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: card.valueColor, lineHeight: 1.1, marginBottom: 8 }}>
              {card.value}
            </p>
            <p style={{ fontSize: 13, color: card.subColor, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
              {card.sub}
            </p>
          </div>
        ))}
      </section>

      {/* ────────── SEARCH + FILTERS + ADD BUTTON ────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, backgroundColor: '#ffffff', border: '1px solid #c4c6cf' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#74777f' }}>search</span>
            <input
              type="text"
              placeholder="Search vouchers…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: '#1a1c1c', fontFamily: 'Inter, sans-serif', background: 'transparent', minWidth: 160 }}
            />
          </div>

          {/* Category Filter — dynamically built from data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, backgroundColor: '#eeeeed', border: '1px solid rgba(196,198,207,0.4)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#43474e' }}>filter_list</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#43474e', fontFamily: 'Inter, sans-serif', padding: 0 }}
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, backgroundColor: '#eeeeed', border: '1px solid rgba(196,198,207,0.4)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#43474e' }}>check_circle</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#43474e', fontFamily: 'Inter, sans-serif', padding: 0 }}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Low Stock</option>
            </select>
          </div>
        </div>

        {/* Add New Voucher */}
        <button
          onClick={() => navigate('/admin/vouchers/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#022448', color: '#ffffff', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2,36,72,0.28)', transition: 'box-shadow 0.2s ease, transform 0.1s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(2,36,72,0.38)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(2,36,72,0.28)'; e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>add</span>
          Add New Voucher
        </button>
      </div>

      {/* ────────── DATA TABLE ────────── */}
      <section style={{ backgroundColor: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 16, overflow: 'hidden', boxShadow: '0px 2px 8px rgba(30,58,95,0.04)' }}>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #022448', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#74777f', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Loading vouchers…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#74777f' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>confirmation_number</span>
              <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>No vouchers found</p>
              <p style={{ fontSize: 12, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ backgroundColor: '#f7f7f6', borderBottom: '1px solid #e2e2e2' }}>
                  {[
                    { label: 'Voucher',     align: 'left'  },
                    { label: 'Category',    align: 'left'  },
                    { label: 'Discount',    align: 'left'  },
                    { label: 'Point Cost',  align: 'left'  },
                    { label: 'Stock',       align: 'left'  },
                    { label: 'Expiry',      align: 'left'  },
                    { label: 'Status',      align: 'left'  },
                    { label: 'Actions',     align: 'right' },
                  ].map((h) => (
                    <th key={h.label} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h.align, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((v, idx) => {
                  const stock      = getStockInfo(v);
                  const isInactive = !v.isActive;
                  // FIX: use v.pointsCost (DB field), not v.pointCost
                  const cost       = v.pointsCost || 0;
                  // FIX: expiry is v.expiryDate (DB field), not v.expiresAt
                  const expiry     = v.expiryDate ? formatDate(v.expiryDate) : '—';
                  const isExpired  = v.expiryDate && new Date(v.expiryDate) < new Date();

                  return (
                    <tr
                      key={v._id}
                      style={{ borderBottom: idx < paginated.length - 1 ? '1px solid rgba(226,226,226,0.6)' : 'none', opacity: isInactive ? 0.55 : 1, filter: isInactive ? 'grayscale(0.4)' : 'none', transition: 'background-color 0.15s ease', backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >

                      {/* Voucher Name + Merchant */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#eeeeed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {v.image ? (
                              <img src={v.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#74777f' }}>loyalty</span>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#022448', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                              {v.title}
                            </p>
                            {/* FIX: show merchant as subtitle — it's a separate DB field */}
                            <p style={{ fontSize: 11, color: '#74777f', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                              {v.merchant || `ID: ${v._id?.slice(-8).toUpperCase()}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category — FIX: was showing v.merchant || v.category */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 13, color: '#43474e', fontFamily: 'Inter, sans-serif' }}>
                          {v.category || '—'}
                        </span>
                      </td>

                      {/* Discount — FIX: added dedicated column using discountType + discountValue */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#022448', fontFamily: 'Inter, sans-serif' }}>
                          {formatDiscount(v.discountType, v.discountValue)}
                        </span>
                      </td>

                      {/* Point Cost — FIX: v.pointsCost not v.pointCost */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#022448', fontFamily: 'Inter, sans-serif' }}>
                          {formatPts(cost)} pts
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ width: 120 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: stock.pct <= 10 && v.isActive && v.totalLimit > 0 ? 600 : 400, color: stock.pct <= 10 && v.isActive && v.totalLimit > 0 ? '#ba1a1a' : '#43474e', fontFamily: 'Inter, sans-serif' }}>
                              {stock.left} left
                            </span>
                            <span style={{ fontSize: 11, color: '#74777f', fontFamily: 'Inter, sans-serif' }}>{stock.pct}%</span>
                          </div>
                          <div style={{ width: '100%', height: 5, borderRadius: 99, backgroundColor: '#e8e8e7', overflow: 'hidden' }}>
                            <div style={{ width: `${stock.pct}%`, height: '100%', borderRadius: 99, backgroundColor: stock.barColor, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      </td>

                      {/* Expiry — FIX: v.expiryDate (DB field) */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: isExpired ? '#ba1a1a' : '#43474e', fontWeight: isExpired ? 600 : 400 }}>
                          {expiry}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: stock.statusBg, color: stock.statusColor, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                          {isExpired && v.isActive ? 'Expired' : stock.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>

                          {/* Edit */}
                          <button
                            title="Edit"
                            onClick={() => navigate(`/admin/vouchers/${v._id}/edit`)}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: '#43474e', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eeeeed'; e.currentTarget.style.color = '#022448'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#43474e'; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                          </button>

                          {/* Toggle active/inactive */}
                          <button
                            title={isInactive ? 'Activate' : 'Deactivate'}
                            onClick={() => handleToggle(v)}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: '#74777f', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eeeeed'; e.currentTarget.style.color = '#022448'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#74777f'; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{isInactive ? 'visibility' : 'visibility_off'}</span>
                          </button>

                          {/* Delete */}
                          <button
                            title="Delete"
                            onClick={() => setDeleteTarget(v)}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: '#74777f', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ba1a1a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#74777f'; }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
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

        {/* ─── Pagination ─── */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e2e2', backgroundColor: 'rgba(247,247,246,0.6)' }}>
            <p style={{ fontSize: 12, color: '#74777f', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
              Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} results
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: currentPage === 1 ? '#c4c6cf' : '#43474e', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.backgroundColor = '#eeeeed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
              </button>

              <div style={{ display: 'flex', gap: 2 }}>
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
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: currentPage === totalPages ? '#c4c6cf' : '#43474e', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#eeeeed'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ────────── DELETE CONFIRMATION MODAL ────────── */}
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
              <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#022448', marginBottom: 8 }}>Confirm Deletion</h3>
              <p style={{ fontSize: 14, color: '#43474e', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                Delete <strong>"{deleteTarget.title}"</strong>? This action cannot be undone and will affect any existing redemptions.
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
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', backgroundColor: '#ba1a1a', color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(186,26,26,0.28)', transition: 'opacity 0.15s ease, transform 0.1s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ManageVouchers;