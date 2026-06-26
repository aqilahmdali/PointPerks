//UserDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { voucherAPI, redemptionAPI } from '../../services/api';
import { formatDiscount } from '../../utils/helpers';

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  brandGold: '#D4A017',
  secondary: '#795900',
  secondaryContainer: '#ffc641',
  surface: '#f9f9f8',
  surfaceLow: '#f4f4f3',
  surfaceContainer: '#eeeeed',
  surfaceContainerHighest: '#e2e2e2',
  surfaceLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#43474e',
  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  onPrimary: '#ffffff',
  error: '#ba1a1a',
  success: '#386a20',
  successBg: '#c4f0c4',
};

/* ── Shared styles (no container padding — layout handles that) ── */
const S = {
  header: { marginBottom: 28 },
  title: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: C.primary,
    margin: 0,
  },
  uniformCard: {
    background: C.surfaceLowest,
    border: `1px solid ${C.outlineVariant}`,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
  },
  sectionTitle: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 20,
    fontWeight: 600,
    color: C.primary,
    margin: 0,
  },
  textButton: {
    background: 'none',
    border: 'none',
    color: C.primary,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
  },
};

/* ── Material Symbols helper ── */
const ms = (size = 24, fill = 0) => ({
  fontFamily: "'Material Symbols Outlined'",
  fontSize: size,
  fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
  lineHeight: 1,
  display: 'inline-block',
  verticalAlign: 'middle',
});

