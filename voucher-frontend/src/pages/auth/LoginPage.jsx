import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  primary: '#022448',
  primaryHover: '#0a3a6b',
  primaryContainer: '#1e3a5f',
  secondary: '#795900',
  secondaryContainer: '#ffc641',
  secondaryFixed: '#ffdfa0',
  secondaryFixedDim: '#f6be39',
  surface: '#f9f9f8',
  surfaceLow: '#f4f4f3',
  surfaceContainerHighest: '#e2e2e2',
  surfaceLowest: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#43474e',
  outline: '#74777f',
  outlineVariant: '#c4c6cf',
  onPrimary: '#ffffff',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  success: '#386a20',
  successBg: '#e8f5e9',
};

const icon = (size = 20, fill = 0) => ({
  fontFamily: "'Material Symbols Outlined'",
  fontSize: size,
  fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
  lineHeight: 1,
  display: 'inline-block',
  verticalAlign: 'middle',
});

/* ── Stagger hook ── */
function useStagger(idx = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('pp-visible');
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('pp-visible'), idx * 70);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [idx]);
  return ref;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [errorKey, setErrorKey] = useState(0);

  const sLogo = useStagger(0);
  const sHeading = useStagger(1);
  const sSub = useStagger(2);
  const sStatCard = useStagger(3);
  const sFeat1 = useStagger(4);
  const sFeat2 = useStagger(5);
  const sFeat3 = useStagger(6);
  const sCard = useStagger(0);
  const sEmail = useStagger(1);
  const sPw = useStagger(2);
  const sSubmit = useStagger(3);
  const sDiv = useStagger(4);
  const sGoogle = useStagger(5);
  const sRegister = useStagger(6);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setErrorKey((k) => k + 1);

    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    } else {
      const message = result.payload?.message || 'Invalid email or password. Please try again.';
      setLocalError(message);
      setErrorKey((k) => k + 1);
    }
  };

  const errMsg = localError || error;

  return (
    <div className="pp-login-root">
      {/* ── Ambient blobs ── */}
      <div className="pp-blob pp-blob--gold" />
      <div className="pp-blob pp-blob--blue" />

      <main className="pp-main">
        <div className="pp-grid">
          {/* ───── Left column (desktop only) ───── */}
          <aside className="pp-left">
            <div className="pp-left__brand pp-anim" ref={sLogo}>
              <span className="pp-logo">PointPerks</span>
            </div>

            <h1 className="pp-left__heading pp-anim" ref={sHeading}>
              Welcome back to your <em>rewards</em> dashboard.
            </h1>

            <p className="pp-left__sub pp-anim" ref={sSub}>
              Sign in to track points, redeem vouchers, and manage your
              institutional rewards — all in one place.
            </p>

            <div className="pp-stat-card pp-anim" ref={sStatCard}>
              <div className="pp-stat-card__icon">
                <span style={icon(26, 1)}>monitoring</span>
              </div>
              <div>
                <span className="pp-stat-card__label">Platform Uptime</span>
                <p className="pp-stat-card__value">99.97% availability</p>
              </div>
            </div>

            <div className="pp-features">
              <div className="pp-feature pp-anim" ref={sFeat1}>
                <span style={icon(22)}>shield</span>
                <span>Two-Factor Authentication</span>
              </div>
              <div className="pp-feature pp-anim" ref={sFeat2}>
                <span style={icon(22)}>history</span>
                <span>Full Activity Audit Trail</span>
              </div>
              <div className="pp-feature pp-anim" ref={sFeat3}>
                <span style={icon(22)}>support_agent</span>
                <span>24 / 7 Dedicated Support</span>
              </div>
            </div>
          </aside>

          {/* ───── Right column: form (centered) ───── */}
          <div className="pp-form-wrap">
            <div className="pp-form-card pp-anim" ref={sCard}>
              {/* Mobile logo */}
              <div className="pp-form-card__mobile-brand">
                <span className="pp-logo pp-logo--sm">PointPerks</span>
              </div>

              <div className="pp-form-card__header">
                <h2>Sign In</h2>
                <p>Enter your credentials to continue.</p>
              </div>

              {/* Error banner */}
              {errMsg && (
                <div className="pp-error pp-error--enter" key={errorKey} role="alert">
                  <span style={icon(18, 1)}>error</span>
                  <span>{errMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="pp-form" noValidate>
                {/* Email */}
                <div className="pp-field pp-anim" ref={sEmail}>
                  <label htmlFor="login-email" className="pp-label">
                    Email Address
                  </label>
                  <div className="pp-input-wrap">
                    <span className="pp-input-icon" style={icon(20)}>
                      mail
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@institution.com"
                      className="pp-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="pp-field pp-anim" ref={sPw}>
                  <div className="pp-label-row">
                    <label htmlFor="login-pw" className="pp-label">
                      Password
                    </label>
                    <Link to="/forgot-password" className="pp-forgot">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="pp-input-wrap">
                    <span className="pp-input-icon" style={icon(20)}>
                      lock
                    </span>
                    <input
                      id="login-pw"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pp-input"
                    />
                    <button
                      type="button"
                      className="pp-toggle-pw"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span style={icon(20)}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit — with shimmer + arrow animation */}
                <div className="pp-anim" ref={sSubmit}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="pp-btn pp-btn--primary"
                  >
                    {loading ? (
                      <>
                        <span className="pp-spinner" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        <span className="pp-btn-text">Sign In</span>
                        <span className="pp-btn-arrow" style={icon(20)}>
                          arrow_forward
                        </span>
                        <span className="pp-shimmer" />
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="pp-divider pp-anim" ref={sDiv}>
                  <span>or continue with</span>
                </div>

                {/* Google */}
                <div className="pp-anim" ref={sGoogle}>
                  <button
                    type="button"
                    className="pp-btn pp-btn--google"
                    onClick={authAPI.googleLogin}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                </div>

                {/* Register link */}
                <p className="pp-register-link pp-anim" ref={sRegister}>
                  Don't have an account?{' '}
                  <Link to="/register">Register</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="pp-footer">
        <span>© {new Date().getFullYear()} PointPerks Institutional</span>
        <nav className="pp-footer__links">
          {['Privacy Policy', 'Terms of Service', 'Compliance', 'Contact'].map(
            (t) => (
              <a key={t} href="#!" onClick={(e) => e.preventDefault()}>
                {t}
              </a>
            )
          )}
        </nav>
      </footer>

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        /* ─── Reset & base ─── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .pp-login-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: ${C.surface};
          font-family: 'Inter', system-ui, sans-serif;
          color: ${C.onSurface};
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ══════════════════════════════════════════
           ANIMATIONS — keyframes
           ══════════════════════════════════════════ */

        /* Staggered entrance */
        .pp-anim {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .pp-anim.pp-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Desktop: left slides from left, card slides from right */
        @media (min-width: 1024px) {
          .pp-left .pp-anim {
            transform: translateX(-24px);
          }
          .pp-left .pp-anim.pp-visible {
            transform: translateX(0);
          }
          .pp-form-card.pp-anim {
            transform: translateX(24px) scale(0.97);
          }
          .pp-form-card.pp-anim.pp-visible {
            transform: translateX(0) scale(1);
          }
        }

        /* Error slide-down */
        .pp-error--enter {
          animation: pp-slideDown 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes pp-slideDown {
          from { opacity: 0; transform: translateY(-10px); max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
          to   { opacity: 1; transform: translateY(0);    max-height: 120px; margin-bottom: 16px; padding-top: 12px; padding-bottom: 12px; }
        }

        /* Ambient blob float */
        .pp-blob--gold {
          animation: pp-floatGold 18s ease-in-out infinite alternate;
        }
        .pp-blob--blue {
          animation: pp-floatBlue 22s ease-in-out infinite alternate;
        }
        @keyframes pp-floatGold {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-30px, 20px) scale(1.06); }
          100% { transform: translate(15px, -15px) scale(0.95); }
        }
        @keyframes pp-floatBlue {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(25px, -20px) scale(1.04); }
          100% { transform: translate(-10px, 25px) scale(0.97); }
        }

        /* Stat card icon pulse */
        .pp-stat-card__icon {
          animation: pp-iconPulse 3s ease-in-out infinite;
        }
        @keyframes pp-iconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(2, 36, 72, 0.25); }
          50%      { box-shadow: 0 0 0 10px rgba(2, 36, 72, 0); }
        }

        /* ─── BUTTON SHIMMER SWEEP ─── */
        .pp-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 70%
          );
          pointer-events: none;
          animation: pp-shimmer 3s ease-in-out infinite;
        }
        @keyframes pp-shimmer {
          0%, 100% { left: -100%; }
          50%      { left: 140%; }
        }

        /* ─── BUTTON ARROW NUDGE ON HOVER ─── */
        .pp-btn--primary:hover .pp-btn-arrow {
          animation: pp-arrowNudge 0.6s ease infinite;
        }
        @keyframes pp-arrowNudge {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(4px); }
        }

        /* ─── LOADING SPINNER ─── */
        .pp-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pp-spin 0.6s linear infinite;
        }
        @keyframes pp-spin {
          to { transform: rotate(360deg); }
        }

        /* Footer link underline sweep */
        .pp-footer__links a {
          position: relative;
        }
        .pp-footer__links a::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          width: 0; height: 1.5px;
          background: ${C.primary};
          transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pp-footer__links a:hover::after {
          width: 100%;
        }

        /* Input icon micro-bounce on focus */
        .pp-input:focus ~ .pp-input-icon,
        .pp-input-wrap:focus-within .pp-input-icon {
          animation: pp-iconBounce 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes pp-iconBounce {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        /* Google button icon wiggle on hover */
        .pp-btn--google:hover svg {
          animation: pp-wiggle 0.5s ease;
        }
        @keyframes pp-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-8deg); }
          75%      { transform: rotate(8deg); }
        }

        /* Register link arrow */
        .pp-register-link a::after {
          content: ' →';
          display: inline-block;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          font-weight: 400;
        }
        .pp-register-link a:hover::after {
          transform: translateX(4px);
        }

        /* Logo dot blink */
        .pp-logo::after {
          animation: pp-dotBlink 2.5s ease-in-out infinite;
        }
        @keyframes pp-dotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        /* Feature cards stagger on desktop */
        @media (min-width: 1024px) {
          .pp-feature.pp-visible:nth-child(1) { transition-delay: 0.05s; }
          .pp-feature.pp-visible:nth-child(2) { transition-delay: 0.12s; }
          .pp-feature.pp-visible:nth-child(3) { transition-delay: 0.19s; }
        }

        /* ══════════════════════════════════════════
           Reduced motion — disable all animations
           ══════════════════════════════════════════ */
        @media (prefers-reduced-motion: reduce) {
          .pp-anim {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .pp-blob--gold,
          .pp-blob--blue,
          .pp-stat-card__icon,
          .pp-shimmer,
          .pp-logo::after,
          .pp-spinner {
            animation: none !important;
          }
          .pp-error--enter {
            animation: none !important;
            opacity: 1;
            transform: none;
            max-height: none;
          }
          .pp-btn--primary:hover .pp-btn-arrow {
            animation: none !important;
          }
          .pp-btn--google:hover svg {
            animation: none !important;
          }
          .pp-footer__links a::after {
            transition: none !important;
          }
        }

        /* ══════════════════════════════════════════
           LAYOUT & COMPONENTS
           ══════════════════════════════════════════ */

        /* Ambient blobs */
        .pp-blob {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .pp-blob--gold {
          top: -10%; right: -8%;
          width: min(55vw, 600px); height: min(55vw, 600px);
          background: ${C.secondaryFixed};
          opacity: 0.18;
          filter: blur(120px);
        }
        .pp-blob--blue {
          bottom: -12%; left: -6%;
          width: min(45vw, 500px); height: min(45vw, 500px);
          background: ${C.primaryContainer};
          opacity: 0.10;
          filter: blur(100px);
        }

        /* Main layout */
        .pp-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
          position: relative;
          z-index: 1;
        }
        .pp-grid {
          width: 100%;
          max-width: 1060px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: center;
        }

        /* Left column (hidden on mobile) */
        .pp-left {
          display: none;
          flex-direction: column;
          gap: 20px;
          padding-right: 32px;
        }
        .pp-left__brand { margin-bottom: 8px; }
        .pp-left__heading {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(30px, 3.2vw, 46px);
          font-weight: 700;
          line-height: 1.12;
          color: ${C.primary};
          max-width: 440px;
        }
        .pp-left__heading em { font-style: normal; color: ${C.secondary}; }
        .pp-left__sub {
          font-size: 17px;
          line-height: 1.65;
          color: ${C.onSurfaceVariant};
          max-width: 380px;
        }

        /* Stat card */
        .pp-stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 22px;
          background: ${C.surfaceLowest};
          border: 1px solid ${C.outlineVariant};
          border-left: 4px solid ${C.primary};
          border-radius: 10px;
          margin-top: 8px;
        }
        .pp-stat-card__icon {
          width: 50px; height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${C.primaryContainer} 0%, ${C.primary} 100%);
          display: grid;
          place-items: center;
          color: ${C.onPrimary};
          flex-shrink: 0;
        }
        .pp-stat-card__label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.09em;
          color: ${C.onSurfaceVariant};
        }
        .pp-stat-card__value {
          font-family: 'Poppins', sans-serif;
          font-size: 22px; font-weight: 700;
          color: ${C.primary}; line-height: 1.25;
        }

        /* Features */
        .pp-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }
        .pp-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px; font-weight: 600;
          color: ${C.onSurfaceVariant};
          padding: 14px 16px;
          background: ${C.surfaceLow};
          border-radius: 8px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pp-feature:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(2,36,72,0.06);
        }
        .pp-feature > span:first-child { color: ${C.primary}; }

        /* Form wrapper — centers the card */
        .pp-form-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        /* Form card */
        .pp-form-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid ${C.outlineVariant};
          border-radius: 14px;
          padding: 32px 24px 28px;
          box-shadow:
            0 4px 24px rgba(2,36,72,0.06),
            0 1px 4px rgba(2,36,72,0.04);
        }
        .pp-form-card__mobile-brand {
          display: flex;
          justify-content: center;
          margin-bottom: 4px;
        }
        .pp-form-card__header {
          text-align: center;
          margin-bottom: 24px;
        }
        .pp-form-card__header h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 22px; font-weight: 700;
          color: ${C.primary};
          margin-bottom: 4px;
        }
        .pp-form-card__header p {
          font-size: 14px;
          color: ${C.onSurfaceVariant};
        }

        /* Logo */
        .pp-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 26px; font-weight: 800;
          color: ${C.primary};
          letter-spacing: -0.02em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pp-logo::after {
          content: '';
          width: 7px; height: 7px;
          border-radius: 50%;
          background: ${C.secondaryFixedDim};
          display: inline-block;
        }
        .pp-logo--sm { font-size: 22px; }

        /* Error */
        .pp-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: ${C.errorContainer};
          color: ${C.error};
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13.5px; font-weight: 500;
          line-height: 1.45;
          overflow: hidden;
        }
        .pp-error > span:first-child { flex-shrink: 0; margin-top: 1px; }

        /* Form */
        .pp-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pp-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pp-label {
          font-size: 13px; font-weight: 600;
          color: ${C.onSurfaceVariant};
        }

        .pp-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pp-forgot {
          font-size: 12px;
          font-weight: 600;
          color: ${C.primary};
          text-decoration: none;
          transition: opacity 0.12s;
          position: relative;
        }
        .pp-forgot:hover { opacity: 0.75; }
        .pp-forgot::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          width: 0; height: 1px;
          background: ${C.primary};
          transition: width 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pp-forgot:hover::after { width: 100%; }

        .pp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pp-input-icon {
          position: absolute;
          left: 12px;
          color: ${C.outline};
          pointer-events: none;
          z-index: 1;
        }
        .pp-input {
          width: 100%;
          height: 46px;
          padding: 0 14px 0 40px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: ${C.onSurface};
          background: ${C.surfaceLowest};
          border: 1.5px solid ${C.outlineVariant};
          border-radius: 8px;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .pp-input::placeholder { color: ${C.outline}; }
        .pp-input:focus {
          outline: none;
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(2,36,72,0.08);
          background: ${C.surfaceLowest};
        }
        .pp-input-wrap:has(.pp-toggle-pw) .pp-input { padding-right: 44px; }

        .pp-toggle-pw {
          position: absolute;
          right: 4px; top: 50%;
          transform: translateY(-50%);
          width: 36px; height: 36px;
          display: grid;
          place-items: center;
          background: none;
          border: none;
          cursor: pointer;
          color: ${C.outline};
          border-radius: 6px;
          transition: background 0.12s, color 0.12s, transform 0.2s;
        }
        .pp-toggle-pw:hover { background: ${C.surfaceLow}; color: ${C.onSurface}; }
        .pp-toggle-pw:active { transform: translateY(-50%) scale(0.9); }

        /* ─── Buttons ─── */
        .pp-btn {
          width: 100%;
          height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.25s, border-color 0.2s;
          -webkit-tap-highlight-color: transparent;
          position: relative;
          overflow: hidden;
        }
        .pp-btn:active:not(:disabled) { transform: scale(0.97); }
        .pp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .pp-btn--primary {
          background: ${C.primary};
          color: ${C.onPrimary};
          margin-top: 8px;
        }
        .pp-btn--primary:hover:not(:disabled) {
          background: ${C.primaryHover};
          box-shadow: 0 6px 20px rgba(2,36,72,0.22);
        }
        .pp-btn-arrow {
          display: inline-flex;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .pp-btn--google {
          background: ${C.surfaceLowest};
          color: ${C.onSurface};
          border: 1.5px solid ${C.outlineVariant};
          font-weight: 600;
        }
        .pp-btn--google:hover {
          background: ${C.surfaceLow};
          border-color: ${C.outline};
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        /* Divider */
        .pp-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 4px 0;
        }
        .pp-divider::before,
        .pp-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: ${C.outlineVariant};
        }
        .pp-divider span {
          font-size: 11px; font-weight: 600;
          color: ${C.outline};
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* Register link */
        .pp-register-link {
          text-align: center;
          font-size: 14px;
          color: ${C.onSurfaceVariant};
          margin-top: 4px;
        }
        .pp-register-link a {
          color: ${C.primary};
          font-weight: 700;
          text-decoration: none;
          transition: opacity 0.12s;
          position: relative;
        }
        .pp-register-link a:hover { opacity: 0.8; }

        /* Footer */
        .pp-footer {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 16px;
          background: ${C.surfaceContainerHighest};
          border-top: 1px solid ${C.outlineVariant};
          font-size: 12px;
          color: ${C.onSurfaceVariant};
        }
        .pp-footer__links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px 20px;
        }
        .pp-footer__links a {
          color: ${C.onSurfaceVariant};
          text-decoration: none;
        }

        /* ══════════════════════════════════════════
           Desktop (≥1024px)
           ══════════════════════════════════════════ */
        @media (min-width: 1024px) {
          .pp-main { padding: 40px 32px; }
          .pp-grid { grid-template-columns: 1fr 1fr; gap: 56px; }
          .pp-left { display: flex; }
          .pp-form-card__mobile-brand { display: none; }
          .pp-form-card { padding: 40px 36px 32px; }
          .pp-footer {
            flex-direction: row;
            justify-content: space-between;
            padding: 28px 40px;
          }
        }

        /* Small mobile (≤380px) */
        @media (max-width: 380px) {
          .pp-main { padding: 16px 10px 32px; }
          .pp-form-card { padding: 24px 16px 22px; border-radius: 12px; }
          .pp-input { height: 44px; font-size: 14px; }
          .pp-btn { height: 44px; font-size: 13px; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;