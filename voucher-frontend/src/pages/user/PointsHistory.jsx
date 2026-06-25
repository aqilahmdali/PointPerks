import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import EmptyState from '../../components/common/EmptyState';

const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  tertiary: '#002252',
  secondary: '#795900',
  secondaryFixed: '#ffdfa0',
  secondaryContainer: '#ffc641',
  surface: '#f9f9f8',
  surfaceBright: '#f4f4f3',
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
  earnedGreen: '#2E7D32',
  earnedGreenBg: '#E8F5E9',
  spentOrange: '#E65100',
  spentOrangeBg: '#FFF3E0',
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
    border: `1px solid ${C.surfaceVariant}`,
    borderRadius: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
};

const PAGE_SIZE = 8;

const TYPE_META = {
  earned:   { label: 'Earned',   icon: 'trending_up',   badgeBg: C.earnedGreenBg, badgeColor: C.earnedGreen },
  bonus:    { label: 'Bonus',    icon: 'card_giftcard', badgeBg: '#E3F2FD', badgeColor: '#1565C0' },
  refunded: { label: 'Refunded', icon: 'replay',        badgeBg: C.earnedGreenBg, badgeColor: C.earnedGreen },
  spent:    { label: 'Redeemed', icon: 'shopping_cart', badgeBg: C.spentOrangeBg, badgeColor: C.spentOrange },
  redemption: { label: 'Redeemed', icon: 'confirmation_number', badgeBg: C.spentOrangeBg, badgeColor: C.spentOrange },
};

const getDescIcon = (desc = '', type = '') => {
  if (type === 'redemption' || type === 'spent') return 'confirmation_number';
  if (/coffee|food|dining/i.test(desc)) return 'local_cafe';
  if (/referral/i.test(desc)) return 'diversity_3';
  if (/movie|cinema/i.test(desc)) return 'local_movies';
  if (/bonus|tier/i.test(desc)) return 'card_giftcard';
  if (/payroll|deposit|salary/i.test(desc)) return 'payments';
  if (/signup|welcome/i.test(desc)) return 'person_add';
  return 'receipt_long';
};

