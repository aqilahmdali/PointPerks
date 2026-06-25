import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { redemptionAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import UserPageHeader from '../../components/layout/UserPageChrome';

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  brandGold: '#D4A017',
  secondary: '#795900',
  secondaryContainer: '#ffc641',
  secondaryFixed: '#ffdfa0',
  surface: '#f9f9f8',
  surfaceLow: '#f4f4f3',
  surfaceContainer: '#eeeeed',
  surfaceHigh: '#e8e8e7',
  surfaceHighest: '#e2e2e2',
  surfaceLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#43474e',
  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  onPrimary: '#ffffff',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  success: '#386a20',
  successBg: '#c4f0c4',
  warning: '#795900',
  warningBg: '#ffdfa0',
};

/* ── Uniform Styles for User Pages ─────────────────────────────── */
const styles = {
  pageContainer: {
    background: C.surface,
    minHeight: '100%',
    fontFamily: "'Inter', sans-serif",
    color: C.onSurface,
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
    background: C.surfaceLowest,
    border: `1px solid ${C.outlineVariant}`,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
  },
};

const TABS = [
  { label: 'All', status: undefined },
  { label: 'Active', status: 'active' },
  { label: 'Used', status: 'used' },
  { label: 'Cancelled', status: 'cancelled' },
];

