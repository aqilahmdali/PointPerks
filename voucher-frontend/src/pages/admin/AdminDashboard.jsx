import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { voucherAPI, redemptionAPI } from '../../services/api';
import { formatDiscount } from '../../utils/helpers';

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  primary: '#022448',
  primaryHover: '#0a3a6b',
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

/* ── Stagger hook ── */
function useStagger(idx = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { el.classList.add('pp-visible'); return; }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('pp-visible'), idx * 70);
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [idx]);
  return ref;
}

/* ── Count Up Hook ── */
function useCountUp(end, duration = 1400, isActive = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!isActive || !end) return;
    let start = 0;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, isActive]);

  return count;
}

/* ════════════════════════════════════════════════════════ */
const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const sHeader = useStagger(0);
  const sBalance = useStagger(1);
  const sStat1 = useStagger(2);
  const sStat2 = useStagger(3);
  const sRedemptions = useStagger(4);
  const sFeatHead = useStagger(5);
  const sCarousel = useStagger(6);

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
  const rawPoints = user?.points || 0;
  const animatedPoints = useCountUp(rawPoints, 1400, !loading);

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
    <div className="pp-dash-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .pp-dash-root {
          font-family: 'Inter', system-ui, sans-serif;
          color: ${C.onSurface};
          -webkit-font-smoothing: antialiased;
          /* FIX: Changed from overflow-x: hidden to clip. 
             'hidden' creates a new formatting context that breaks 
             vertical scrolling when inside a flex parent (like a dashboard layout). 
             'clip' hides horizontal overflow without breaking the Y-axis scroll. */
          overflow-x: clip; 
          min-height: 0; /* FIX: Ensures it can shrink inside a flex column if needed */
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          user-select: none;
        }

        /* ══════════════════════════════════════════
           KEYFRAMES & ENTRANCES
           ══════════════════════════════════════════ */
        .pp-anim {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.5s cubic-bezier(0.22,1,0.36,1),
                      transform 0.5s cubic-bezier(0.22,1,0.36,1);
          will-change: opacity, transform;
        }
        .pp-anim.pp-visible { opacity: 1; transform: translateY(0); }

        @keyframes pp-fillBar {
          from { width: 0%; }
          to { width: 65%; }
        }
        .pp-progress-fill {
          animation: pp-fillBar 1.2s cubic-bezier(0.22,1,0.36,1) 0.5s both;
        }

        @keyframes pp-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .pp-skeleton {
          background: linear-gradient(90deg, ${C.surfaceContainer} 25%, ${C.surfaceContainerHighest} 50%, ${C.surfaceContainer} 75%);
          background-size: 200% 100%;
          animation: pp-shimmer 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes pp-pulse-gold {
          0%   { box-shadow: 0 4px 12px rgba(212, 160, 23, 0.3), 0 0 0 0 rgba(212, 160, 23, 0.3); }
          70%  { box-shadow: 0 4px 12px rgba(212, 160, 23, 0.3), 0 0 0 10px rgba(212, 160, 23, 0); }
          100% { box-shadow: 0 4px 12px rgba(212, 160, 23, 0.3), 0 0 0 0 rgba(212, 160, 23, 0); }
        }
        @keyframes pp-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        /* ══════════════════════════════════════════
           LAYOUT
           ══════════════════════════════════════════ */
        .pp-dash-header { margin-bottom: 28px; }
        .pp-dash-title {
          font-family: 'Poppins', sans-serif;
          font-size: 28px; font-weight: 700;
          color: ${C.primary};
        }
        .pp-dash-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        .pp-dash-col-left { grid-column: span 5; display: flex; flex-direction: column; gap: 24px; }
        .pp-dash-col-right { grid-column: span 7; }
        .pp-featured-section { 
          grid-column: span 12; 
          margin-top: 8px;
        }

         @media (max-width: 1024px) {
          .pp-dash-col-left, .pp-dash-col-right, .pp-featured-section { grid-column: span 12; }
        }

        /* ══════════════════════════════════════════
           HOVER ANIMATIONS
           ══════════════════════════════════════════ */

        /* Balance Card Buttons */
        .pp-btn-redeem {
          background: ${C.brandGold}; color: '#1a1200'; border: none;
          padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; /* Fixed missing px */
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 12px rgba(212,160,23,0.3);
          animation: pp-pulse-gold 2.5s infinite;
          transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .pp-btn-redeem:hover {
          background: #e8b21c; transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212,160,23,0.4);
        }
        .pp-btn-redeem:active { transform: translateY(0) scale(0.97); }

        .pp-btn-invite {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: #fff; font-weight: 600; font-size: 14px; cursor: pointer;
          border-radius: 10px; padding: 12px 20px; backdrop-filter: blur(8px);
          display: flex; align-items: center; gap: 6px;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s, transform 0.2s, border-color 0.2s;
        }
        .pp-btn-invite:hover {
          background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }
        .pp-btn-invite:active { transform: translateY(0) scale(0.97); }

        /* Stat Cards */
        .pp-stat-card {
          background: ${C.surfaceLowest}; border: 1px solid ${C.outlineVariant};
          border-radius: 12px; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
          border-left: 3px solid transparent;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s, border-color 0.3s, background 0.3s;
        }
        .pp-stat-card:hover {
          transform: translateY(-3px) translateX(2px);
          box-shadow: 0 6px 20px rgba(2,36,72,0.07);
          background: #fff;
          border-left-color: ${C.primary};
        }
        .pp-stat-card .material-symbols-outlined {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), color 0.3s;
        }
        .pp-stat-card:hover .material-symbols-outlined {
          color: ${C.secondary} !important; transform: scale(1.15);
        }
        .pp-copy-card { cursor: pointer; }
        .pp-copy-card:hover { border-left-color: ${C.brandGold} !important; }

        /* Right Column (Redemptions) */
        .pp-redemptions-card {
          background: ${C.surfaceLowest}; border: 1px solid ${C.outlineVariant};
          border-radius: 12px; padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
          transition: box-shadow 0.4s, border-color 0.4s;
        }
        @media (min-width: 1024px) {
          .pp-redemptions-card:hover {
            box-shadow: 0 8px 32px rgba(2,36,72,0.08);
            border-color: #b0b5be;
          }
        }

        .pp-list-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px; background: ${C.surface}; border-radius: 8px;
          cursor: pointer; border: 1px solid transparent;
          border-left: 3px solid transparent;
          transition: background 0.2s, border-color 0.3s, transform 0.2s, box-shadow 0.2s;
        }
        .pp-list-item:hover {
          background: ${C.surfaceContainer}; border-color: ${C.outlineVariant};
          border-left-color: ${C.primary};
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .pp-list-item .pp-item-icon {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .pp-list-item:hover .pp-item-icon { transform: scale(1.1) rotate(-5deg); }

        /* Featured Vouchers Carousel */
        .pp-carousel {
          width: 100%;
          display: flex;
          gap: 24px;
          overflow-x: auto;
          padding-bottom: 16px;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
        }
        .pp-carousel::-webkit-scrollbar { height: 6px; }
        .pp-carousel::-webkit-scrollbar-track { background: ${C.surfaceContainer}; border-radius: 10px; }
        .pp-carousel::-webkit-scrollbar-thumb { background: ${C.outlineVariant}; border-radius: 10px; transition: background 0.2s; }
        .pp-carousel::-webkit-scrollbar-thumb:hover { background: ${C.outline}; }

        .pp-voucher-card {
          min-width: 320px; height: 224px;
          background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%);
          border-radius: 12px; padding: 24px; color: #fff;
          display: flex; flex-direction: column; justify-content: space-between;
          cursor: pointer; position: relative; overflow: hidden;
          scroll-snap-align: start; flex-shrink: 0;
          box-shadow: 0px 8px 24px rgba(2, 36, 72, 0.15);
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s;
        }
        .pp-voucher-card:hover {
          transform: translateY(-6px);
          box-shadow: 0px 16px 40px rgba(2, 36, 72, 0.25);
        }
        .pp-voucher-card .pp-claim-btn {
          background: #fff; color: ${C.primary}; border: none;
          padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .pp-voucher-card:hover .pp-claim-btn {
          background: ${C.brandGold}; color: '#1a1200';
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(212,160,23,0.3);
        }

        /* Misc Link Hover */
        .pp-text-btn {
          background: none; border: none; color: ${C.primary};
          font-weight: 700; font-size: 14px; cursor: pointer; padding: 0;
          position: relative; font-family: 'Inter', sans-serif;
          transition: color 0.2s;
        }
        .pp-text-btn::after {
          content: ''; position: absolute;
          left: 0; bottom: -2px; width: 0; height: 1.5px;
          background: ${C.primary};
          transition: width 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .pp-text-btn:hover { color: ${C.primaryHover}; }
        .pp-text-btn:hover::after { width: 100%; }

        /* ══════════════════════════════════════════
           COMPONENT SPECIFICS
           ══════════════════════════════════════════ */
        
        /* Balance Card */
        .pp-balance-card {
          position: relative; overflow: hidden; padding: 32px 28px; border-radius: 16px;
          background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 60%, #2a4f7a 100%);
          box-shadow: 0 12px 32px rgba(2, 36, 72, 0.25);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .pp-balance-glow-1 {
          position: absolute; top: -30px; right: -30px; width: 140px; height: 140px;
          background: rgba(212,160,23,0.12); border-radius: 50%; filter: blur(40px);
        }
        .pp-balance-glow-2 {
          position: absolute; bottom: -20px; left: -20px; width: 100px; height: 100px;
          background: rgba(255,255,255,0.06); border-radius: 50%; filter: blur(30px);
        }
        .pp-points-val {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(36px, 5vw, 52px); font-weight: 800;
          color: ${C.onPrimary}; line-height: 1; letter-spacing: -0.02em;
          display: block; margin-bottom: 4px;
        }
        .pp-progress-track {
          width: 100%; height: 8px; background: rgba(255,255,255,0.1);
          border-radius: 999; overflow: hidden;
        }
        .pp-progress-fill {
          height: 100%; width: 65%;
          background: linear-gradient(90deg, ${C.brandGold}, #f0c040);
          border-radius: 999; box-shadow: 0 0 12px rgba(212,160,23,0.4);
          will-change: width;
        }
        .pp-section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px; font-weight: 600; color: ${C.primary};
        }

        /* Empty State */
        .pp-empty-state {
          text-align: center; padding: 48px 16px;
          border: 2px dashed ${C.outlineVariant}; border-radius: 12px;
          transition: border-color 0.3s, background 0.3s;
        }
        .pp-empty-state:hover {
          border-color: ${C.outline}; background: ${C.surfaceLow};
        }
        .pp-empty-btn {
          background: ${C.primary}; color: #fff; border: none;
          padding: 10px 20px; border-radius: 8px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .pp-empty-btn:hover {
          background: ${C.primaryHover}; transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2,36,72,0.2);
        }

        /* ══════════════════════════════════════════
           REDUCED MOTION
           ══════════════════════════════════════════ */
        @media (prefers-reduced-motion: reduce) {
          .pp-anim { opacity: 1 !important; transform: none !important; transition: none !important; }
          .pp-progress-fill { animation: none !important; width: 65% !important; }
          .pp-skeleton { animation: none !important; background: ${C.surfaceContainer} !important; }
          .pp-btn-redeem { animation: none !important; }
          *, *::before, *::after { transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="pp-dash-header pp-anim" ref={sHeader}>
        <h1 className="pp-dash-title">Welcome back, {firstName} 👋</h1>
      </div>

      {/* ── Main Grid ── */}
      <div className="pp-dash-grid">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="pp-dash-col-left">

          {/* Points Balance Card */}
          <div className="pp-balance-card pp-anim" ref={sBalance}>
            <div className="pp-balance-glow-1" />
            <div className="pp-balance-glow-2" />

            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,160,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24", color: C.brandGold }}>account_balance_wallet</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Wallet Balance
                </span>
              </div>

              <span className="pp-points-val">{animatedPoints.toLocaleString()}</span>
              <p style={{ fontWeight: 500, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px', fontSize: 14, letterSpacing: '0.02em' }}>
                Available Points
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/vouchers')} className="pp-btn-redeem">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>redeem</span>
                  Redeem Now
                </button>
                <button onClick={() => navigate('/referral')} className="pp-btn-invite">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group_add</span>
                  Invite Friends
                </button>
              </div>
            </div>

            <div style={{ marginTop: 28, position: 'relative', zIndex: 10, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Progress to Gold Tier</span>
                <span style={{ color: C.brandGold, fontWeight: 700 }}>65%</span>
              </div>
              <div className="pp-progress-track">
                <div className="pp-progress-fill" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="pp-stat-card pp-anim" ref={sStat1}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.primary, marginBottom: 8, display: 'block' }}>confirmation_number</span>
              <p style={{ fontSize: 12, color: C.onSurfaceVariant }}>Total Redemptions</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 600, color: C.primary, margin: '4px 0 0' }}>
                {recentRedemptions.length || 0}
              </p>
            </div>
            <div onClick={handleCopyCode} className="pp-stat-card pp-copy-card pp-anim" ref={sStat2}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: copied ? C.success : C.primary, display: 'block' }}>
                  {copied ? 'check_circle' : 'share'}
                </span>
                <span style={{ fontSize: 10, color: copied ? C.success : C.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.2s' }}>
                  {copied ? 'Copied!' : 'Click to copy'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.onSurfaceVariant }}>Referral Code</p>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 600, color: C.primary, margin: '4px 0 0' }}>
                {user?.referralCode || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="pp-dash-col-right pp-redemptions-card pp-anim" ref={sRedemptions}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h4 className="pp-section-title">Recent Redemptions</h4>
            <button onClick={() => navigate('/my-redemptions')} className="pp-text-btn">See All</button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} className="pp-skeleton" style={{ height: 72 }} />)}
            </div>
          ) : recentRedemptions.length === 0 ? (
            <div className="pp-empty-state">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.outline }}>inbox</span>
              <h5 style={{ fontFamily: "'Poppins', sans-serif", margin: '12px 0 4px', color: C.onSurface }}>No redemptions yet</h5>
              <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '0 0 16px' }}>Browse vouchers and redeem your first one to see it here.</p>
              <button onClick={() => navigate('/vouchers')} className="pp-empty-btn">Browse Vouchers</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentRedemptions.map((r) => (
                <div
                  key={r._id}
                  onClick={() => navigate('/my-redemptions')}
                  className="pp-list-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="pp-item-icon" style={{ width: 48, height: 48, borderRadius: '50%', background: `${C.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.primary }}>confirmation_number</span>
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
        <div className="pp-featured-section">
          <div className="pp-anim" ref={sFeatHead} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h4 className="pp-section-title">Featured Vouchers</h4>
              <p style={{ color: C.onSurfaceVariant, fontSize: 14, margin: '4px 0 0' }}>Hand-picked rewards available for instant redemption.</p>
            </div>
            <button onClick={() => navigate('/vouchers')} className="pp-text-btn">View All</button>
          </div>

          {loading ? (
            <div className="pp-carousel" style={{ overflowX: 'hidden' }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="pp-skeleton" style={{ minWidth: 320, height: 224, borderRadius: 12 }} />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="pp-empty-state pp-anim pp-visible" style={{ background: C.surfaceLowest, border: `2px dashed ${C.outlineVariant}` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.outline }}>ticket</span>
              <h5 style={{ fontFamily: "'Poppins', sans-serif", margin: '12px 0 4px', color: C.onSurface }}>No featured vouchers right now</h5>
              <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '0 0 16px' }}>Check back soon or browse the full catalog.</p>
              <button onClick={() => navigate('/vouchers')} className="pp-empty-btn">Browse All Vouchers</button>
            </div>
          ) : (
            /* Removed inline styles and applied them strictly in CSS to fix overflow issues */
            <div className="pp-carousel pp-anim" ref={sCarousel}>
              {featured.map((v) => (
                <div key={v._id} onClick={() => navigate('/vouchers')} className="pp-voucher-card">
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
                    <button className="pp-claim-btn" onClick={(e) => e.stopPropagation()}>Claim</button>
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