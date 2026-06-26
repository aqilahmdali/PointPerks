import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, redemptionAPI, analyticsAPI } from '../../services/api';

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS & HELPERS
══════════════════════════════════════════════════════════ */
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  primarySoft: '#d5e3ff',
  gold: '#ffc641',
  goldDark: '#795900',
  goldSoft: '#fef3c7',
  surface: '#f9f9f8',
  surfaceHigh: '#f4f4f3',
  surfaceHighest: '#e8e8e7',
  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#43474e',
  white: '#ffffff',
  error: '#ba1a1a',
  success: '#166534',
  successBg: '#dcfce7',
  warning: '#854d0e',
  warningBg: '#fef9c3',
  purple: '#6b21a8',
  purpleSoft: '#f3e8ff',
  teal: '#0e7490',
  tealSoft: '#ccfbf1',
};

const formatLargeNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
};

const pad2 = (value) => String(value).padStart(2, '0');
const dateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const monthKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const parseSeriesDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(String(value))) {
    const [year, month] = String(value).split('-').map(Number);
    return new Date(year, month - 1, 1);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getChartConfig = (period) => {
  if (period === 'Year to Date') return { apiPeriod: 'monthly', days: 366, bucket: 'month' };
  if (period === 'Last 30 Days') return { apiPeriod: 'daily', days: 30, bucket: 'day' };
  return { apiPeriod: 'daily', days: 7, bucket: 'day' };
};

const buildChartBars = (series = [], period = 'Last 30 Days') => {
  const { bucket, days } = getChartConfig(period);
  const counts = new Map();

  series.forEach((item) => {
    const d = parseSeriesDate(item.date || item.month || item._id || item.createdAt || item.updatedAt);
    if (!d) return;
    const key = bucket === 'month' ? monthKey(d) : dateKey(d);
    counts.set(key, (counts.get(key) || 0) + (Number(item.count) || 1));
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];

  if (bucket === 'month') {
    const start = new Date(today.getFullYear(), 0, 1);
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = monthKey(cursor);
      buckets.push({
        key, label: cursor.toLocaleDateString('en-US', { month: 'short' }),
        highlight: key === monthKey(today), count: counts.get(key) || 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dateKey(d);
      buckets.push({
        key,
        label: days <= 14 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        highlight: key === dateKey(today), count: counts.get(key) || 0,
      });
    }
  }

  const max = Math.max(...buckets.map((b) => b.count), 1);
  return buckets.map((bar) => ({ ...bar, height: Math.round((bar.count / max) * 85) + 5 }));
};

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */
const AnimatedValue = ({ value, duration = 1400, animate = false, decimals = 0, formatter }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!animate || value == null) { setDisplay(value ?? 0); return; }
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numVal)) { setDisplay(value); return; }
    let startTs = null;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(ease * numVal);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(numVal);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, animate, duration]);
  const formatted = decimals > 0 ? Number(display).toFixed(decimals) : Math.floor(display);
  return <>{formatter ? formatter(formatted) : Number(formatted).toLocaleString()}</>;
};