const PointsHistory = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ currentPoints: 0, thisMonth: 0, redeemed: 0, history: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');

  const ms = (size = 24, fill = 0) => ({
    fontFamily: "'Material Symbols Outlined'",
    fontSize: size,
    fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
    lineHeight: 1,
    display: 'inline-block',
    verticalAlign: 'middle',
  });

  useEffect(() => {
    setLoading(true);
    userAPI.getPointsHistory({ page: page + 1, limit: PAGE_SIZE })
      .then((res) => {
        const apiData = res.data;
        // Calculate thisMonth and redeemed from history if not provided by API
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const calculatedThisMonth = apiData.history
          ?.filter(h => {
            const date = new Date(h.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear && h.points > 0;
          })
          .reduce((sum, h) => sum + (h.points || 0), 0) || 0;

        const calculatedRedeemed = apiData.history
          ?.filter(h => h.points < 0)
          .reduce((sum, h) => sum + Math.abs(h.points || 0), 0) || 0;

        setData({
          ...apiData,
          thisMonth: apiData.thisMonth ?? calculatedThisMonth,
          redeemed: apiData.redeemed ?? calculatedRedeemed,
        });
      })
      .finally(() => setLoading(false));
  }, [page]);

  const filteredHistory = useMemo(() => {
    return data.history.filter((h) => {
      if (filter === 'earned') return h.points > 0;
      if (filter === 'spent') return h.points < 0;
      return true;
    });
  }, [data.history, filter]);

  const totalPages = data.pagination?.totalPages || 1;
  const total = data.pagination?.total || 0;
  const startItem = total > 0 ? page * PAGE_SIZE + 1 : 0;
  const endItem = Math.min((page + 1) * PAGE_SIZE, total);
  const redeemableCount = Math.floor((data.currentPoints || 0) / 500);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(0, page - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(0, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <div style={styles.pageContainer}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased; }
        
        @keyframes pp-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .pp-sk { background: ${C.surfaceContainerHighest}; position: relative; overflow: hidden; border-radius: 8px; }
        .pp-sk::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: pp-shimmer 1.5s infinite; }
        
        @keyframes pp-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pp-row-anim { animation: pp-fade-up 0.3s ease-out forwards; opacity: 0; }
        
        .pp-custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .pp-custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .pp-custom-scroll::-webkit-scrollbar-thumb { background: ${C.surfaceContainerHighest}; border-radius: 10px; }
        .pp-custom-scroll::-webkit-scrollbar-thumb:hover { background: ${C.outlineVariant}; }
        
        .pp-row { transition: background 150ms ease; }
        .pp-row:hover { background: ${C.surfaceContainerLow} !important; }
        
        .pp-filter { transition: all 200ms ease; }
        .pp-filter:hover { background: ${C.surfaceContainerHigh} !important; color: ${C.onSurface} !important; }
        .pp-filter-active { box-shadow: 0 2px 8px rgba(121, 89, 0, 0.2); }
        
        .pp-pg-btn { transition: all 150ms ease; }
        .pp-pg-btn:hover { background: ${C.surfaceContainerHigh} !important; }
        .pp-pg-btn-active { box-shadow: 0 2px 8px rgba(2, 36, 72, 0.2); }
        
        .pp-cta-btn { transition: all 200ms ease; }
        .pp-cta-btn:hover { background: ${C.secondaryContainer} !important; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important; }
        .pp-cta-btn:active { transform: translateY(0); }
      `}</style>

      {/* BREADCRUMB */}
      <nav style={styles.breadcrumb}>
        <button onClick={() => navigate('/dashboard')} style={styles.breadcrumbLink}>
          <span style={ms(16, 0)}>home</span>
          Home
        </button>
        <span style={{ color: C.outlineVariant }}>/</span>
        <span style={{ color: C.onSurface, fontWeight: 600 }}>Points History</span>
      </nav>

      {/* HEADER ROW */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={styles.title}>Points History</h1>
        <p style={styles.subtitle}>Track your earnings and redemptions across the PointPerks ecosystem.</p>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {/* Current Balance */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`,
          color: C.white, padding: '24px', borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(2, 36, 72, 0.18)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.06, pointerEvents: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
              Current Balance
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '36px', fontWeight: 700, color: C.secondaryFixed, lineHeight: 1 }}>
                {(data.currentPoints || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: C.secondaryFixed, opacity: 0.8 }}>pts</span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div style={{
          ...styles.uniformCard, padding: '24px',
          borderLeft: '4px solid ' + C.earnedGreen,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.earnedGreenBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: C.earnedGreen, fontSize: 22 }}>trending_up</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              This Month
            </p>
          </div>
          <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '28px', fontWeight: 700, color: C.earnedGreen }}>
            +{(data.thisMonth || 0).toLocaleString()}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.outline }}>Points earned</p>
        </div>

        {/* Redeemed */}
        <div style={{
          ...styles.uniformCard, padding: '24px',
          borderLeft: '4px solid ' + C.spentOrange,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.spentOrangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: C.spentOrange, fontSize: 22 }}>shopping_cart</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Redeemed
            </p>
          </div>
          <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '28px', fontWeight: 700, color: C.spentOrange }}>
            -{(data.redeemed || 0).toLocaleString()}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.outline }}>Points spent</p>
        </div>
      </div>

      {/* FILTERS & TABLE CARD */}
      <div style={styles.uniformCard}>
        {/* Filter Bar */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.surfaceVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '18px', fontWeight: 600, color: C.primary, margin: 0 }}>
            Transaction History
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.surfaceContainerLow, padding: '4px', borderRadius: 12 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'earned', label: 'Earned' },
              { key: 'spent', label: 'Redeemed' },
            ].map(({ key, label }) => {
              const active = filter === key;
              return (
                <button key={key} onClick={() => setFilter(key)} className={`pp-filter ${active ? 'pp-filter-active' : ''}`} style={{
                  padding: '8px 18px', borderRadius: 10, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  background: active ? C.white : 'transparent', color: active ? C.secondary : C.onSurfaceVariant,
                  border: 'none',
                }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="pp-custom-scroll" style={{ overflowX: 'auto' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 140px 1fr 110px', gap: 16, padding: '14px 24px',
            background: C.surfaceContainerLow, borderBottom: `1px solid ${C.surfaceVariant}`,
            fontSize: '12px', fontWeight: 700, color: C.outline, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '680px',
          }}>
            <div>Date</div>
            <div>Type</div>
            <div>Description</div>
            <div style={{ textAlign: 'right' }}>Points</div>
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ minWidth: '680px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pp-sk" style={{ display: 'grid', gridTemplateColumns: '140px 140px 1fr 110px', gap: 16, padding: '18px 24px', borderBottom: i < 5 ? `1px solid ${C.surfaceVariant}` : 'none', height: '64px' }} />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ padding: '64px 24px', minWidth: '680px' }}>
              <EmptyState icon="receipt_long" title="No transactions found" body={filter === 'all' ? 'Start earning points by signing up or referring friends.' : `No ${filter} transactions to show.`} />
            </div>
          ) : (
            <div style={{ minWidth: '680px' }}>
              {filteredHistory.map((h, i) => {
                const meta = TYPE_META[h.type] || TYPE_META.earned;
                const isPositive = h.points > 0;
                const descIcon = getDescIcon(h.description, h.type);

                return (
                  <div key={h._id || i} className="pp-row pp-row-anim" style={{
                    display: 'grid', gridTemplateColumns: '140px 140px 1fr 110px', gap: 16, padding: '16px 24px',
                    borderBottom: i < filteredHistory.length - 1 ? `1px solid ${C.surfaceVariant}` : 'none',
                    alignItems: 'center', animationDelay: `${i * 40}ms`, cursor: 'default',
                  }}>
                    <div style={{ fontSize: '13px', color: C.onSurfaceVariant, whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {formatDate(h.createdAt)}
                    </div>
                    <div>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, 
                        background: meta.badgeBg, color: meta.badgeColor, fontSize: '11px', fontWeight: 700, 
                        textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{meta.icon}</span>
                        {meta.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ 
                        width: 38, height: 38, borderRadius: 10, background: C.surfaceContainerHigh, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                      }}>
                        <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: 18 }}>{descIcon}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: C.onSurface, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {h.description}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.outline, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                          {h._id?.slice(-10) || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: 'right', fontWeight: 700, fontSize: '15px', 
                      color: isPositive ? C.earnedGreen : C.spentOrange, whiteSpace: 'nowrap',
                      fontFamily: "'Poppins', sans-serif"
                    }}>
                      {isPositive ? '+' : ''}{h.points?.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && total > 0 && (
          <div style={{ 
            padding: '16px 24px', background: C.surfaceContainerLow, display: 'flex', 
            alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.surfaceVariant}`,
            flexWrap: 'wrap', gap: 12 
          }}>
            <p style={{ fontSize: '13px', color: C.outline, margin: 0, fontWeight: 500 }}>
              Showing {startItem}–{endItem} of {total} transactions
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="pp-pg-btn"
                style={{ 
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  borderRadius: 10, border: '1px solid ' + C.outlineVariant, background: C.white, 
                  cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1,
                  transition: 'all 150ms'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: C.onSurface, fontSize: 20 }}>chevron_left</span>
              </button>
              
              {renderPageNumbers().map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPage(p)} 
                  className={`pp-pg-btn ${page === p ? 'pp-pg-btn-active' : ''}`}
                  style={{
                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                    background: page === p ? C.primary : C.white, color: page === p ? C.white : C.onSurface,
                    border: page === p ? 'none' : `1px solid ${C.outlineVariant}`, fontWeight: 600, fontSize: '14px', 
                    cursor: 'pointer',
                  }}
                >
                  {p + 1}
                </button>
              ))}
              
              <button 
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
                className="pp-pg-btn"
                style={{ 
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  borderRadius: 10, border: '1px solid ' + C.outlineVariant, background: C.white, 
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1,
                  transition: 'all 150ms'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: C.onSurface, fontSize: 20 }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CTA SECTION */}
      <section style={{
        marginTop: 40, padding: '32px', borderRadius: 16,
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.tertiary} 100%)`, 
        color: C.white, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: C.secondaryFixed, opacity: 0.08, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, background: '#adc8f5', opacity: 0.08, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
              Ready to treat yourself?
            </h2>
            <p style={{ fontSize: '15px', opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
              {redeemableCount > 0 
                ? `You have enough points to redeem for ${redeemableCount} premium voucher${redeemableCount > 1 ? 's' : ''} today.`
                : 'Keep earning points to unlock premium vouchers and rewards.'
              }
            </p>
          </div>
          <button className="pp-cta-btn" onClick={() => navigate('/vouchers')} style={{
            background: C.secondaryFixed, color: '#261a00', padding: '14px 28px', borderRadius: 12,
            fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>redeem</span>
            Redeem Points
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) { 
          div[style*="padding: 32px 48px"] { padding: 24px 16px !important; }
          .pp-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default PointsHistory;