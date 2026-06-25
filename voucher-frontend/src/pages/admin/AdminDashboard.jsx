import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, voucherAPI, redemptionAPI, analyticsAPI } from '../../services/api';

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
};

const formatLargeNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AVATAR_COLORS = ['#022448', '#795900', '#1e3a5f', '#166534', '#6b21a8', '#0e7490', '#be123c'];
const avatarColor = (str = '') => AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name = '') => name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

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
  return { apiPeriod: 'daily', days: 7, bucket: 'day' };
};

const buildChartBars = (series = [], period = 'Last 7 Days') => {
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
        key,
        label: cursor.toLocaleDateString('en-US', { month: 'short' }),
        highlight: key === monthKey(today),
        count: counts.get(key) || 0,
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
        label: days <= 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        highlight: key === dateKey(today),
        count: counts.get(key) || 0,
      });
    }
  }

  const max = Math.max(...buckets.map((b) => b.count), 1);
  return buckets.map((bar) => ({
    ...bar,
    height: Math.round((bar.count / max) * 85) + 5,
  }));
};

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */
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
  <div style={{
    ...style,
    background: 'linear-gradient(90deg,#e8e8e7 25%,#f4f4f3 50%,#e8e8e7 75%)',
    backgroundSize: '200% 100%',
    animation: 'skPulse 1.5s ease-in-out infinite',
    borderRadius: style?.borderRadius ?? 16,
  }} />
);

