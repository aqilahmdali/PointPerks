import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { voucherAPI } from '../../services/api';

/* ─── Options ─── */
const CATEGORY_OPTIONS = [
  { label: 'Food & Beverage',        value: 'food'          },
  { label: 'Shopping & E-commerce',  value: 'shopping'      },
  { label: 'Travel & Hospitality',   value: 'travel'        },
  { label: 'Entertainment',          value: 'entertainment' },
  { label: 'Health & Wellness',      value: 'health'        },
];

const DISCOUNT_OPTIONS = [
  { label: 'Percentage (%)',    value: 'percentage' },
  { label: 'Fixed amount (RM)', value: 'fixed'      },
];

const EMPTY_FORM = {
  title: '', description: '', category: 'food',
  discountType: 'percentage', discountValue: 0,
  originalPrice: null, pointsCost: 0,
  merchant: '', merchantLogo: '', image: '',
  terms: '', totalLimit: null, perUserLimit: 1,
  expiryDate: '', isActive: true, isFeatured: false,
};

/* ─── Custom Toggle ─── */
const Toggle = ({ checked, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none',
        backgroundColor: checked ? '#022448' : '#c4c6cf',
        position: 'relative', cursor: 'pointer',
        transition: 'background-color 0.2s ease', flexShrink: 0,
      }}
    >
      <span style={{
        width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff',
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1c1c', fontFamily: 'Inter, sans-serif' }}>
      {label}
    </span>
  </div>
);

/* ─── Shared input styles ─── */
const inputBase = {
  width: '100%', padding: '11px 12px', borderRadius: 8,
  border: '1px solid #c4c6cf', backgroundColor: '#ffffff',
  fontSize: 15, fontFamily: 'Inter, sans-serif', color: '#1a1c1c',
  outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  boxSizing: 'border-box',
};
const inputFocus = (e) => { e.currentTarget.style.borderColor = '#022448'; e.currentTarget.style.boxShadow = '0 0 0 1px #022448'; };
const inputBlur  = (e) => { e.currentTarget.style.borderColor = '#c4c6cf'; e.currentTarget.style.boxShadow = 'none'; };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#43474e', marginBottom: 6, fontFamily: 'Inter, sans-serif' };

/* ─── Section divider ─── */
const SectionDivider = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: '#f0f0f0' }} />
  </div>
);