const MyRedemptions = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    redemptionAPI.getMy({ status: TABS[tab].status, limit: 50 })
      .then((res) => setRedemptions(res.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async (id) => {
    try {
      await redemptionAPI.cancel(id);
      toast.success('Redemption cancelled, points refunded');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  const handleViewPDF = (id) => {
    navigate(`/my-redemptions/${id}/pdf`);
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { bg: C.successBg, color: C.success, label: 'Active', icon: 'check_circle' };
      case 'used':
        return { bg: C.surfaceHighest, color: C.onSurfaceVariant, label: 'Used', icon: 'check_circle' };
      case 'cancelled':
      case 'expired':
        return { bg: C.errorContainer, color: C.error, label: status.charAt(0).toUpperCase() + status.slice(1), icon: 'event_busy' };
      default:
        return { bg: C.surfaceHighest, color: C.onSurfaceVariant, label: status, icon: 'info' };
    }
  };

  const ms = (size = 20, fill = 0) => ({
    fontFamily: "'Material Symbols Outlined'",
    fontSize: size,
    fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
    lineHeight: 1,
    display: 'inline-block',
    verticalAlign: 'middle',
  });

  return (
    <div style={styles.pageContainer}>
      
      {/* BREADCRUMB */}
      <nav style={styles.breadcrumb}>
        <button onClick={() => navigate('/dashboard')} style={styles.breadcrumbLink}>
          <span style={ms(16, 0)}>home</span>
          Home
        </button>
        <span style={{ color: C.outlineVariant }}>/</span>
        <span style={{ color: C.onSurface, fontWeight: 600 }}>My Redemptions</span>
      </nav>

      {/* PLAIN HEADER (No Card) */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Redemptions</h1>
        <p style={styles.subtitle}>Manage and view all your claimed rewards in one place.</p>
      </div>

      {/* Stats Bar (Bento-lite) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40, marginTop: 32 }} className="pp-stats-grid">
        <div className="pp-stat-card" style={styles.uniformCard}>
          <p className="pp-stat-label">Total Redeemed</p>
          <p className="pp-stat-value">{redemptions.length || 0} Vouchers</p>
        </div>
        <div className="pp-stat-card" style={styles.uniformCard}>
          <p className="pp-stat-label">Points Spent</p>
          <p className="pp-stat-value">
            {redemptions
              .filter((r) => r.status === 'active' || r.status === 'used')
              .reduce((acc, r) => acc + (r.pointsUsed || 0), 0)
              .toLocaleString()} pts
          </p>
        </div>
        <div className="pp-stat-card" style={styles.uniformCard}>
          <p className="pp-stat-label">Active Now</p>
          <p className="pp-stat-value" style={{ color: C.secondary }}>{redemptions.filter(r => r.status === 'active').length} Vouchers</p>
        </div>
        <div style={{ ...styles.uniformCard, background: C.primaryContainer, color: C.onPrimary, padding: 24, border: `1px solid ${C.primary}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, margin: '0 0 4px' }}>Next Reward At</p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 600, margin: 0 }}>15,000 pts</p>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.2)', height: 6, borderRadius: 999, marginTop: 12 }}>
              <div style={{ width: '80%', background: C.secondaryFixed, height: '100%', borderRadius: 999 }} />
            </div>
          </div>
          <span style={{ ...ms(80), position: 'absolute', right: -10, bottom: -10, opacity: 0.1 }}>auto_awesome</span>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.outlineVariant}`, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setTab(i)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: tab === i ? `2px solid ${C.primary}` : '2px solid transparent',
              color: tab === i ? C.primary : C.onSurfaceVariant,
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 260, background: C.surfaceContainer, borderRadius: 12, ...styles.uniformCard }} className="pp-skeleton-pulse" />
          ))}
        </div>
      ) : redemptions.length === 0 ? (
        <div 
          onClick={() => navigate('/vouchers')} 
          className="pp-empty-state"
          style={{ 
            ...styles.uniformCard,
            background: `${C.surfaceLow}80`, 
            border: `2px dashed ${C.outlineVariant}`, 
            padding: 48, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.surfaceHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <span style={ms(32, 0)}>add_shopping_cart</span>
          </div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", color: C.primary, fontSize: 18, margin: '0 0 4px' }}>Redeem New Voucher</h3>
          <p style={{ color: C.onSurfaceVariant, fontSize: 14, margin: 0 }}>Browse the marketplace for more rewards.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }} className="pp-red-grid">
          {redemptions.map((r) => {
            const statusInfo = getStatusStyle(r.status);
            const isUsed = r.status === 'used';
            const isCancelled = r.status === 'cancelled' || r.status === 'expired';

            return (
              <div 
                key={r._id} 
                className="pp-ticket-card" 
                style={{ 
                  ...styles.uniformCard,
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  opacity: isUsed || isCancelled ? 0.75 : 1,
                  filter: isUsed ? 'grayscale(0.8)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {/* Top Section */}
                <div style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: C.surfaceHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {r.qrCodeData ? (
                        <img src={r.qrCodeData} alt="QR" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                      ) : (
                        <span style={ms(24, 1)}>confirmation_number</span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "'Poppins', sans-serif", color: C.primary, fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>
                        {r.voucher?.title || 'Unknown Voucher'}
                      </h3>
                      <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>
                        Redeemed {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '4px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={ms(12, 1)}>{statusInfo.icon}</span>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Middle Section */}
                <div style={{ padding: '0 24px 24px', flexGrow: 1 }}>
                  <p style={{ color: C.onSurfaceVariant, fontSize: 14, margin: '0 0 16px' }}>
                    {r.voucher?.merchant}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceLow, borderRadius: 8, padding: 12, border: `1px dashed ${C.outlineVariant}` }}>
                    <span style={{ fontFamily: 'monospace', color: isCancelled ? C.outline : C.primary, fontWeight: 700, letterSpacing: '0.1em', fontSize: 14, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                      {r.redemptionCode}
                    </span>
                    <button onClick={() => handleCopyCode(r.redemptionCode, r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: copiedId === r._id ? C.success : C.primary }}>
                      <span style={ms(20)}>{copiedId === r._id ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Section */}
                <div style={{ background: `${C.surfaceLow}50`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.outlineVariant}50` }}>
                  <span style={{ fontSize: 14, color: C.onSurfaceVariant }}>
                    <span style={{ fontWeight: 700, color: C.primary }}>{r.pointsUsed?.toLocaleString() || 0}</span> points used
                  </span>
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleViewPDF(r._id)} 
                      className="pp-action-btn"
                      style={{ color: C.primary, borderColor: C.outlineVariant }}
                    >
                      <span style={ms(16)}>picture_as_pdf</span>
                      View PDF
                    </button>
                    {r.status === 'active' && (
                      <button 
                        onClick={() => handleCancel(r._id)} 
                        className="pp-action-btn"
                        style={{ color: C.error, borderColor: C.errorContainer }}
                      >
                        <span style={ms(16)}>close</span>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Decorative Side Cutouts */}
                <div style={{ position: 'absolute', top: '50%', left: '-8px', transform: 'translateY(-50%)', width: 16, height: 16, background: C.surface, borderRadius: '50%', borderRight: `1px solid ${C.outlineVariant}` }} />
                <div style={{ position: 'absolute', top: '50%', right: '-8px', transform: 'translateY(-50%)', width: 16, height: 16, background: C.surface, borderRadius: '50%', borderLeft: `1px solid ${C.outlineVariant}` }} />
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .pp-btn-primary {
          background: ${C.primary};
          color: ${C.onPrimary};
          border: none;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0px 4px 20px rgba(30, 58, 95, 0.04);
        }
        .pp-btn-primary:hover {
          background: ${C.primaryContainer};
          box-shadow: 0 8px 24px rgba(2, 36, 72, 0.15);
        }

        /* Updated to strictly follow uniformCard shadow/border */
        .pp-stat-card {
          padding: 24px;
        }
        .pp-stat-label {
          font-size: 12px;
          textTransform: uppercase;
          letter-spacing: 0.08em;
          color: ${C.onSurfaceVariant};
          margin: 0 0 4px;
          font-weight: 600;
        }
        .pp-stat-value {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: ${C.primary};
          margin: 0;
        }

        .pp-skeleton-pulse {
          animation: pp-pulse 1.5s infinite ease-in-out;
        }
        @keyframes pp-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }

        .pp-empty-state:hover {
          background: ${C.surfaceContainer} !important;
        }

        .pp-ticket-card:hover {
          transform: translateY(-4px);
          box-shadow: 0px 12px 32px rgba(30, 58, 95, 0.1) !important;
        }

        .pp-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: 1px solid;
          border-radius: 6px;
          padding: 6px 10px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pp-action-btn:hover {
          background: ${C.surfaceLow};
        }

        @media (max-width: 1024px) {
          .pp-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="padding: 32px 48px"] {
            padding: 24px 16px !important;
          }
        }
        @media (max-width: 600px) {
          .pp-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .pp-red-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MyRedemptions;