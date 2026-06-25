import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { voucherAPI, redemptionAPI } from '../../services/api';
import { updatePoints } from '../../store/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import { formatDiscount, formatDate, daysRemaining } from '../../utils/helpers';

// PointPerks Theme Colors
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  secondary: '#795900',
  secondaryContainer: '#ffc641',
  secondaryFixed: '#ffdfa0',
  tertiary: '#002252',
  tertiaryContainer: '#00377c',
  surface: '#f9f9f8',
  surfaceLow: '#f4f4f3',
  surfaceContainerLow: '#f4f4f3',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#e8e8e7',
  surfaceContainerHighest: '#e2e2e2',
  surfaceVariant: '#e2e2e2',
  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#43474e',
  white: '#ffffff',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  successBg: '#dcfce7',
  successText: '#166534',
};

/* ── Uniform Styles for User Pages ─────────────────────────────── */
const styles = {
  pageContainer: {
    background: C.surface,
    minHeight: '100%',
    fontFamily: "'Inter', sans-serif",
    color: C.onSurfaceVariant,
    padding: '32px 48px',
    maxWidth: 1400,
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    fontSize: 13,
    fontWeight: 500,
    color: C.onSurfaceVariant,
  },
  breadcrumbLink: {
    background: 'none',
    border: 'none',
    color: C.primary,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  header: { marginBottom: 32 },
  title: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: C.primary,
    margin: 0,
  },
  subtitle: {
    fontSize: 15,
    color: C.onSurfaceVariant,
    margin: '8px 0 0',
    lineHeight: 1.5,
  },
  uniformCard: {
    background: C.surfaceContainerLowest,
    border: `1px solid ${C.outlineVariant}`,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
  },
};

const categoryIconMap = {
  'Food & Dining': 'restaurant',
  'Shopping': 'shopping_bag',
  'Tech & Gadgets': 'devices',
  'Travel': 'flight',
  'Entertainment': 'movie',
  'Health & Wellness': 'fitness_center',
  'Groceries': 'local_grocery_store',
  'Fashion': 'checkroom',
  'Beauty': 'spa',
  'Education': 'school',
  'Default': 'confirmation_number',
};
const getCategoryIcon = (cat) => categoryIconMap[cat] || categoryIconMap.Default;

const ppStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
  
  .pp-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
  @media (min-width: 1280px) { .pp-grid { grid-template-columns: 2fr 1fr; } }
  
  .pp-col-left { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  .pp-col-right { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  @media (min-width: 1024px) { .pp-sticky { position: sticky; top: 80px; } }

  .pp-card-pad { padding: 24px; }

  /* Hero */
  .pp-hero { position: relative; overflow: hidden; border-radius: 12px; height: 400px; background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%); border: 1px solid ${C.outlineVariant}; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03); }
  .pp-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(2,36,72,0.95) 0%, rgba(2,36,72,0.4) 50%, transparent 100%); }
  .pp-hero-content { position: absolute; bottom: 0; left: 0; padding: 24px; display: flex; align-items: flex-end; gap: 24px; width: 100%; box-sizing: border-box; }
  .pp-hero-icon { width: 96px; height: 96px; border-radius: 8px; background: ${C.white}; box-shadow: 0 10px 15px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${C.primary}; }
  .pp-hero-text { flex: 1; padding-bottom: 8px; min-width: 0; }
  .pp-tag { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
  .pp-tag-amber { background: ${C.secondaryContainer}; color: #715300; }
  .pp-tag-red { background: ${C.errorContainer}; color: #93000a; }
  .pp-tag-white { background: rgba(255,255,255,0.2); color: ${C.white}; backdrop-filter: blur(4px); }
  
  .pp-title-xl { font-family: 'Poppins', sans-serif; font-size: 32px; font-weight: 600; line-height: 1.2; color: ${C.white}; margin: 0; word-break: break-word; }
  @media (min-width: 768px) { .pp-title-xl { font-size: 48px; } }
  .pp-subtitle { font-size: 18px; color: #adc8f5; margin-top: 4px; word-break: break-word; }

  /* Typography */
  .pp-header-flex { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; color: ${C.primary}; }
  .pp-title-md { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; color: ${C.primary}; margin: 0; }
  .pp-body-text { font-size: 16px; color: ${C.onSurfaceVariant}; line-height: 1.6; margin: 0; }

  .pp-info-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
  @media (min-width: 768px) { .pp-info-grid { grid-template-columns: 1fr 1fr; } }

  /* Action Card */
  .pp-action-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; gap: 16px; }
  .pp-label { font-size: 14px; font-weight: 500; color: ${C.onSurfaceVariant}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .pp-value-xl { font-family: 'Poppins', sans-serif; font-size: 40px; font-weight: 600; color: ${C.primary}; line-height: 1; word-break: break-word; }
  .pp-points { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; color: ${C.secondary}; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
  
  .pp-divider { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${C.outlineVariant}; font-size: 16px; }
  .pp-divider:last-of-type { border-bottom: none; }
  .pp-div-val { font-weight: 700; color: ${C.primary}; }
  .pp-status-tag { padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: ${C.secondaryContainer}; color: #715300; }
  .pp-status-active { background: ${C.tertiaryContainer}; color: #adc6ff; }
  .pp-status-expired { background: ${C.errorContainer}; color: #93000a; }
  .pp-status-unavail { background: ${C.surfaceContainerHighest}; color: ${C.onSurfaceVariant}; }

  /* Buttons */
  .pp-btn { width: 100%; padding: 16px; border-radius: 8px; font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; border: none; transition: all 0.2s; }
  .pp-btn-primary { background: ${C.primary}; color: ${C.white}; box-shadow: 0 10px 15px rgba(2,36,72,0.1); }
  .pp-btn-primary:hover { background: ${C.primaryContainer}; }
  .pp-btn:active { transform: scale(0.98); }
  .pp-btn:disabled { background: ${C.surfaceContainerHighest}; color: ${C.onSurfaceVariant}; cursor: not-allowed; transform: none; box-shadow: none; }
  .pp-btn-note { text-align: center; color: ${C.onSurfaceVariant}; font-size: 12px; font-weight: 600; margin-top: 16px; }
  .pp-btn-outline { border: 2px solid ${C.primary} !important; color: ${C.primary} !important; background: transparent; }
  .pp-btn-outline:hover { background: rgba(2,36,72,0.05); }

  /* Redeemed Voucher State */
  .voucher-card-gradient { background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%); padding: 24px; border-radius: 12px; color: ${C.white}; position: relative; overflow: hidden; }
  .voucher-blur { position: absolute; right: -32px; top: -32px; width: 128px; height: 128px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(20px); }
  .voucher-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 8px; }
  .voucher-label { color: #adc8f5; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .voucher-title { font-weight: 700; font-size: 24px; font-family: 'Poppins', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .voucher-body { background: ${C.white}; padding: 16px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 8px; }
  .voucher-qr-box { width: 160px; height: 160px; background: ${C.surfaceContainerHighest}; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
  .voucher-code-text { color: ${C.primary}; font-weight: 700; font-size: 24px; font-family: 'Poppins', sans-serif; letter-spacing: 0.1em; text-transform: uppercase; word-break: break-all; }
  .voucher-code-label { color: ${C.onSurfaceVariant}; font-size: 12px; font-weight: 600; }
  .cut-off-line { border-top: 2px dashed rgba(255, 255, 255, 0.2); position: relative; padding-top: 16px; display: flex; justify-content: space-between; color: #adc8f5; font-size: 12px; font-weight: 600; }
  .cut-off-line::before, .cut-off-line::after { content: ''; position: absolute; top: -11px; width: 20px; height: 20px; background: ${C.white}; border-radius: 50%; }
  .cut-off-line::before { left: -34px; }
  .cut-off-line::after { right: -34px; }
  @media (max-width: 560px) { .cut-off-line::before, .cut-off-line::after { display: none; } }

  /* Progress */
  .pp-progress-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; font-weight: 500; color: ${C.onSurfaceVariant}; }
  .pp-progress-bar { height: 8px; width: 100%; background: ${C.surfaceContainerHighest}; border-radius: 9999px; overflow: hidden; }
  .pp-progress-fill { height: 100%; background: ${C.secondaryContainer}; border-radius: 9999px; transition: width 0.5s ease; }

  /* Modal */
  .pp-modal-overlay { position: fixed; inset: 0; background: rgba(2, 36, 72, 0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; animation: pp-fade-in 0.2s ease; }
  .pp-modal { background: ${C.white}; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid ${C.outlineVariant}; width: 100%; max-width: 420px; padding: 24px; animation: pp-zoom-in 0.3s ease; }
  .pp-modal-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; color: ${C.primary}; }
  .pp-modal-title { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; margin: 0; }
  .pp-modal-body { color: ${C.onSurfaceVariant}; font-size: 16px; margin-bottom: 24px; line-height: 1.5; }
  .pp-modal-actions { display: flex; gap: 12px; }
  .pp-btn-outline-modal { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid ${C.outlineVariant}; background: transparent; color: ${C.onSurface}; font-weight: 500; cursor: pointer; transition: all 0.2s; font-size: 14px; }
  .pp-btn-outline-modal:hover { background: ${C.surfaceLow}; }

  /* Icons & Utilities */
  .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased; }
  .pp-skeleton { background: ${C.surfaceContainerHighest}; position: relative; overflow: hidden; border-radius: 12px; }
  .pp-skeleton::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); animation: pp-shimmer 1.5s infinite; }
  
  @keyframes pp-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
  @keyframes pp-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pp-zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes pp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const VoucherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [voucher, setVoucher] = useState(null);
  const [userRedemption, setUserRedemption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newRedemption, setNewRedemption] = useState(null);

  const ms = (size = 24, fill = 0) => ({
    fontFamily: "'Material Symbols Outlined'",
    fontSize: size,
    fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
    lineHeight: 1,
    display: 'inline-block',
    verticalAlign: 'middle',
  });

  const fetchVoucher = () => {
    setLoading(true);
    voucherAPI.getOne(id)
      .then((res) => {
        setVoucher(res.data.voucher);
        setUserRedemption(res.data.userRedemption);
      })
      .catch(() => toast.error('Voucher not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVoucher(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const res = await redemptionAPI.redeem(id);
      const redemption = res.data.redemption;
      setNewRedemption(redemption);
      dispatch(updatePoints(user.points - (voucher.pointsCost || 0)));
      setConfirmOpen(false);
      toast.success('Voucher redeemed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed');
      setConfirmOpen(false);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <style>{ppStyles}</style>
        <div className="pp-skeleton" style={{ height: '24px', width: '200px', marginBottom: '32px' }} />
        <div className="pp-grid">
          <div className="pp-col-left">
            <div className="pp-skeleton" style={{ height: '400px' }} />
            <div className="pp-info-grid">
              <div className="pp-skeleton" style={{ height: '200px' }} />
              <div className="pp-skeleton" style={{ height: '200px' }} />
            </div>
          </div>
          <div className="pp-col-right">
            <div className="pp-skeleton" style={{ height: '400px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!voucher) return null;

  const days = daysRemaining(voucher.expiryDate);
  const canAfford = user?.points >= voucher.pointsCost;
  const alreadyRedeemed = !!userRedemption;
  const activeRedemption = newRedemption || (alreadyRedeemed ? userRedemption : null);
  const hasInlineQR = !!(activeRedemption?.qrCodeData && activeRedemption?.redemptionCode);
  const expiringSoon = days >= 0 && days <= 7;
  const expired = days < 0;

  const termsList = voucher.terms
    ? Array.isArray(voucher.terms)
      ? voucher.terms
      : voucher.terms.split('\n').filter(Boolean).map((t) => t.replace(/^[•*-]\s*/, ''))
    : [];

  const progressPct = voucher.pointsCost > 0
    ? Math.min(100, Math.round(((user?.points || 0) / voucher.pointsCost) * 100))
    : 100;

  return (
    <div style={styles.pageContainer}>
      <style>{ppStyles}</style>
      
      {/* BREADCRUMB */}
      <nav style={styles.breadcrumb}>
        <button onClick={() => navigate('/dashboard')} style={styles.breadcrumbLink}>
          <span style={ms(16, 0)}>home</span>
          Home
        </button>
        <span style={{ color: C.outlineVariant }}>/</span>
        <button onClick={() => navigate('/vouchers')} style={styles.breadcrumbLink}>
          Vouchers
        </button>
        <span style={{ color: C.outlineVariant }}>/</span>
        <span style={{ color: C.onSurface, fontWeight: 600, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>
          {voucher.title}
        </span>
      </nav>

      {/* PLAIN HEADER (No Card) */}
      <div style={styles.header}>
        <h1 style={styles.title}>Voucher Detail</h1>
        <p style={styles.subtitle}>View voucher details, terms, and redeem your points.</p>
      </div>

      <div className="pp-grid">
        {/* Left Column */}
        <div className="pp-col-left">
          {/* Hero Section */}
          <div className="pp-hero">
            {voucher.image && (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${voucher.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            <div className="pp-hero-overlay" />
            
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {voucher.isFeatured && (
                <span className="pp-tag pp-tag-amber">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px', fontVariationSettings: "'FILL' 1" }}>star</span>
                  Featured
                </span>
              )}
              {expiringSoon && (
                <span className="pp-tag pp-tag-red">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>schedule</span>
                  Expires in {days} day{days !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="pp-hero-content">
              <div className="pp-hero-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>
                  {getCategoryIcon(voucher.category)}
                </span>
              </div>
              <div className="pp-hero-text">
                <span className="pp-tag pp-tag-white">{voucher.category}</span>
                <h1 className="pp-title-xl">{voucher.title}</h1>
                <p className="pp-subtitle">{voucher.merchant} · {formatDiscount(voucher.discountType, voucher.discountValue)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {voucher.description && (
            <div style={{ ...styles.uniformCard }} className="pp-card-pad">
              <div className="pp-header-flex">
                <span className="material-symbols-outlined">description</span>
                <h3 className="pp-title-md">About this voucher</h3>
              </div>
              <p className="pp-body-text">{voucher.description}</p>
            </div>
          )}

          {/* Info & Terms Grid */}
          <div className="pp-info-grid">
            <div style={{ ...styles.uniformCard }} className="pp-card-pad">
              <div className="pp-header-flex">
                <span className="material-symbols-outlined">info</span>
                <h3 className="pp-title-md">Redemption Info</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px', color: C.onSurfaceVariant, fontSize: '16px' }}>
                <li style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: C.primary, fontWeight: 700 }}>01.</span>
                  <span>Present the QR code at any {voucher.merchant} retail location or authorized dealer.</span>
                </li>
                <li style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: C.primary, fontWeight: 700 }}>02.</span>
                  <span>For online purchases, enter the unique alphanumeric code at checkout.</span>
                </li>
                <li style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: C.primary, fontWeight: 700 }}>03.</span>
                  <span>The discount will be instantly applied to your total basket amount.</span>
                </li>
              </ul>
            </div>

            <div style={{ ...styles.uniformCard }} className="pp-card-pad">
              <div className="pp-header-flex">
                <span className="material-symbols-outlined">gavel</span>
                <h3 className="pp-title-md">Terms &amp; Conditions</h3>
              </div>
              {termsList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: C.onSurfaceVariant, fontSize: '16px' }}>
                  {termsList.map((term, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: C.primary }}>•</span>
                      <p style={{ margin: 0 }}>{term}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pp-body-text" style={{ fontStyle: 'italic' }}>No specific terms listed for this voucher.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="pp-col-right">
          <div className="pp-sticky">
            {/* Action Card */}
            <div style={{ ...styles.uniformCard }} className="pp-card-pad">
              <div className="pp-action-row">
                <div style={{ minWidth: 0 }}>
                  <p className="pp-label">Total Value</p>
                  <h2 className="pp-value-xl">{formatDiscount(voucher.discountType, voucher.discountValue)}</h2>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p className="pp-label">Points Cost</p>
                  <div className="pp-points">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    <span>{voucher.pointsCost > 0 ? voucher.pointsCost.toLocaleString() : 'Free'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div className="pp-divider">
                  <span style={{ color: C.onSurfaceVariant }}>Voucher ID</span>
                  <span className="pp-div-val">{voucher.code || (voucher._id ? `VCH-${voucher._id.slice(-6).toUpperCase()}` : '—')}</span>
                </div>
                <div className="pp-divider">
                  <span style={{ color: C.onSurfaceVariant }}>Expires On</span>
                  <span className="pp-div-val" style={{ color: expiringSoon || expired ? C.error : C.primary }}>{formatDate(voucher.expiryDate)}</span>
                </div>
                <div className="pp-divider">
                  <span style={{ color: C.onSurfaceVariant }}>Remaining</span>
                  <span className="pp-div-val">{voucher.remainingCount != null ? voucher.remainingCount : 'Unlimited'}</span>
                </div>
                <div className="pp-divider">
                  <span style={{ color: C.onSurfaceVariant }}>Status</span>
                  {activeRedemption ? (
                    <span className="pp-status-tag pp-status-active">Active</span>
                  ) : expired ? (
                    <span className="pp-status-tag pp-status-expired">Expired</span>
                  ) : !voucher.isAvailable ? (
                    <span className="pp-status-tag pp-status-unavail">Unavailable</span>
                  ) : (
                    <span className="pp-status-tag">Not Redeemed</span>
                  )}
                </div>
              </div>

              {/* Action Buttons / States */}
              {activeRedemption && hasInlineQR ? (
                <div style={{ animation: 'pp-zoom-in 0.4s ease-out' }}>
                  <div className="voucher-card-gradient">
                    <div className="voucher-blur" />
                    <div className="voucher-head">
                      <div style={{ minWidth: 0 }}>
                        <p className="voucher-label">Active Voucher</p>
                        <p className="voucher-title">{voucher.title}</p>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: C.secondaryContainer, flexShrink: 0 }}>verified</span>
                    </div>
                    <div className="voucher-body">
                      <div className="voucher-qr-box">
                        <img src={activeRedemption.qrCodeData} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                      </div>
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <p className="voucher-code-text">{activeRedemption.redemptionCode}</p>
                        <p className="voucher-code-label">Voucher Code</p>
                      </div>
                    </div>
                    <div className="cut-off-line">
                      <span>{newRedemption ? 'Redeemed today' : (userRedemption?.redeemedAt ? formatDate(userRedemption.redeemedAt) : 'Redeemed')}</span>
                      <span>{voucher.merchant}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate('/my-redemptions')} className="pp-btn pp-btn-outline" style={{ marginTop: '24px' }}>
                    <span className="material-symbols-outlined">visibility</span>
                    View in My Redemptions
                  </button>
                </div>
              ) : activeRedemption ? (
                <div>
                  <button onClick={() => navigate('/my-redemptions')} className="pp-btn" style={{ background: C.tertiaryContainer, color: '#adc6ff' }}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    View in My Redemptions
                  </button>
                  <p className="pp-btn-note">You've already redeemed this voucher.</p>
                </div>
              ) : !voucher.isAvailable ? (
                <button className="pp-btn" disabled>
                  <span className="material-symbols-outlined">block</span>
                  No longer available
                </button>
              ) : expired ? (
                <button className="pp-btn" disabled>
                  <span className="material-symbols-outlined">timer_off</span>
                  Voucher expired
                </button>
              ) : !canAfford ? (
                <div>
                  <button className="pp-btn" disabled>
                    <span className="material-symbols-outlined">lock</span>
                    Need {(voucher.pointsCost - (user?.points || 0)).toLocaleString()} more pts
                  </button>
                  <p className="pp-btn-note">You have {(user?.points || 0).toLocaleString()} points.</p>
                </div>
              ) : (
                <div>
                  <button onClick={() => setConfirmOpen(true)} className="pp-btn pp-btn-primary">
                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                    Redeem Now
                  </button>
                  <p className="pp-btn-note">By clicking redeem, {voucher.pointsCost.toLocaleString()} points will be deducted from your wallet.</p>
                </div>
              )}
            </div>

                        {/* Progress Card */}
            <div style={{ ...styles.uniformCard }} className="pp-card-pad">
              <div className="pp-progress-head">
                <span>Your Balance</span>
                <span style={{ fontWeight: 700, color: C.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ color: C.secondary, fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>stars</span>
                  {(user?.points || 0).toLocaleString()} pts
                </span>
              </div>
              <div className="pp-progress-bar">
                <div className="pp-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontWeight: 600, color: C.onSurfaceVariant }}>
                {voucher.pointsCost === 0
                  ? 'This voucher is free to redeem.'
                  : canAfford
                    ? 'You have enough points to redeem this voucher.'
                    : `${(voucher.pointsCost - (user?.points || 0)).toLocaleString()} more points needed.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="pp-modal-overlay" onClick={() => !redeeming && setConfirmOpen(false)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-head">
              <span className="material-symbols-outlined">confirmation_number</span>
              <h3 className="pp-modal-title">Confirm redemption</h3>
            </div>
            <p className="pp-modal-body">
              This will use <strong style={{ color: C.primary }}>{voucher.pointsCost.toLocaleString()} points</strong> from
              your balance of {(user?.points || 0).toLocaleString()} points. This action cannot be undone, but you can cancel for a refund later.
            </p>
            <div className="pp-modal-actions">
              <button onClick={() => setConfirmOpen(false)} disabled={redeeming} className="pp-btn-outline-modal">
                Cancel
              </button>
              <button onClick={handleRedeem} disabled={redeeming} className="pp-btn pp-btn-primary" style={{ flex: 1, fontSize: '14px', padding: '12px' }}>
                {redeeming ? (
                  <>
                    <span className="material-symbols-outlined" style={{ animation: 'pp-spin 1s linear infinite' }}>progress_activity</span>
                    Processing...
                  </>
                ) : (
                  'Confirm redeem'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { 
          div[style*="padding: 32px 48px"] { padding: 24px 16px !important; } 
        }
      `}</style>
    </div>
  );
};

export default VoucherDetail;