/* ══════════════════════════════════════════════════════════════════════ */
const AddEditVoucher = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(isEdit);

  /* ── Fixed sidebar positioning ── */
  const sidebarPlaceholderRef = useRef(null);
  const [fixedStyle, setFixedStyle] = useState(null);

  useLayoutEffect(() => {
    if (loading) return;

    const calc = () => {
      if (!sidebarPlaceholderRef.current) return;
      const r = sidebarPlaceholderRef.current.getBoundingClientRect();
      setFixedStyle((prev) => {
        const next = {
          position: 'fixed',
          top: 28,
          left: r.left,
          width: 340,
          zIndex: 20,
        };
        if (prev && prev.left === next.left && prev.top === next.top && prev.width === next.width) return prev;
        return next;
      });
    };

    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('scroll', calc, { capture: true });
    };
  }, [loading]);

  useEffect(() => {
    if (isEdit) {
      voucherAPI.getOne(id)
        .then((res) => {
          const v = res.data.voucher;
          setForm({ ...v, expiryDate: v.expiryDate ? new Date(v.expiryDate).toISOString().split('T')[0] : '' });
        })
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setNum   = (key) => (e) => {
    const raw = e.target.value;
    setForm({ ...form, [key]: raw === '' ? null : Number(raw) });
  };

  const handleSubmit = async (e, asDraft = false) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        isActive: asDraft ? false : form.isActive,
      };
      if (isEdit) { await voucherAPI.update(id, payload); toast.success('Voucher updated'); }
      else        { await voucherAPI.create(payload);     toast.success('Voucher created'); }
      navigate('/admin/vouchers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = () => CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label || form.category;
  const getValueDisplay  = () => {
    if (!form.discountValue) return 'RM0.00';
    return form.discountType === 'percentage' ? `${form.discountValue}% OFF` : `RM${Number(form.discountValue).toFixed(2)}`;
  };
  const getExpiryDisplay = () => {
    if (!form.expiryDate) return 'EXP: --/--/----';
    const d = new Date(form.expiryDate + 'T00:00:00');
    return `EXP: ${d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`;
  };

  /* ── Sidebar content (shared between placeholder & fixed) ── */
  const renderSidebarContent = () => (
    <>
      {/* Live Preview Card */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}>

        {/* Preview Header */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e2e2', backgroundColor: '#f4f4f3' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif' }}>Live Preview</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', animation: 'pp-pulse-dot 2s ease-in-out infinite' }} />
        </div>

        {/* Preview Content */}
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Voucher Graphic */}
          <div style={{
            width: '100%', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)', padding: 18,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            aspectRatio: '1.8 / 1',
            background: 'linear-gradient(135deg, #022448 0%, #1e3a5f 100%)',
            color: '#ffffff', position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
          }}>
            <div style={{ position: 'absolute', right: '25%', top: 0, bottom: 0, borderLeft: '2px dashed rgba(255,255,255,0.18)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, opacity: 0.5 }}>loyalty</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>REWARD VALUE</div>
                <div style={{ fontSize: 22, fontFamily: 'Poppins, sans-serif', fontWeight: 700, lineHeight: 1.2 }}>{getValueDisplay()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ maxWidth: '60%' }}>
                <div style={{ fontSize: 10, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>{getCategoryLabel()}</div>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                  {form.title || 'Title of Reward Voucher'}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <span style={{ backgroundColor: '#ffc641', color: '#5c4300', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'Inter, sans-serif' }}>
                  {(form.pointsCost || 0).toLocaleString()} PTS
                </span>
                <span style={{ fontSize: 8, opacity: 0.55, fontFamily: 'Inter, sans-serif' }}>{getExpiryDisplay()}</span>
              </div>
            </div>
          </div>

          {/* Stock summary */}
          <div style={{ width: '100%', marginTop: 14, padding: '10px 14px', borderRadius: 8, backgroundColor: '#f7f7f6', border: '1px solid #ebebea', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#74777f' }}>inventory_2</span>
              <span style={{ fontSize: 12, color: '#43474e', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Stock limit</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: form.totalLimit ? '#022448' : '#74777f', fontFamily: 'Inter, sans-serif' }}>
              {form.totalLimit ? form.totalLimit.toLocaleString() : 'Unlimited'}
            </span>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#74777f', fontStyle: 'italic', marginTop: 14, lineHeight: 1.55, fontFamily: 'Inter, sans-serif' }}>
            "Institutional vouchers are generated with encrypted QR codes upon redemption."
          </p>
        </div>
      </div>

      {/* Point Valuation Tip */}
      <div style={{ borderRadius: 12, padding: 18, display: 'flex', gap: 14, backgroundColor: 'rgba(30,58,95,0.05)', border: '1px solid rgba(30,58,95,0.11)' }}>
        <span className="material-symbols-outlined" style={{ color: '#022448', fontSize: 20, flexShrink: 0, marginTop: 1 }}>info</span>
        <div>
          <h5 style={{ fontSize: 13, fontWeight: 700, color: '#022448', margin: '0 0 5px', fontFamily: 'Inter, sans-serif' }}>Point Valuation Tip</h5>
          <p style={{ fontSize: 12, color: '#43474e', lineHeight: 1.7, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Most successful redemptions follow a 1:50 ratio (RM1 = 50 points). Consider seasonal multipliers to drive engagement.
          </p>
        </div>
      </div>

      {/* Low stock warning */}
      {form.totalLimit !== null && form.totalLimit < 100 && (
        <div style={{ borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', backgroundColor: 'rgba(186,26,26,0.05)', border: '1px solid rgba(186,26,26,0.15)' }}>
          <span className="material-symbols-outlined" style={{ color: '#ba1a1a', fontSize: 18, flexShrink: 0, marginTop: 1 }}>warning</span>
          <p style={{ fontSize: 12, color: '#7a1010', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', fontWeight: 500, margin: 0 }}>
            Low stock limit set. Vouchers with less than 10% units may sell out quickly during campaigns.
          </p>
        </div>
      )}
    </>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '128px 0', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #022448', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#43474e', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Loading voucher data…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ════════════════ RENDER ════════════════ */
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pp-pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .fixed-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .fixed-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .fixed-sidebar-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .fixed-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>

      {/* ── Outer wrapper: title + grid stacked with consistent gap ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

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
          <button
            onClick={() => navigate('/admin/vouchers')}
            style={{ background: 'none', border: 'none', color: '#022448', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3a5f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#022448'; }}
          >
            Vouchers
          </button>
          <span style={{ color: '#c4c6cf' }}>/</span>
          <span style={{ color: '#1a1c1c', fontWeight: 600 }}>{isEdit ? 'Edit Voucher' : 'Add Voucher'}</span>
        </nav>

        {/* ── Page title ── */}
        <div>
          <h1 style={{ fontSize: 24, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#022448', lineHeight: 1.2, margin: 0 }}>
            {isEdit ? 'Edit Voucher' : 'Add Voucher'}
          </h1>
          <p style={{ fontSize: 13, color: '#74777f', margin: '3px 0 0' }}>
            {isEdit
              ? 'Update the details below and click "Save Changes" to apply.'
              : 'Fill in the details below and click "Save Voucher" to publish.'}
          </p>
        </div>

        {/* ── Main Grid: form (left) + sidebar placeholder (right) ── */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 28, alignItems: 'flex-start' }}>

          {/* ═══ LEFT: Form ═══ */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Main Card */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 14, boxShadow: '0 2px 16px rgba(30,58,95,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '28px 28px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  <SectionDivider title="Brand Details" />

                  {/* Title */}
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input type="text" value={form.title} onChange={setField('title')} placeholder="e.g. Starbucks, Amazon, Delta Airlines" required style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>

                  {/* Merchant + Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={labelStyle}>Merchant</label>
                      <input type="text" value={form.merchant} onChange={setField('merchant')} placeholder="e.g. Starbucks Corporation" style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <div style={{ position: 'relative' }}>
                        <select value={form.category} onChange={setField('category')} style={{ ...inputBase, cursor: 'pointer', appearance: 'none', paddingRight: 36 }} onFocus={inputFocus} onBlur={inputBlur}>
                          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#74777f', fontSize: 16 }}>▾</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={form.description} onChange={setField('description')} rows={2} placeholder="Briefly describe what this voucher offers..." style={{ ...inputBase, resize: 'vertical', minHeight: 68 }} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>

                  <SectionDivider title="Voucher Value" />

                  {/* Discount Type + Value */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={labelStyle}>Discount Type</label>
                      <div style={{ position: 'relative' }}>
                        <select value={form.discountType} onChange={setField('discountType')} style={{ ...inputBase, cursor: 'pointer', appearance: 'none', paddingRight: 36 }} onFocus={inputFocus} onBlur={inputBlur}>
                          {DISCOUNT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#74777f', fontSize: 16 }}>▾</span>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>{form.discountType === 'percentage' ? 'Discount (%)' : 'Voucher Value (RM)'}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#74777f', fontSize: 14, pointerEvents: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                          {form.discountType === 'percentage' ? '%' : 'RM'}
                        </span>
                        <input type="number" value={form.discountValue || ''} onChange={setNum('discountValue')} placeholder={form.discountType === 'percentage' ? '25' : '50.00'} style={{ ...inputBase, paddingLeft: form.discountType === 'percentage' ? 28 : 38 }} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>
                  </div>

                  {/* Original Price + Points Cost */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={labelStyle}>Original Price (RM)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#74777f', fontSize: 14, pointerEvents: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>RM</span>
                        <input type="number" value={form.originalPrice ?? ''} onChange={setNum('originalPrice')} placeholder="100.00" style={{ ...inputBase, paddingLeft: 38 }} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Redemption Point Cost</label>
                      <div style={{ position: 'relative' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#795900', fontSize: 19, fontVariationSettings: "'FILL' 1", pointerEvents: 'none' }}>stars</span>
                        <input type="number" value={form.pointsCost || ''} onChange={setNum('pointsCost')} placeholder="2,500" style={{ ...inputBase, paddingLeft: 38 }} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>
                  </div>

                  <SectionDivider title="Availability" />

                  {/* Expiry + Total Limit */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={labelStyle}>Expiry Date</label>
                      <input type="date" value={form.expiryDate} onChange={setField('expiryDate')} required style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Total Stock Limit
                        <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: '#74777f' }}>(blank = unlimited)</span>
                      </label>
                      <input type="number" value={form.totalLimit ?? ''} onChange={setNum('totalLimit')} placeholder="e.g. 500" min={1} style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>

                  {/* Per-User Limit */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={labelStyle}>Per-User Limit</label>
                      <input type="number" value={form.perUserLimit ?? ''} onChange={setNum('perUserLimit')} placeholder="1" min={1} style={inputBase} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                  </div>

                  <SectionDivider title="Terms" />

                  {/* Terms */}
                  <div>
                    <label style={labelStyle}>Terms & Conditions</label>
                    <textarea value={form.terms} onChange={setField('terms')} rows={4} placeholder="Enter specific redemption terms, blackout dates, and geographic restrictions..." style={{ ...inputBase, resize: 'vertical', minHeight: 100 }} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>

                </div>{/* end inner padding div */}

                {/* Toggles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, padding: '20px 28px 28px', marginTop: 8, borderTop: '1px solid #f0f0f0' }}>
                  <Toggle checked={form.isActive}   onChange={(val) => setForm({ ...form, isActive: val })}   label="Active"   />
                  <Toggle checked={form.isFeatured} onChange={(val) => setForm({ ...form, isFeatured: val })} label="Featured" />
                </div>
              </div>{/* end Main Card */}

              {/* Action Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 16, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => navigate('/admin/vouchers')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#74777f', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s', padding: '11px 0' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ba1a1a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#74777f'; }}
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '11px 36px', fontSize: 14, fontWeight: 700, borderRadius: 8, border: 'none', backgroundColor: '#022448', color: '#ffffff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 14px rgba(2,36,72,0.28)', opacity: saving ? 0.7 : 1, transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(2,36,72,0.38)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(2,36,72,0.28)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  onMouseDown={(e) => { if (!saving) e.currentTarget.style.transform = 'translateY(0) scale(0.96)'; }}
                  onMouseUp={(e)   => { if (!saving) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                >
                  {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Voucher'}
                </button>
              </div>

            </form>
          </div>{/* end LEFT */}

          {/* ═══ RIGHT: Placeholder to reserve grid space ═══ */}
          <div
            ref={sidebarPlaceholderRef}
            style={{
              width: 340,
              flexShrink: 0,
              visibility: fixedStyle ? 'hidden' : 'visible',
            }}
          >
            {!fixedStyle && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {renderSidebarContent()}
              </div>
            )}
          </div>

        </div>{/* end Main Grid */}

      </div>{/* end Outer wrapper */}

      {/* ═══ FIXED SIDEBAR (portaled out of grid flow) ═══ */}
      {fixedStyle && (
        <div
          className="fixed-sidebar-scroll"
          style={{
            ...fixedStyle,
            maxHeight: 'calc(100vh - 56px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingTop: 75,
            paddingBottom: 28,
          }}
        >
          {renderSidebarContent()}
        </div>
      )}
    </>
  );
};

export default AddEditVoucher;