const Skeleton = ({ style }) => (
  <div style={{ ...style, background: 'linear-gradient(90deg,#e8e8e7 25%,#f4f4f3 50%,#e8e8e7 75%)', backgroundSize: '200% 100%', animation: 'skPulse 1.5s ease-in-out infinite', borderRadius: style?.borderRadius ?? 16 }} />
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: C.warningBg, color: C.warning, label: 'Pending' },
    success: { bg: C.successBg, color: C.success, label: 'Success' },
    active: { bg: C.successBg, color: C.success, label: 'Active' },
    expired: { bg: '#fee2e2', color: '#991b1b', label: 'Expired' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  };
  const s = styles[status?.toLowerCase()] || { bg: '#f0f0f0', color: C.outline, label: status };
  return <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif', backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const RedemptionAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('Last 30 Days');

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRedemptions, setTotalRedemptions] = useState(0);
  const [totalPointsRedeemed, setTotalPointsRedeemed] = useState(0);
  const [avgPointsPerRedemption, setAvgPointsPerRedemption] = useState(0);
  const [conversionRate, setConversionRate] = useState('0.0');
  const [uniqueRedeemingUsers, setUniqueRedeemingUsers] = useState(0);
  const [chartBars, setChartBars] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [recentRedemptions, setRecentRedemptions] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnimated(false);
    try {
      const chartConfig = getChartConfig(chartPeriod);
      const [usersRes, redemptionsRes, chartRes] = await Promise.all([
        userAPI.getAll({ limit: 1000 }),
        redemptionAPI.getAll({ limit: 1000 }),
        analyticsAPI.getRedemptionsOverTime({ period: chartConfig.apiPeriod, days: chartConfig.days }).catch(() => null),
      ]);

      const users = usersRes.data?.data ?? usersRes.data?.users ?? usersRes.data ?? [];
      setTotalUsers(users.length);

      const redemptions = redemptionsRes.data?.data ?? redemptionsRes.data?.redemptions ?? redemptionsRes.data ?? [];
      setTotalRedemptions(redemptions.length);

      const totalPts = redemptions.reduce((sum, r) => sum + (r.pointsUsed || 0), 0);
      setTotalPointsRedeemed(totalPts);
      setAvgPointsPerRedemption(redemptions.length > 0 ? Math.round(totalPts / redemptions.length) : 0);

      /* ── FIXED: count unique users who redeemed at least once ── */
      const uniqueUserIds = new Set(
        redemptions
          .map((r) => r.user?._id || r.userId?._id || r.userId || r.user)
          .filter(Boolean)
      );
      const uniqueCount = uniqueUserIds.size;
      setUniqueRedeemingUsers(uniqueCount);
      setConversionRate(users.length > 0 ? ((uniqueCount / users.length) * 100).toFixed(1) : '0.0');

      const catMap = {};
      redemptions.forEach(r => {
        const cat = r.voucher?.category || r.voucherId?.category || 'Uncategorized';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      setTopCategories(Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count], i) => ({ name, count, rank: i + 1 })));

      const chartSeries = chartRes?.data?.data || [];
      const fallbackSeries = redemptions.map((r) => ({ date: r.createdAt || r.updatedAt, count: 1 }));
      setChartBars(buildChartBars(chartSeries.length ? chartSeries : fallbackSeries, chartPeriod));

      setRecentRedemptions([...redemptions].sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt)).slice(0, 10).map(r => ({
        id: r._id, userName: r.user?.name ?? r.userId?.name ?? 'Unknown', voucherTitle: r.voucher?.title ?? r.voucherId?.title ?? 'Unknown',
        date: new Date(r.createdAt || r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: r.status, pointsUsed: r.pointsUsed || 0,
      })));
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
      setTimeout(() => setAnimated(true), 150);
    }
  }, [chartPeriod]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isYtd = chartPeriod === 'Year to Date';
  const maxCatCount = topCategories[0]?.count || 1;
  const chartTotal = chartBars.reduce((s, b) => s + b.count, 0);

  const baseCard = { backgroundColor: C.white, border: `1px solid ${C.outlineVariant}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.25s ease' };
  const hoverCard = { onMouseEnter: (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 36, 72, 0.08)'; }, onMouseLeave: (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'; } };

  /* ════ LOADING SKELETON ════ */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@keyframes skPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div>
        <Skeleton style={{ width: 280, height: 28, marginBottom: 8, borderRadius: 8 }} />
        <Skeleton style={{ width: 380, height: 16, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>{[1,2,3,4].map(i => <Skeleton key={i} style={{ height: 160 }} />)}</div>
      <Skeleton style={{ height: 420 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}><Skeleton style={{ height: 320 }} /><Skeleton style={{ height: 320 }} /></div>
      <Skeleton style={{ height: 480 }} />
    </div>
  );

  /* ════ ERROR ════ */
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16, backgroundColor: C.white, borderRadius: 16, border: '1px solid #fee2e2' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.error }}>error_outline</span>
      <p style={{ fontSize: 15, color: C.onSurfaceVariant, fontFamily: 'Inter, sans-serif' }}>{error}</p>
      <button onClick={fetchAll} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: C.white, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Retry</button>
    </div>
  );

  /* ════════════════ MAIN RENDER ════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes skPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeInRow{
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeInUp{
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }
        .pp-chart-tooltip { opacity: 0; transition: opacity 0.2s ease; pointer-events: none; }
        .pp-bar-wrap:hover .pp-chart-tooltip { opacity: 1; }
        .pp-bar-fill { transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease; }
        .pp-row-animate{opacity:0;animation:fadeInRow 0.4s ease forwards}
        .pp-cat-bar{transition:width 0.8s cubic-bezier(0.4,0,0.2,1)}
        .pp-insight-card{opacity:0;animation:fadeInUp 0.5s ease forwards}
      `}</style>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3a5f'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.primary; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1 }}>home</span>
          Home
        </button>
        <span style={{ color: C.outlineVariant }}>/</span>
        <span style={{ color: C.onSurface, fontWeight: 600 }}>Analytics</span>
      </nav>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: 0 }}>Redemption Analytics</h1>
          <p style={{ fontSize: 14, color: C.outline, margin: '4px 0 0' }}>Deep dive into redemption volumes, user behavior, and trends.</p>
        </div>

      </div>

      {/* ─── KPI CARDS ─── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: C.primarySoft, color: C.primary, display: 'inline-flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>receipt_long</span>
            </div>
            <span style={{ color: C.success, fontSize: 11, fontWeight: 600, backgroundColor: C.successBg, padding: '4px 8px', borderRadius: 6 }}>
              All time
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>Total Redemptions</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={totalRedemptions} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: C.outline, marginTop: 8 }}>Historical data</p>
        </div>

        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: C.goldSoft, color: C.goldDark, display: 'inline-flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>payments</span>
            </div>
            <span style={{ color: C.goldDark, fontSize: 11, fontWeight: 600, backgroundColor: C.goldSoft, padding: '4px 8px', borderRadius: 6 }}>
              Cumulative
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>Total Points Redeemed</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={totalPointsRedeemed} animate={animated} formatter={formatLargeNumber} />
          </h3>
          <p style={{ fontSize: 12, color: C.outline, marginTop: 8 }}>Points spent</p>
        </div>

        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: C.tealSoft, color: C.teal, display: 'inline-flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>query_stats</span>
            </div>
            <span style={{ color: C.teal, fontSize: 11, fontWeight: 600, backgroundColor: C.tealSoft, padding: '4px 8px', borderRadius: 6 }}>
              Average
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>Avg. Points / Redemption</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={avgPointsPerRedemption} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: C.outline, marginTop: 8 }}>Cost efficiency</p>
        </div>

        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: C.purpleSoft, color: C.purple, display: 'inline-flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>group</span>
            </div>
            <span style={{ color: C.purple, fontSize: 11, fontWeight: 600, backgroundColor: C.purpleSoft, padding: '4px 8px', borderRadius: 6 }}>
              {uniqueRedeemingUsers.toLocaleString()} of {totalUsers.toLocaleString()}
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>User Conversion Rate</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={parseFloat(conversionRate)} animate={animated} decimals={1} />%
          </h3>
          <p style={{ fontSize: 12, color: C.outline, marginTop: 8 }}>
            {uniqueRedeemingUsers.toLocaleString()} redeemed at least once
          </p>
        </div>
      </section>

      {/* ─── MAIN CHART ─── */}
      <section style={{ ...baseCard, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: 0 }}>Redemption Volume Over Time</h3>
            <p style={{ fontSize: 13, color: C.outline, margin: '4px 0 0' }}>
              {isYtd ? 'Monthly aggregation for the current year' : `Daily aggregation for the past ${chartPeriod.replace('Last ', '').toLowerCase()}`}
            </p>
          </div>
          <select value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)} style={{ backgroundColor: C.surfaceHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', padding: '8px 16px', cursor: 'pointer', color: C.onSurface, outline: 'none' }}>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Year to Date</option>
          </select>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', minHeight: 300 }}>
          <div style={{ position: 'absolute', inset: '0 0 36px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ width: '100%', height: 1, backgroundColor: C.surfaceHigh }} />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: isYtd ? 8 : 12, height: 280, position: 'relative', zIndex: 1, overflowX: 'auto', paddingBottom: 4, minWidth: isYtd ? chartBars.length * 48 : '100%' }}>
            {chartBars.map((bar, i) => (
              <div key={i} className="pp-bar-wrap" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', minWidth: isYtd ? 40 : 'auto' }}>
                <div className="pp-chart-tooltip" style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', backgroundColor: C.onSurface, color: C.white, padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  {bar.count}
                </div>
                <div className="pp-bar-fill" style={{ width: '100%', maxWidth: 48, height: `${bar.height}%`, backgroundColor: bar.highlight ? C.primary : C.surfaceHighest, borderRadius: '6px 6px 2px 2px', cursor: 'pointer', boxShadow: bar.highlight ? '0 4px 12px rgba(2, 36, 72, 0.2)' : 'none' }}
                  onMouseEnter={(e) => { if(!bar.highlight) e.currentTarget.style.backgroundColor = C.outline; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bar.highlight ? C.primary : C.surfaceHighest; }}
                />
                <span style={{ fontSize: isYtd ? 9 : 12, fontWeight: bar.highlight ? 700 : 500, marginTop: 12, color: bar.highlight ? C.onSurface : C.outline, whiteSpace: 'nowrap' }}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 20, paddingTop: 16, borderTop: `1px solid ${C.surfaceHigh}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.primary }} />
            <span style={{ fontSize: 12, color: C.outline }}>{isYtd ? 'Current Month' : 'Today'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.surfaceHighest, border: '1px solid #d0d0d0' }} />
            <span style={{ fontSize: 12, color: C.outline }}>Historical</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: C.outline }}>
            Volume: <strong style={{ color: C.primary, fontSize: 16, fontFamily: 'Poppins, sans-serif', marginLeft: 4 }}>{chartTotal.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES + BREAKDOWN ─── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top Categories */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: '0 0 24px' }}>Top Categories</h3>
          {topCategories.length === 0 ? (
            <p style={{ textAlign: 'center', color: C.outline, padding: '40px 0' }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topCategories.map((cat, idx) => {
                const pct = Math.round((cat.count / maxCatCount) * 100);
                return (
                  <div key={cat.name} className="pp-row-animate" style={{ animationDelay: `${idx * 80}ms` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface, textTransform: 'capitalize' }}>{cat.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{cat.count.toLocaleString()} <span style={{ color: C.outline, fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ width: '100%', height: 8, borderRadius: 99, backgroundColor: C.surfaceHigh, overflow: 'hidden' }}>
                      <div
                        className="pp-cat-bar"
                        style={{ width: animated ? `${pct}%` : '0%', height: '100%', borderRadius: 99, backgroundColor: cat.rank === 1 ? C.gold : C.primarySoft }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Insights Box */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`, color: C.white, border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.08, pointerEvents: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 160 }}>insights</span>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', fontWeight: 700, margin: '0 0 16px' }}>Performance Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="pp-insight-card" style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, animationDelay: '100ms' }}>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Most Popular Category</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, textTransform: 'capitalize' }}>{topCategories[0]?.name || 'N/A'}</p>
              </div>
              <div className="pp-insight-card" style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, animationDelay: '200ms' }}>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Conversion Health</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{conversionRate}% <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>of users redeemed at least once</span></p>
              </div>
              <div className="pp-insight-card" style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, animationDelay: '300ms' }}>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Points Economy Drain</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{formatLargeNumber(totalPointsRedeemed)} <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>pts redeemed total</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DETAILED TABLE ─── */}
      <section style={{ ...baseCard, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${C.surfaceHigh}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: 0 }}>Detailed Redemption Log</h3>
            <p style={{ fontSize: 13, color: C.outline, margin: '4px 0 0' }}>Showing the 10 most recent redemptions across the platform.</p>
          </div>
          <button
            onClick={() => navigate('/admin/redemptions')}
            style={{ fontSize: 13, fontWeight: 600, color: C.primary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            View All Activity <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ backgroundColor: C.surface }}>
                {['User', 'Voucher', 'Date', 'Status', 'Points Used'].map(h => (
                  <th key={h} style={{ padding: '14px 28px', fontSize: 11, fontWeight: 700, color: C.outline, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: `1px solid ${C.surfaceHigh}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRedemptions.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: C.outline }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8, opacity: 0.4 }}>receipt_long</span>
                  No redemptions recorded yet
                </td></tr>
              ) : recentRedemptions.map((r, i) => (
                <tr
                  key={r.id}
                  className="pp-row-animate"
                  style={{ borderBottom: i < recentRedemptions.length - 1 ? `1px solid ${C.surfaceHigh}` : 'none', transition: 'background-color 0.2s', backgroundColor: 'transparent', animationDelay: `${i * 50}ms` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surface}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 28px', fontSize: 14, fontWeight: 500, color: C.onSurface }}>{r.userName}</td>
                  <td style={{ padding: '16px 28px', fontSize: 14, color: C.onSurfaceVariant }}>{r.voucherTitle}</td>
                  <td style={{ padding: '16px 28px', fontSize: 13, color: C.outline }}>{r.date}</td>
                  <td style={{ padding: '16px 28px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '16px 28px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: 'Poppins, sans-serif' }}>
                    {r.pointsUsed > 0 ? `-${r.pointsUsed.toLocaleString()} pts` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default RedemptionAnalytics;