/* ════════════════════════════════════════════════════════ */
const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      voucherAPI.getAll({ featured: 'true', limit: 4 }),
      redemptionAPI.getMy({ limit: 3 }),
    ]).then(([vRes, rRes]) => {
      setFeatured(vRes.data.data || []);
      setRecentRedemptions(rRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'User';
  const pointsBalance = user?.points?.toLocaleString() || '0';

  const handleCopyCode = () => {
    const code = user?.referralCode;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error("Failed to copy: ", err));
    }
  };

  return (
    <div>
      <style>{`
        .pp-pulse-btn { animation: pp-pulse-gold 2.5s infinite; transition: all 0.2s; }
        .pp-pulse-btn:hover { background: #e8b21c !important; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(212, 160, 23, 0.4) !important; }
        @keyframes pp-pulse-gold {
          0%   { box-shadow: 0 4px 12px rgba(212, 160, 23, 0.3), 0 0 0 0 rgba(212, 160, 23, 0.3); }
          70%  { box-shadow: 0 4px 12px rgba(212, 160, 23, 0.3), 0 0 0 10px rgba(212, 160, 23, 0); }
          100% { box-shadow: 0 4px 12px rgba(212, 160, 23, 0.3), 0 0 0 0 rgba(212, 160, 23, 0); }
        }
        .pp-copy-card { cursor: pointer; transition: all 0.2s ease; }
        .pp-copy-card:hover { border-color: ${C.brandGold} !important; box-shadow: 0 4px 12px rgba(212,160,23,0.1); }
        .pp-redemption-item { transition: all 0.2s; }
        .pp-redemption-item:hover { background: ${C.surfaceContainer} !important; border-color: ${C.outlineVariant} !important; }
        .pp-voucher-carousel-card { transition: transform 0.2s ease-out; }
        .pp-voucher-carousel-card:hover { transform: translateY(-4px); }
        .pp-carousel::-webkit-scrollbar { height: 6px; }
        .pp-carousel::-webkit-scrollbar-track { background: ${C.surfaceContainer}; border-radius: 10px; }
        .pp-carousel::-webkit-scrollbar-thumb { background: ${C.outlineVariant}; border-radius: 10px; }
      `}</style>

      {/* ── Header ── */}
      <div style={S.header}>
        <h1 style={S.title}>Welcome back, {firstName} 👋</h1>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }} className="pp-dash-grid">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="pp-dash-col-left" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Points Balance Card */}
          <div style={{
            position: 'relative', overflow: 'hidden', padding: '32px 28px', borderRadius: 16,
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 60%, #2a4f7a 100%)`,
            boxShadow: '0 12px 32px rgba(2, 36, 72, 0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(212,160,23,0.12)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', filter: 'blur(30px)' }} />

            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,160,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ ...ms(20, 1), color: C.brandGold }}>account_balance_wallet</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Wallet Balance
                </span>
              </div>

              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, color: C.onPrimary, margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {pointsBalance}
              </h3>
              <p style={{ fontWeight: 500, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px', fontSize: 14, letterSpacing: '0.02em' }}>
                Available Points
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/vouchers')}
                  className="pp-pulse-btn"
                  style={{ background: C.brandGold, color: '#1a1200', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,160,23,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ ...ms(18, 1) }}>redeem</span>
                  Redeem Now
                </button>
                <button
                  onClick={() => navigate('/referral')}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', borderRadius: 10, padding: '12px 20px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span style={{ ...ms(18, 0) }}>group_add</span>
                  Invite Friends
                </button>
              </div>
            </div>

            <div style={{ marginTop: 28, position: 'relative', zIndex: 10, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Progress to Gold Tier</span>
                <span style={{ color: C.brandGold, fontWeight: 700 }}>65%</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '65%', background: `linear-gradient(90deg, ${C.brandGold}, #f0c040)`, borderRadius: 999, boxShadow: '0 0 12px rgba(212,160,23,0.4)' }} />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ ...S.uniformCard, padding: 20 }}>
              <span style={{ ...ms(24), color: C.primary, marginBottom: 8, display: 'block' }}>confirmation_number</span>
              <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>Total Redemptions</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 600, color: C.primary, margin: '4px 0 0' }}>
                {recentRedemptions.length || 0}
              </p>
            </div>
            <div
              onClick={handleCopyCode}
              className="pp-copy-card"
              style={{ ...S.uniformCard, padding: 20, cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ ...ms(24), color: C.primary, display: 'block' }}>
                  {copied ? 'check_circle' : 'share'}
                </span>
                <span style={{ fontSize: 10, color: copied ? C.success : C.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.2s' }}>
                  {copied ? 'Copied!' : 'Click to copy'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>Referral Code</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 600, color: C.primary, margin: '4px 0 0' }}>
                {user?.referralCode || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="pp-dash-col-right" style={{ gridColumn: 'span 7', ...S.uniformCard, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h4 style={S.sectionTitle}>Recent Redemptions</h4>
            <button onClick={() => navigate('/my-redemptions')} style={S.textButton}>See All</button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 72, background: C.surfaceContainer, borderRadius: 8, opacity: 0.5 }} />)}
            </div>
          ) : recentRedemptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', border: `2px dashed ${C.outlineVariant}`, borderRadius: 12 }}>
              <span style={ms(48, 0)} className="material-symbols-outlined">inbox</span>
              <h5 style={{ fontFamily: "'Poppins', sans-serif", margin: '12px 0 4px', color: C.onSurface }}>No redemptions yet</h5>
              <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '0 0 16px' }}>Browse vouchers and redeem your first one to see it here.</p>
              <button onClick={() => navigate('/vouchers')} style={{ background: C.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Browse Vouchers
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentRedemptions.map((r) => (
                <div
                  key={r._id}
                  onClick={() => navigate('/my-redemptions')}
                  className="pp-redemption-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: C.surface, borderRadius: 8, cursor: 'pointer', border: '1px solid transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${C.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ ...ms(24), color: C.primary }}>confirmation_number</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: C.primary, margin: 0, fontSize: 15 }}>{r.voucher?.title || 'Unknown Voucher'}</p>
                      <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '4px 0 0', fontFamily: 'monospace' }}>Code: {r.redemptionCode}</p>
                    </div>
                  </div>
                  <span style={{ background: C.successBg, color: C.success, fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Success</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═ BOTTOM: Featured Vouchers ═ */}
        <div style={{ gridColumn: 'span 12', marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h4 style={S.sectionTitle}>Featured Vouchers</h4>
              <p style={{ color: C.onSurfaceVariant, fontSize: 14, margin: '4px 0 0' }}>Hand-picked rewards available for instant redemption.</p>
            </div>
            <button onClick={() => navigate('/vouchers')} style={S.textButton}>View All</button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: 24, overflowX: 'hidden' }}>
              {[1, 2, 3, 4].map(i => <div key={i} style={{ minWidth: 320, height: 224, background: C.surfaceContainer, borderRadius: 12 }} />)}
            </div>
          ) : featured.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', border: `2px dashed ${C.outlineVariant}`, borderRadius: 12, ...S.uniformCard }}>
              <span style={ms(48, 0)} className="material-symbols-outlined">ticket</span>
              <h5 style={{ fontFamily: "'Poppins', sans-serif", margin: '12px 0 4px', color: C.onSurface }}>No featured vouchers right now</h5>
              <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '0 0 16px' }}>Check back soon or browse the full catalog.</p>
              <button onClick={() => navigate('/vouchers')} style={{ background: C.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Browse All Vouchers</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 16, scrollSnapType: 'x mandatory' }} className="pp-carousel">
              {featured.map((v) => (
                <div
                  key={v._id}
                  onClick={() => navigate('/vouchers')}
                  className="pp-voucher-carousel-card"
                  style={{ minWidth: 320, height: 224, background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`, borderRadius: 12, padding: 24, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'center', boxShadow: '0px 8px 24px rgba(2, 36, 72, 0.15)', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />

                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <div style={{ background: C.brandGold, color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {formatDiscount(v.discountType, v.discountValue)}
                      </div>
                    </div>
                    <h5 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 600, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
                      {v.title}
                    </h5>
                    <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.merchant}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.3)', paddingTop: 16, position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Redemption Cost</p>
                      <p style={{ fontFamily: "'Poppins', sans-serif", margin: 0, fontSize: 20, fontWeight: 700 }}>{v.pointsCost || 100} pts</p>
                    </div>
                    <button style={{ background: '#fff', color: C.primary, border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Claim</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;