const STATUS_STYLE = {
  pending: { bg: C.warningBg, color: C.warning, label: 'Pending' },
  success: { bg: C.successBg, color: C.success, label: 'Success' },
  active: { bg: C.successBg, color: C.success, label: 'Active' },
  expired: { bg: '#fee2e2', color: '#991b1b', label: 'Expired' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status?.toLowerCase()] || { bg: '#f0f0f0', color: C.outline, label: status };
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      fontFamily: 'Inter, sans-serif', backgroundColor: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animated, setAnimated] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('Last 7 Days');

  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [newUsersThisWeek, setNewUsersThisWeek] = useState(0);
  const [activeVouchers, setActiveVouchers] = useState(0);
  const [totalVouchers, setTotalVouchers] = useState(0);
  const [totalRedemptions, setTotalRedemptions] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState(0);
  const [totalPointsInCirculation, setTotalPointsInCirculation] = useState(0);
  const [topVouchers, setTopVouchers] = useState([]);
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [chartBars, setChartBars] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chartConfig = getChartConfig(chartPeriod);
      const [usersRes, vouchersRes, redemptionsRes, chartRes] = await Promise.all([
        userAPI.getAll({ limit: 1000 }),
        voucherAPI.getAll({ limit: 1000, showExpired: 'true' }),
        redemptionAPI.getAll({ limit: 1000 }),
        analyticsAPI.getRedemptionsOverTime({ period: chartConfig.apiPeriod, days: chartConfig.days }).catch(() => null),
      ]);

      const users = usersRes.data?.data ?? usersRes.data?.users ?? usersRes.data ?? [];
      setTotalUsers(users.length);
      setActiveUsers(users.filter((u) => u.isActive).length);
      const oneWeekAgo = Date.now() - 7 * 86400000;
      setNewUsersThisWeek(users.filter((u) => new Date(u.createdAt) > oneWeekAgo).length);
      setTotalPointsInCirculation(users.reduce((sum, u) => sum + (u.points || 0), 0));

      const vouchers = vouchersRes.data?.data ?? vouchersRes.data?.vouchers ?? vouchersRes.data ?? [];
      setActiveVouchers(vouchers.filter((v) => v.isActive).length);
      setTotalVouchers(vouchers.length);

      setTopVouchers([...vouchers]
        .sort((a, b) => (b.redeemedCount || 0) - (a.redeemedCount || 0))
        .slice(0, 5)
        .map((v, i) => ({
          rank: i + 1, id: v._id, title: v.title, category: v.category,
          merchant: v.merchant, redemptions: v.redeemedCount || 0,
          pointsCost: v.pointsCost || 0, totalLimit: v.totalLimit,
        }))
      );

      const redemptions = redemptionsRes.data?.data ?? redemptionsRes.data?.redemptions ?? redemptionsRes.data ?? [];
      setTotalRedemptions(redemptions.length);
      setPendingRedemptions(redemptions.filter((r) => r.status?.toLowerCase() === 'pending').length);

      const chartSeries = chartRes?.data?.data || [];
      const fallbackSeries = redemptions.map((r) => ({ date: r.createdAt || r.updatedAt, count: 1 }));
      setChartBars(buildChartBars(chartSeries.length ? chartSeries : fallbackSeries, chartPeriod));

      setRecentRedemptions([...redemptions]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))
        .slice(0, 5)
        .map((r) => ({
          id: r._id,
          userName: r.user?.name ?? r.userId?.name ?? 'Unknown User',
          userEmail: r.user?.email ?? r.userId?.email ?? '',
          userInitials: initials(r.user?.name ?? r.userId?.name),
          userColor: avatarColor(r.user?.name ?? r.userId?.name),
          voucherTitle: r.voucher?.title ?? r.voucherId?.title ?? 'Unknown Voucher',
          voucherCategory: r.voucher?.category ?? r.voucherId?.category ?? '',
          date: formatRelativeDate(r.createdAt || r.updatedAt),
          status: r.status,
          pointsUsed: r.pointsUsed || 0,
        }))
      );
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
      setTimeout(() => setAnimated(true), 150);
    }
  }, [chartPeriod]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const maxTopRedemptions = topVouchers[0]?.redemptions || 1;
  const pointsGoalPct = Math.min(Math.round((totalPointsInCirculation / 5000000) * 100), 100);
  
  // Dynamic text based on period
  const isYtd = chartPeriod === 'Year to Date';
  const chartSubtitle = isYtd ? 'Monthly volume across all users this year' : 'Daily volume across all users this week';
  const chartTotalLabel = isYtd ? 'Total this year' : 'Total this week';

  const baseCard = {
    backgroundColor: C.white,
    border: `1px solid ${C.outlineVariant}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
    transition: 'all 0.25s ease',
  };

  const hoverCard = {
    onMouseEnter: (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 36, 72, 0.08)'; },
    onMouseLeave: (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'; },
  };

  /* ════ LOADING ════ */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@keyframes skPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {[1,2,3,4].map((i) => <Skeleton key={i} style={{ height: 160 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        <Skeleton style={{ height: 360 }} />
        <Skeleton style={{ height: 360 }} />
      </div>
      <Skeleton style={{ height: 320 }} />
    </div>
  );

  /* ════ ERROR ════ */
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16, backgroundColor: C.white, borderRadius: 16, border: `1px solid #fee2e2` }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.error }}>error_outline</span>
      <p style={{ fontSize: 15, color: C.onSurfaceVariant, fontFamily: 'Inter, sans-serif' }}>{error}</p>
      <button onClick={fetchAll} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: C.white, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
        Retry
      </button>
    </div>
  );

  /* ════════════════ MAIN RENDER ════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes skPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .pp-chart-tooltip { opacity: 0; transition: opacity 0.2s ease; pointer-events: none; }
        .pp-bar-wrap:hover .pp-chart-tooltip { opacity: 1; }
        .pp-bar-fill { transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease; }
      `}</style>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: C.outline, margin: '4px 0 0' }}>
          Overview of admin metrics and recent platform activity.
        </p>
      </div>

      {/* ─── STAT CARDS ─── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Total Users */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: C.primarySoft, color: C.primary, display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>group</span>
            </div>
            <span style={{ color: C.success, fontSize: 11, fontWeight: 600, backgroundColor: C.successBg, padding: '4px 8px', borderRadius: 6 }}>
              +{newUsersThisWeek} this week
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>Total Users</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={totalUsers} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: C.outline, marginTop: 8 }}>{activeUsers.toLocaleString()} active currently</p>
        </div>

        {/* Active Vouchers */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#ffdfa0', color: '#5c4300', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            </div>
            <span style={{ color: C.goldDark, fontSize: 11, fontWeight: 600, backgroundColor: C.goldSoft, padding: '4px 8px', borderRadius: 6 }}>
              {totalVouchers} total
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>Active Vouchers</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={activeVouchers} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: C.outline, marginTop: 8 }}>{(totalVouchers - activeVouchers)} inactive/expired</p>
        </div>

        {/* Total Redemptions */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default' }} {...hoverCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: '#e0e7ff', color: C.primaryContainer, display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>payments</span>
            </div>
            {pendingRedemptions > 0 && (
              <span style={{ color: C.warning, fontSize: 11, fontWeight: 600, backgroundColor: C.warningBg, padding: '4px 8px', borderRadius: 6 }}>
                {pendingRedemptions} pending
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>Total Redemptions</p>
          <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
            <AnimatedValue value={totalRedemptions} animate={animated} />
          </h3>
          <p style={{ fontSize: 12, color: C.outline, marginTop: 8 }}>Across all users</p>
        </div>

        {/* Points in Circulation */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, cursor: 'default', position: 'relative', overflow: 'hidden' }} {...hoverCard}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04, pointerEvents: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 140, fontVariationSettings: "'wght' 700" }}>monetization_on</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
            <div style={{ padding: 10, borderRadius: 12, backgroundColor: C.primaryContainer, color: C.white, display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>stars</span>
            </div>
            <span style={{ color: C.goldDark, fontSize: 11, fontWeight: 700 }}>{pointsGoalPct}% of goal</span>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, marginBottom: 4 }}>Points in Circulation</p>
            <h3 style={{ fontSize: 36, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, lineHeight: 1, margin: 0 }}>
              {formatLargeNumber(totalPointsInCirculation)}
            </h3>
          </div>
          <div style={{ width: '100%', height: 6, borderRadius: 99, backgroundColor: C.surfaceHighest, marginTop: 16, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
            <div style={{ width: `${pointsGoalPct}%`, height: '100%', borderRadius: 99, backgroundColor: C.gold, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>
      </section>

      {/* ─── CHART + TOP VOUCHERS ─── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'stretch' }}>
        
        {/* Redemption Trends Chart */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: 0 }}>
                Redemption Trends
              </h3>
              <p style={{ fontSize: 13, color: C.outline, margin: '4px 0 0' }}>
                {chartSubtitle}
              </p>
            </div>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              style={{
                backgroundColor: C.surfaceHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
                fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', padding: '8px 16px',
                cursor: 'pointer', color: C.onSurface, outline: 'none'
              }}
            >
              <option>Last 7 Days</option>
              <option>Year to Date</option>
            </select>
          </div>

          {/* Chart Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', minWidth: 0 }}>
            {/* Subtle Grid Lines */}
            <div style={{ position: 'absolute', inset: '0 0 36px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ width: '100%', height: 1, backgroundColor: C.surfaceHigh }} />
              ))}
            </div>

            {/* Bars Container - Allows horizontal scroll if YTD is too cramped */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: isYtd ? 8 : 12, height: 240, position: 'relative', zIndex: 1, overflowX: 'auto', paddingBottom: 4, minWidth: isYtd ? chartBars.length * 48 : '100%' }}>
              {chartBars.map((bar, i) => (
                <div key={i} className="pp-bar-wrap" title={`${bar.label}: ${bar.count}`} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', minWidth: isYtd ? 40 : 'auto' }}>
                  {/* Tooltip */}
                  <div className="pp-chart-tooltip" style={{
                    position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: C.onSurface, color: C.white, padding: '4px 8px', borderRadius: 6,
                    fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {bar.count}
                  </div>
                  
                  {/* Bar */}
                  <div
                    className="pp-bar-fill"
                    style={{
                      width: '100%', maxWidth: 48, height: `${bar.height}%`,
                      backgroundColor: bar.highlight ? C.primary : C.surfaceHighest,
                      borderRadius: '6px 6px 2px 2px', cursor: 'pointer',
                      boxShadow: bar.highlight ? '0 4px 12px rgba(2, 36, 72, 0.2)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if(!bar.highlight) e.currentTarget.style.backgroundColor = C.outline;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = bar.highlight ? C.primary : C.surfaceHighest;
                    }}
                  />
                  
                  {/* Label */}
                  <span style={{
                    fontSize: isYtd ? 10 : 12, fontWeight: bar.highlight ? 700 : 500,
                    marginTop: 12, color: bar.highlight ? C.onSurface : C.outline,
                    whiteSpace: 'nowrap'
                  }}>
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend Footer */}
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 20, paddingTop: 16, borderTop: `1px solid ${C.surfaceHigh}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.primary }} />
              <span style={{ fontSize: 12, color: C.outline }}>{isYtd ? 'Current Month' : 'Today'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.surfaceHighest, border: '1px solid #d0d0d0' }} />
              <span style={{ fontSize: 12, color: C.outline }}>{isYtd ? 'Other Months' : 'Other Days'}</span>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: C.outline }}>
              {chartTotalLabel}: <strong style={{ color: C.primary }}>{chartBars.reduce((s, b) => s + b.count, 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Top Redeemed Vouchers */}
        <div style={{ ...baseCard, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 16, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: 0 }}>Top Vouchers</h3>
              <p style={{ fontSize: 12, color: C.outline, margin: '4px 0 0' }}>Most redeemed all time</p>
            </div>
            <button onClick={() => navigate('/admin/vouchers')} style={{ fontSize: 12, fontWeight: 600, color: C.primary, backgroundColor: C.primarySoft, border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              View All
            </button>
          </div>

          {topVouchers.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.outline }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 8, opacity: 0.5 }}>local_offer</span>
              <p style={{ fontSize: 13 }}>No data yet</p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topVouchers.map((v) => (
                <div key={v.id} onClick={() => navigate(`/admin/vouchers/${v.id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, backgroundColor: C.surface, cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surfaceHigh}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.surface}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: v.rank === 1 ? C.gold : v.rank === 2 ? C.surfaceHighest : '#f4f4f3', color: v.rank <= 2 ? '#5c4300' : C.outline, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, boxShadow: v.rank === 1 ? '0 2px 8px rgba(255, 198, 65, 0.3)' : 'none' }}>
                    {v.rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.onSurface, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</p>
                    <p style={{ fontSize: 11, color: C.outline, margin: '2px 0 0' }}>{v.merchant || v.category}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.primary, margin: 0 }}>{v.redemptions.toLocaleString()}</p>
                  </div>
                </div>
              ))}

              {/* Proportion Bars */}
              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${C.surfaceHigh}` }}>
                {topVouchers.map((v) => {
                  const pct = Math.round((v.redemptions / maxTopRedemptions) * 100);
                  return (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: C.outline, width: 14, textAlign: 'right', flexShrink: 0 }}>{v.rank}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, backgroundColor: C.surfaceHigh, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: v.rank === 1 ? C.gold : C.primarySoft, transition: 'width 1s ease' }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.onSurfaceVariant, width: 32, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── RECENT REDEMPTIONS TABLE ─── */}
      <section style={{ ...baseCard, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.surfaceHigh}` }}>
          <div>
            <h3 style={{ fontSize: 18, fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: C.primary, margin: 0 }}>Recent Redemptions</h3>
            <p style={{ fontSize: 13, color: C.outline, margin: '4px 0 0' }}>Latest voucher redemptions across all users</p>
          </div>
          <button onClick={() => navigate('/admin/redemptions')} style={{ fontSize: 13, fontWeight: 600, color: C.primary, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            View All <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ backgroundColor: C.surface }}>
                {['User', 'Voucher', 'Date', 'Status', 'Points Used'].map((h) => (
                  <th key={h} style={{ padding: '14px 28px', fontSize: 11, fontWeight: 700, color: C.outline, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: `1px solid ${C.surfaceHigh}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRedemptions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: C.outline }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8, opacity: 0.4 }}>receipt_long</span>
                    No redemptions recorded yet
                  </td>
                </tr>
              ) : (
                recentRedemptions.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < recentRedemptions.length - 1 ? `1px solid ${C.surfaceHigh}` : 'none', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.surface}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: r.userColor, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {r.userInitials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.userName}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.outline, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 28px' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.onSurfaceVariant, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 16 }}>{r.voucherTitle}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: C.outline }}>{r.voucherCategory}</p>
                    </td>
                    <td style={{ padding: '16px 28px', fontSize: 13, color: C.outline }}>{r.date}</td>
                    <td style={{ padding: '16px 28px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: '16px 28px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: C.primary, fontFamily: 'Poppins, sans-serif' }}>
                      {r.pointsUsed > 0 ? `-${r.pointsUsed.toLocaleString()} pts` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;