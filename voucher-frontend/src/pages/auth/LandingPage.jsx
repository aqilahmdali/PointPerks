import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { voucherAPI, authAPI } from '../../services/api';
import { formatDiscount } from '../../utils/helpers';

const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  ctaGold: '#D4A017',
  secondary: '#795900',
  secondaryContainer: '#ffc641',
  secondaryFixed: '#ffdfa0',
  secondaryFixedDim: '#f6be39',
  tertiary: '#002252',
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
};

const CATEGORY_LABELS = {
  food: 'Food & Dining',
  shopping: 'Shopping',
  travel: 'Travel',
  entertainment: 'Entertainment',
  health: 'Health & Fitness',
};

const CATEGORY_DESCRIPTIONS = {
  food: 'From local hidden gems to world-class fine dining experiences.',
  shopping: 'Redeem points for the latest fashion, tech, and lifestyle brands.',
  travel: 'Flights, hotels, and unique stays around the globe at your fingertips.',
  entertainment: 'Movies, concerts, streaming, and unforgettable live experiences.',
  health: 'Gym memberships, wellness apps, and fitness rewards for your journey.',
};

const CATEGORY_IMAGES = {
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  shopping: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80',
  travel: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80',
  entertainment: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
  health: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
};

const VOUCHER_GRADIENT = `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%)`;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'inline-block', flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    voucherAPI
      .getAll({ featured: 'true', limit: 4 })
      .then((res) => setFeatured(res.data.data || []))
      .catch(() => {});
    voucherAPI
      .getCategories()
      .then((res) => setCategories(res.data.summary || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('pp-visible');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.pp-reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [featured, categories]);

  const handleCardMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.03)`;
    card.style.zIndex = '10';
  }, []);

  const handleCardMouseLeave = useCallback((e) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
    card.style.zIndex = '';
  }, []);

  const handleVoucherMouseMove = useCallback((restRotation) => (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px) scale(1.04)`;
    card.style.zIndex = '10';
  }, []);

  const handleVoucherMouseLeave = useCallback((restRotation) => (e) => {
    const card = e.currentTarget;
    card.style.transform = `rotate(${restRotation}deg)`;
    card.style.zIndex = '';
  }, []);

  const requireLogin = (path) => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate(path);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  const ms = (size = 24, fill = 0) => ({
    fontFamily: "'Material Symbols Outlined'",
    fontSize: size,
    fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
    lineHeight: 1,
    display: 'inline-block',
  });

  return (
    <div style={{
      background: C.surface,
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: C.onSurface,
      overflowX: 'hidden',
    }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        background: C.surface,
        borderBottom: `1px solid ${C.outlineVariant}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 22, color: C.primary }}>
            PointPerks
          </span>
          <div className="pp-nav-links" style={{ display: 'flex', gap: 24 }}>
            <span className="pp-nav-link pp-nav-active" onClick={() => requireLogin('/voucherlist')}>Marketplace</span>
            <span className="pp-nav-link" onClick={() => requireLogin('/myredemptions')}>Redemptions</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="pp-btn-outline-sm" onClick={() => navigate('/login')}>Log in</button>
          <button className="pp-btn-solid-sm" onClick={() => navigate('/register')}>Sign up</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pp-reveal" style={{
        position: 'relative',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '32px 24px 96px',
      }}>
        <div className="pp-hero-grid" style={{
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          alignItems: 'center',
        }}>
          <div style={{ zIndex: 10 }}>
            <div className="pp-badge">
              <span style={ms(16, 1)}>stars</span>
              Join 50k+ savvy savers
            </div>
            <h1 style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(32px, 5vw, 48px)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: C.primary,
              margin: '28px 0 24px',
              maxWidth: 580,
            }}>
              Turn everyday points into <span style={{ color: C.ctaGold }}>real savings.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: C.onSurfaceVariant, maxWidth: 480, marginBottom: 32 }}>
              PointPerks helps you unlock the hidden value in your loyalty points. Earn points when you sign up or refer a friend, then redeem them for vouchers across food, shopping, travel, entertainment, and health — each with a unique code, QR, and downloadable PDF.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button className="pp-btn-hero" onClick={() => navigate('/register')}>
                Get Started
                <span style={ms(20)}>arrow_forward</span>
              </button>
              <button className="pp-btn-outline" onClick={authAPI.googleLogin}>
                <GoogleIcon />
                Continue with Google
              </button>
            </div>
            <div style={{ display: 'flex', gap: 48, marginTop: 48 }}>
              {[
                { val: '20+', label: 'active vouchers' },
                { val: '100 pts', label: 'welcome bonus' },
                { val: '5', label: 'categories' },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, fontWeight: 800, color: C.primary }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: C.onSurfaceVariant }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating voucher mock */}
          <div className="pp-hero-visual" style={{ position: 'relative', height: 400 }}>
            <div
              className="pp-voucher-main pp-tilt-card"
              style={{
                position: 'absolute',
                top: 0,
                right: -24,
                width: 320,
                background: `linear-gradient(135deg, ${C.secondary} 0%, ${C.tertiary} 100%)`,
                color: '#fff',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 20px 60px -12px rgba(0,0,0,0.3)',
                transform: 'rotate(-6deg)',
              }}
              onMouseMove={handleVoucherMouseMove(-6)}
              onMouseLeave={handleVoucherMouseLeave(-6)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ ...ms(40), color: C.secondaryFixed }}>shopping_basket</span>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Flash Sale</p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: C.secondaryFixed, margin: 0 }}>25% OFF</p>
                </div>
              </div>
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.3)', paddingTop: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>Lazada Flash Sale</p>
                <p style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontFamily: 'monospace' }}>VR-7F2A-9C1D-EE03</p>
              </div>
            </div>

            <div
              className="pp-voucher-points pp-tilt-card"
              style={{
                position: 'absolute',
                bottom: 0,
                left: -20,
                width: 256,
                background: VOUCHER_GRADIENT,
                color: C.onPrimary,
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 20px 60px -12px rgba(0,0,0,0.3)',
                transform: 'rotate(3deg)',
              }}
              onMouseMove={handleVoucherMouseMove(3)}
              onMouseLeave={handleVoucherMouseLeave(3)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ ...ms(40), color: C.secondaryFixed }}>stars</span>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Points Value</p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: C.secondaryFixed, margin: 0 }}>2,500</p>
                </div>
              </div>
              <div style={{ borderTop: `1px dashed ${C.primaryContainer}`, paddingTop: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>Your Balance</p>
                <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>Redeemable at 500+ locations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pp-reveal" style={{
        background: C.surfaceLow,
        padding: '96px 24px',
        borderTop: `1px solid ${C.outlineVariant}`,
        borderBottom: `1px solid ${C.outlineVariant}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 32, color: C.primary, marginBottom: 12 }}>Redeem in any category</h2>
            <p style={{ color: C.onSurfaceVariant, fontSize: 16 }}>Universal points, endless possibilities.</p>
          </div>
          <div className="pp-cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const cat = categories.find((c) => c._id === key);
              return (
                <div
                  key={key}
                  className="pp-cat-card pp-tilt-card"
                  onClick={() => navigate('/register')}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div style={{ position: 'relative', height: 192, marginBottom: 24, overflow: 'hidden', borderRadius: 12 }}>
                    <div
                      className="pp-cat-img"
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${CATEGORY_IMAGES[key]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'transform 0.5s',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.primary,
                    }}>
                      {label}
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 20px' }}>
                    <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 20, color: C.primary, marginBottom: 8 }}>{label}</h3>
                    <p style={{ color: C.onSurfaceVariant, fontSize: 15, marginBottom: 20, lineHeight: 1.5 }}>{CATEGORY_DESCRIPTIONS[key]}</p>
                    <div className="pp-cat-btn">
                      <span>{cat ? `${cat.count} vouchers available` : 'Browse'}</span>
                      <span style={ms(20)}>arrow_forward</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Vouchers */}
      {featured.length > 0 && (
        <section className="pp-reveal" style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 32, color: C.primary, marginBottom: 12 }}>Popular right now</h2>
            <p style={{ color: C.onSurfaceVariant, fontSize: 16 }}>Featured vouchers ready for instant redemption.</p>
          </div>
          <div className="pp-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {featured.map((v) => (
              <div
                key={v._id}
                className="pp-feat-card pp-tilt-card"
                onClick={() => navigate('/register')}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div style={{ background: VOUCHER_GRADIENT, padding: '28px 16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 28, fontWeight: 800, color: C.secondaryFixed }}>
                    {formatDiscount(v.discountType, v.discountValue)}
                  </div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.onSurface }}>{v.title}</div>
                  <div style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 4 }}>{v.merchant}</div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.ctaGold, fontWeight: 600 }}>
                    <span style={ms(16, 1)}>stars</span>
                    {v.pointsCost ?? 100} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Value Proposition */}
      <section className="pp-reveal" style={{ padding: '96px 24px', position: 'relative' }}>
        <div className="pp-value-grid" style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}>
          <div className="pp-value-visual" style={{ position: 'relative' }}>
            <div className="pp-progress-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 20, color: C.primary, margin: 0 }}>Redemption Goal</h4>
                  <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '4px 0 0' }}>Emirates Business Class Upgrade</p>
                </div>
                <span style={{ fontWeight: 700, color: C.ctaGold, fontFamily: "'Poppins', sans-serif", fontSize: 24 }}>85%</span>
              </div>
              <div style={{ height: 16, background: C.surfaceHigh, borderRadius: 999, overflow: 'hidden', marginBottom: 32 }}>
                <div style={{ height: '100%', width: '85%', background: `linear-gradient(to right, ${C.primary}, ${C.ctaGold})`, borderRadius: 999, transition: 'width 1s ease-out' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Points Balance', value: '12,450 pts' },
                  { label: 'Cash Value', value: '$1,245.00' },
                ].map((item) => (
                  <div key={item.label} className="pp-progress-stat">
                    <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontWeight: 700, color: C.primary, margin: 0, fontFamily: "'Poppins', sans-serif" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              position: 'absolute',
              zIndex: -1,
              top: -48,
              left: -48,
              width: 192,
              height: 192,
              background: `${C.secondaryFixed}40`,
              borderRadius: '50%',
              filter: 'blur(64px)',
            }} />
          </div>

          <div className="pp-value-text">
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 32, color: C.primary, marginBottom: 24 }}>Precision rewards for smart users.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: C.onSurfaceVariant, marginBottom: 24 }}>
              Our platform is designed with financial precision. We track market fluctuations to ensure you always get the maximum value for your points. No more opaque conversion rates or expiration anxiety.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Real-time market valuation', 'Zero-fee redemption engine', 'Multi-point wallet consolidation'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ ...ms(24, 1), color: C.ctaGold }}>check_circle</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="pp-reveal" style={{ background: VOUCHER_GRADIENT, color: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ color: C.secondaryFixed, fontWeight: 600, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>How it works</span>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 32, color: '#fff', margin: '16px 0 0' }}>From sign-up to savings in three steps</h2>
          </div>
          <div className="pp-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { icon: 'person_add', title: 'Create your account', body: 'Sign up with email or Google and get 100 points instantly, free.' },
              { icon: 'search', title: 'Find a voucher', body: 'Browse 20+ vouchers across food, shopping, travel, entertainment and health.' },
              { icon: 'qr_code_2', title: 'Redeem & save', body: 'Get a unique code, QR, and PDF voucher ready to use in seconds.' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'rgba(212,160,23,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <span style={{ ...ms(28), color: C.ctaGold }}>{step.icon}</span>
                </div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 18, color: '#fff', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pp-reveal" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="pp-cta-card" style={{
            position: 'relative',
            borderRadius: 32,
            padding: 64,
            overflow: 'hidden',
            textAlign: 'center',
            background: VOUCHER_GRADIENT,
            color: C.onPrimary,
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.1,
              background: 'radial-gradient(circle at center, #fff, transparent)',
            }} />
            <div style={{ position: 'relative', zIndex: 10, maxWidth: 560, margin: '0 auto' }}>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 16, lineHeight: 1.2 }}>
                Ready to unlock your points?
              </h2>
              <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 32, lineHeight: 1.6 }}>
                Join PointPerks today and start converting your loyalty into lifestyle. Your first 100 points are waiting.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="pp-btn-gold" onClick={() => navigate('/register')}>
                  Get Started Free
                  <span style={ms(20)}>arrow_forward</span>
                </button>
                <button className="pp-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.outlineVariant}`, padding: '32px 24px', background: C.surfaceHighest }}>
        <div className="pp-footer" style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>
            © {new Date().getFullYear()} PointPerks. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'Contact'].map((link) => (
              <span key={link} className="pp-footer-link">{link}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .pp-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .pp-reveal.pp-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .pp-nav-link {
          font-size: 16px;
          color: ${C.onSurfaceVariant};
          cursor: pointer;
          transition: color 0.15s;
          padding-bottom: 4px;
        }
        .pp-nav-link:hover { color: ${C.primary}; }
        .pp-nav-active {
          color: ${C.primary} !important;
          font-weight: 700;
          border-bottom: 2px solid ${C.primary};
        }

        .pp-btn-solid-sm {
          height: 40px;
          padding: 0 24px;
          border-radius: 8px;
          background: ${C.primary};
          color: ${C.onPrimary};
          border: none;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .pp-btn-solid-sm:hover { opacity: 0.9; }
        .pp-btn-outline-sm {
          height: 40px;
          padding: 0 24px;
          border-radius: 8px;
          background: transparent;
          color: ${C.primary};
          border: 1px solid ${C.outlineVariant};
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pp-btn-outline-sm:hover { background: ${C.surfaceContainer}; }

        .pp-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: ${C.secondaryContainer};
          color: #715300;
          border-radius: 999px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 12px;
        }

        .pp-btn-hero {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          background: ${C.primary};
          color: ${C.onPrimary};
          border: none;
          border-radius: 12px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(2,36,72,0.2);
          transition: all 0.2s;
        }
        .pp-btn-hero:hover { box-shadow: 0 8px 24px rgba(2,36,72,0.3); }
        .pp-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          border: 2px solid ${C.primary};
          color: ${C.primary};
          background: transparent;
          border-radius: 12px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pp-btn-outline:hover { background: ${C.surfaceContainer}; }

        .pp-tilt-card {
          transform-style: preserve-3d;
          will-change: transform;
          transition: transform 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99),
                      box-shadow 0.3s ease;
        }

        .pp-voucher-main { cursor: pointer; }
        .pp-voucher-main:hover {
          box-shadow: 0 30px 80px -16px rgba(0,0,0,0.4),
                      0 0 0px 1px rgba(212,160,23,0.15);
        }
        .pp-voucher-points { cursor: pointer; }
        .pp-voucher-points:hover {
          box-shadow: 0 30px 80px -16px rgba(0,0,0,0.4),
                      0 0 0px 1px rgba(212,160,23,0.15);
        }

        .pp-cat-card {
          background: ${C.surfaceLowest};
          padding: 8px;
          border-radius: 16px;
          border: 1px solid ${C.outlineVariant};
          box-shadow: 0px 4px 20px rgba(30,58,95,0.04);
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .pp-cat-card:hover {
          box-shadow: 0px 20px 40px rgba(30,58,95,0.12),
                      0px 0px 0px 1px ${C.ctaGold}30;
        }
        .pp-cat-card:hover .pp-cat-img { transform: scale(1.1); }
        .pp-cat-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${C.primary};
          font-weight: 700;
          font-size: 14px;
          transition: gap 0.3s;
        }
        .pp-cat-card:hover .pp-cat-btn { gap: 16px; }

        .pp-feat-card {
          background: ${C.surfaceLowest};
          border-radius: 16px;
          border: 1px solid ${C.outlineVariant};
          box-shadow: 0px 4px 20px rgba(30,58,95,0.04);
          overflow: hidden;
          cursor: pointer;
        }
        .pp-feat-card:hover {
          box-shadow: 0px 20px 40px rgba(30,58,95,0.12),
                      0px 0px 0px 1px ${C.ctaGold}30;
        }

        .pp-progress-card {
          background: ${C.surfaceLowest};
          padding: 32px;
          border-radius: 16px;
          border: 1px solid ${C.outlineVariant};
          box-shadow: 0px 12px 32px rgba(30,58,95,0.08);
        }
        .pp-progress-stat {
          padding: 16px;
          background: ${C.primaryContainer}10;
          border-radius: 8px;
          border: 1px solid ${C.primary}10;
        }

        .pp-btn-gold {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${C.ctaGold};
          color: #261a00;
          padding: 20px 40px;
          border-radius: 999px;
          border: none;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(212,160,23,0.3);
          transition: all 0.2s;
        }
        .pp-btn-gold:hover { background: ${C.secondaryFixedDim}; }
        .pp-btn-ghost {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 20px 40px;
          border-radius: 999px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pp-btn-ghost:hover { background: rgba(255,255,255,0.2); }

        .pp-footer-link {
          font-size: 12px;
          color: ${C.onSurfaceVariant};
          cursor: pointer;
          transition: color 0.15s;
        }
        .pp-footer-link:hover { color: ${C.primary}; }

        @media (max-width: 1024px) {
          .pp-hero-grid { grid-template-columns: 1fr !important; }
          .pp-hero-visual { height: 380px !important; }
          .pp-value-grid { grid-template-columns: 1fr !important; }
          .pp-value-visual { order: 2; }
          .pp-value-text { order: 1; }
          .pp-cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pp-feat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .pp-nav-links { display: none !important; }
          .pp-cat-grid { grid-template-columns: 1fr !important; }
          .pp-feat-grid { grid-template-columns: 1fr !important; }
          .pp-steps-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pp-cta-card { padding: 48px 24px !important; border-radius: 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;