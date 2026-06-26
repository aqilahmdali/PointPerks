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
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [idx]);
  return ref;
}

/* ── Spinner component ─────────────────────────────────────────── */
const Spinner = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    style={{ animation: 'pp-spin 0.6s linear infinite', flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32 32" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [focusedField, setFocusedField] = useState(null);

  // Stagger refs
  const sLogo = useStagger(0);
  const sTagline = useStagger(1);
  const sCard = useStagger(0);
  const sHead = useStagger(1);
  const sEmail = useStagger(2);
  const sPw = useStagger(3);
  const sSubmit = useStagger(4);
  const sDiv = useStagger(5);
  const sGoogle = useStagger(6);
  const sFooterLink = useStagger(7);
  const sBadge1 = useStagger(8);
  const sBadge2 = useStagger(9);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const result = await dispatch(loginUser({ email: email.trim().toLowerCase(), password }));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    } else {
      const message = result.payload?.message || 'Invalid email or password. Please try again.';
      setLocalError(message);
      setErrorKey((k) => k + 1);
    }
  };

  const displayError = localError || error;

  return (
    <div className="pp-register-root">
      {/* Ambient blobs */}
      <div className="pp-blob pp-blob--gold" />
      <div className="pp-blob pp-blob--blue" />

      <main className="pp-main">
        <div className="pp-container">
          {/* Header */}
          <header className="pp-header">
            <div className="pp-anim" ref={sLogo}>
              <h1 className="pp-logo">PointPerks</h1>
            </div>
            <p className="pp-tagline pp-anim" ref={sTagline}>
              The institutional standard for rewards.
            </p>
          </header>

          {/* Card */}
          <div className="pp-form-card pp-anim" ref={sCard}>
            <div className="pp-form-card__header pp-anim" ref={sHead}>
              <h2>Welcome back</h2>
              <p>Enter your details to sign in.</p>
            </div>

            <form className="pp-form" onSubmit={handleSubmit} noValidate>
              {/* Error */}
              {displayError && (
                <div className="pp-error pp-error--enter" key={errorKey} role="alert">
                  <span className="material-symbols-outlined">error</span>
                  <span>{displayError}</span>
                </div>
              )}

              {/* Email */}
              <div className={`pp-field pp-anim${focusedField === 'email' ? ' pp-field--focused' : ''}`} ref={sEmail}>
                <label className="pp-label" htmlFor="email">Email Address</label>
                <div className="pp-input-wrap">
                  <span className="pp-input-icon material-symbols-outlined">mail</span>
                  <input
                    id="email" name="email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => { setEmail(e.target.value); if(localError) setLocalError(''); }}
                    onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    placeholder="name@email.com" className="pp-input"
                  />
                  <span className="pp-input-line" />
                </div>
              </div>

              {/* Password */}
              <div className={`pp-field pp-anim${focusedField === 'password' ? ' pp-field--focused' : ''}`} ref={sPw}>
                <div className="pp-label-row">
                  <label className="pp-label" htmlFor="password">Password</label>
                  <Link className="pp-link" to="/forgot-password">Forgot Password?</Link>
                </div>
                <div className="pp-input-wrap">
                  <span className="pp-input-icon material-symbols-outlined">lock</span>
                  <input
                    id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    required autoComplete="current-password"
                    value={password} onChange={(e) => { setPassword(e.target.value); if(localError) setLocalError(''); }}
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    placeholder="••••••••" className="pp-input pp-input--pw"
                  />
                  <button
                    type="button" className="pp-toggle-pw"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                  <span className="pp-input-line" />
                </div>
              </div>

              {/* Submit */}
              <div className="pp-anim" ref={sSubmit}>
                <button type="submit" disabled={loading} className="pp-btn pp-btn--primary">
                  {loading ? (
                    <><Spinner /> Signing in…</>
                  ) : (
                    <>
                      <span>Sign In</span>
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
                <button type="button" className="pp-btn pp-btn--google" onClick={authAPI.googleLogin}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </form>

            <p className="pp-card__footer pp-anim" ref={sFooterLink}>
              Don't have an account?{' '}
              <Link className="pp-link pp-link--bold" to="/register">Register</Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="pp-badges">
            <div className="pp-badge pp-anim" ref={sBadge1}>
              <span className="material-symbols-outlined">verified_user</span>
              ISO 27001 Certified
            </div>
            <div className="pp-badge pp-anim" ref={sBadge2}>
              <span className="material-symbols-outlined">lock_reset</span>
              256-bit Encryption
            </div>
          </div>
        </div>
      </main>

      <footer className="pp-footer">
        <p>© {new Date().getFullYear()} PointPerks Institutional. All rights reserved.</p>
        <nav className="pp-footer__links">
          {['Privacy Policy', 'Terms of Service', 'Compliance', 'Contact'].map((t) => (
            <a key={t} href="#!" onClick={(e) => e.preventDefault()} className="pp-footer__link">{t}</a>
          ))}
        </nav>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@24,400,0..1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          user-select: none;
        }

        .pp-register-root {
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

        /* Card specific entrance (slides up + slight scale like register) */
        @media (min-width: 1024px) {
          .pp-form-card.pp-anim { transform: translateY(24px) scale(0.98); }
          .pp-form-card.pp-anim.pp-visible { transform: translateY(0) scale(1); }
        }

        .pp-error--enter { animation: pp-slideDown 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes pp-slideDown {
          from { opacity: 0; transform: translateY(-10px); max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
          to   { opacity: 1; transform: translateY(0);    max-height: 120px; margin-bottom: 20px; padding-top: 12px; padding-bottom: 12px; }
        }

        .pp-blob--gold { animation: pp-floatGold 18s ease-in-out infinite alternate; }
        .pp-blob--blue { animation: pp-floatBlue 22s ease-in-out infinite alternate; }
        @keyframes pp-floatGold {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(-30px,20px) scale(1.06); }
          100% { transform: translate(15px,-15px) scale(0.95); }
        }
        @keyframes pp-floatBlue {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(25px,-20px) scale(1.04); }
          100% { transform: translate(-10px,25px) scale(0.97); }
        }

        .pp-shimmer {
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
          pointer-events: none;
          animation: pp-shimmer 3.5s ease-in-out infinite;
        }
        @keyframes pp-shimmer {
          0%, 100% { left: -100%; }
          50%      { left: 140%; }
        }
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        @keyframes pp-iconBounce {
          0%   { transform: translateY(-50%) scale(1); }
          40%  { transform: translateY(-50%) scale(1.25); }
          100% { transform: translateY(-50%) scale(1); }
        }
        @keyframes pp-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-10deg); }
          75%      { transform: rotate(10deg); }
        }
        .pp-logo::after { animation: pp-dotBlink 2.5s ease-in-out infinite; }
        @keyframes pp-dotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        /* ══════════════════════════════════════════
           HOVER ANIMATIONS
           ══════════════════════════════════════════ */

        /* ── Inputs ── */
        .pp-input {
          width: 100%;
          height: 46px;
          padding: 0 14px 0 40px;
          font-family: inherit;
          font-size: 15px;
          color: ${C.onSurface};
          background: ${C.surfaceLowest};
          border: 1.5px solid ${C.outlineVariant};
          border-radius: 8px;
          outline: none;
          position: relative;
          z-index: 1;
          transition: border-color 0.25s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.25s cubic-bezier(0.22,1,0.36,1),
                      background 0.25s ease;
        }
        .pp-input::placeholder { color: ${C.outline}; transition: color 0.2s; }
        .pp-input:hover {
          border-color: #9ca3af;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .pp-input:hover::placeholder { color: #9ca3af; }
        .pp-input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(2,36,72,0.1);
          background: #fff;
        }
        .pp-input--pw { padding-right: 44px; }

        /* Animated underline */
        .pp-input-line {
          position: absolute;
          bottom: 0; left: 50%;
          width: 0; height: 2px;
          background: ${C.primary};
          border-radius: 0 0 8px 8px;
          transition: width 0.35s cubic-bezier(0.22,1,0.36,1),
                      left 0.35s cubic-bezier(0.22,1,0.36,1);
          z-index: 2;
          pointer-events: none;
        }
        .pp-input:focus ~ .pp-input-line {
          width: 100%; left: 0;
        }

        /* Input icon */
        .pp-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          color: ${C.outline};
          pointer-events: none;
          z-index: 3;
          transition: color 0.25s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .pp-input-wrap:hover .pp-input-icon { color: #6b7280; }
        .pp-input:focus ~ .pp-input-icon {
          color: ${C.primary};
          animation: pp-iconBounce 0.4s cubic-bezier(0.22,1,0.36,1);
        }

        /* Label focus state */
        .pp-label {
          font-size: 13px; font-weight: 600;
          color: ${C.onSurfaceVariant};
          transition: color 0.25s ease;
        }
        .pp-field--focused .pp-label { color: ${C.primary}; }

        /* Toggle password */
        .pp-toggle-pw {
          position: absolute; right: 4px; top: 50%;
          transform: translateY(-50%);
          display: grid; place-items: center;
          width: 36px; height: 36px;
          background: none; border: none; border-radius: 6px;
          cursor: pointer; color: ${C.outline}; z-index: 3;
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }
        .pp-toggle-pw:hover { background: ${C.surfaceLow}; color: ${C.onSurfaceVariant}; }
        .pp-toggle-pw:active { transform: translateY(-50%) scale(0.88); }
        .pp-toggle-pw .material-symbols-outlined { font-size: 20px; }

        /* ── Buttons ── */
        .pp-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; height: 46px;
          border-radius: 8px; border: none;
          font-family: inherit; font-size: 14px; font-weight: 700;
          cursor: pointer; position: relative; overflow: hidden;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.15s, box-shadow 0.3s, background 0.25s, border-color 0.25s;
        }
        .pp-btn:active:not(:disabled) { transform: scale(0.97); }
        .pp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .pp-btn--primary {
          background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%);
          color: ${C.onPrimary};
          box-shadow: 0 2px 12px rgba(2,36,72,0.12);
        }
        .pp-btn--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, ${C.primaryHover} 0%, ${C.primaryContainer} 100%);
          box-shadow: 0 6px 24px rgba(2,36,72,0.28), 0 2px 6px rgba(2,36,72,0.15);
          transform: translateY(-1px);
        }
        .pp-btn--primary:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
          box-shadow: 0 2px 8px rgba(2,36,72,0.18);
        }
        /* Ripple glow */
        .pp-btn--primary::before {
          content: ''; position: absolute;
          top: 50%; left: 50%; width: 0; height: 0;
          background: rgba(255,255,255,0.06);
          border-radius: 50%; transform: translate(-50%, -50%);
          transition: width 0.5s ease, height 0.5s ease;
          pointer-events: none;
        }
        .pp-btn--primary:hover::before { width: 300px; height: 300px; }

        .pp-btn--google {
          background: ${C.surfaceLowest}; color: ${C.onSurface};
          border: 1.5px solid ${C.outlineVariant}; font-weight: 600;
        }
        .pp-btn--google:hover {
          background: ${C.surfaceLow}; border-color: #9ca3af;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px);
        }
        .pp-btn--google:active:not(:disabled) { transform: translateY(0) scale(0.97); box-shadow: none; }
        .pp-btn--google svg {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), filter 0.3s;
          filter: drop-shadow(0 0 0 transparent);
        }
        .pp-btn--google:hover svg {
          animation: pp-wiggle 0.5s ease;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }

        /* ── Form Card ── */
        .pp-form-card {
          width: 100%; max-width: 440px; margin: 0 auto;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border: 1px solid ${C.outlineVariant};
          border-radius: 14px;
          padding: 36px 32px 32px;
          box-shadow: 0 4px 24px rgba(2,36,72,0.06), 0 1px 4px rgba(2,36,72,0.04);
          transition: box-shadow 0.4s ease, border-color 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        @media (min-width: 1024px) {
          .pp-form-card:hover {
            box-shadow: 0 12px 48px rgba(2,36,72,0.1), 0 2px 8px rgba(2,36,72,0.06);
            border-color: #b0b5be;
            transform: translateY(-3px);
          }
        }
        .pp-form-card__header { margin-bottom: 28px; }
        .pp-form-card__header h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 22px; font-weight: 600;
          color: ${C.primary}; line-height: 1.3;
        }
        .pp-form-card__header p { margin-top: 4px; font-size: 14px; color: ${C.onSurfaceVariant}; }

        /* ── Error Banner ── */
        .pp-error {
          display: flex; align-items: center; gap: 10px;
          background: ${C.errorContainer}; color: ${C.error};
          padding: 12px 14px; border-radius: 8px;
          font-size: 13px; font-weight: 500; line-height: 1.4;
          overflow: hidden; border-left: 3px solid transparent;
          transition: border-color 0.3s, background 0.3s;
        }
        .pp-error:hover { border-left-color: ${C.error}; background: #ffe0dc; }
        .pp-error .material-symbols-outlined { font-size: 20px; flex-shrink: 0; }

        /* ── Layout Elements ── */
        .pp-field { display: flex; flex-direction: column; gap: 6px; }
        .pp-label-row { display: flex; justify-content: space-between; align-items: center; }
        .pp-input-wrap { position: relative; display: flex; align-items: center; }

        .pp-form { display: flex; flex-direction: column; gap: 20px; }

        .pp-divider {
          display: flex; align-items: center; gap: 14px; padding: 4px 0;
        }
        .pp-divider::before, .pp-divider::after {
          content: ''; flex: 1; height: 1px; background: ${C.outlineVariant};
          transition: background 0.3s;
        }
        .pp-divider:hover::before, .pp-divider:hover::after { background: #9ca3af; }
        .pp-divider span {
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
          color: ${C.outline}; text-transform: uppercase;
          transition: color 0.3s;
        }
        .pp-divider:hover span { color: ${C.onSurfaceVariant}; }

        .pp-link {
          font-size: 12px; font-weight: 600; color: ${C.primary};
          text-decoration: none; position: relative; transition: color 0.2s;
        }
        .pp-link:hover { color: ${C.primaryHover}; }
        .pp-link--bold { font-size: 14px; }
        
        /* Register link arrow slide */
        .pp-link--bold::after {
          content: ' →'; display: inline-block; font-weight: 400;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.2s;
          opacity: 0;
        }
        .pp-link--bold:hover::after { transform: translateX(4px); opacity: 1; }

        .pp-card__footer { margin-top: 28px; text-align: center; font-size: 14px; color: ${C.onSurfaceVariant}; }

        /* ── Trust Badges ── */
        .pp-badges {
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 16px; margin-top: 28px;
        }
        .pp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; color: ${C.onSurfaceVariant};
          padding: 10px 16px;
          background: ${C.surfaceLowest};
          border: 1px solid ${C.outlineVariant};
          border-radius: 8px;
          border-left: 3px solid transparent;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s, border-color 0.3s, color 0.3s;
          cursor: default;
        }
        .pp-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(2,36,72,0.06);
          border-left-color: ${C.primary};
          color: ${C.onSurface};
        }
        .pp-badge .material-symbols-outlined {
          font-size: 17px; color: ${C.primary};
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), color 0.3s;
        }
        .pp-badge:hover .material-symbols-outlined {
          color: ${C.secondary}; transform: scale(1.15);
        }

        /* ── Footer ── */
        .pp-footer {
          position: relative; z-index: 1;
          display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
          gap: 12px; padding: 20px 24px;
          background: ${C.surfaceContainerHighest};
          border-top: 1px solid ${C.outlineVariant};
          font-size: 12px; color: ${C.onSurfaceVariant};
        }
        .pp-footer__links { display: flex; flex-wrap: wrap; gap: 20px; }
        .pp-footer__link {
          color: ${C.onSurfaceVariant}; text-decoration: none;
          position: relative; transition: color 0.25s;
        }
        .pp-footer__link::after {
          content: ''; position: absolute;
          left: 0; bottom: -2px; width: 0; height: 1.5px;
          background: ${C.primary};
          transition: width 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .pp-footer__link:hover { color: ${C.primary}; }
        .pp-footer__link:hover::after { width: 100%; }

        /* ── Blobs ── */
        .pp-blob {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }
        .pp-blob--gold {
          top: -12%; right: -6%;
          width: min(55vw, 600px); height: min(55vw, 600px);
          background: ${C.secondaryFixed};
          opacity: 0.18; filter: blur(120px);
        }
        .pp-blob--blue {
          bottom: -10%; left: -6%;
          width: min(45vw, 500px); height: min(45vw, 500px);
          background: ${C.primaryContainer};
          opacity: 0.10; filter: blur(100px);
        }

        /* ── Header ── */
        .pp-main {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 48px 16px 40px; position: relative; z-index: 1;
        }
        .pp-container { width: 100%; max-width: 440px; }
        .pp-header { text-align: center; margin-bottom: 28px; }
        .pp-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 26px; font-weight: 800;
          color: ${C.primary}; letter-spacing: -0.03em;
          display: inline-flex; align-items: center; gap: 6px;
          transition: filter 0.3s; cursor: default;
        }
        .pp-logo:hover { filter: brightness(1.1); }
        .pp-logo::after {
          content: ''; width: 7px; height: 7px;
          border-radius: 50%; background: ${C.secondaryFixedDim};
          display: inline-block;
        }
        .pp-tagline { margin-top: 6px; font-size: 15px; color: ${C.onSurfaceVariant}; }

        /* ══════════════════════════════════════════
           RESPONSIVE
           ══════════════════════════════════════════ */
        @media (max-width: 480px) {
          .pp-form-card { padding: 28px 20px 24px; }
          .pp-footer { flex-direction: column; text-align: center; }
          .pp-footer__links { justify-content: center; }
          .pp-input { height: 44px; font-size: 14px; }
          .pp-btn { height: 44px; font-size: 13px; }
        }

        /* ══════════════════════════════════════════
           REDUCED MOTION
           ══════════════════════════════════════════ */
        @media (prefers-reduced-motion: reduce) {
          .pp-anim {
            opacity: 1 !important; transform: none !important; transition: none !important;
          }
          .pp-blob--gold, .pp-blob--blue, .pp-logo::after,
          .pp-shimmer { animation: none !important; }
          .pp-error--enter {
            animation: none !important; opacity: 1; transform: none; max-height: none;
          }
          .pp-btn--google:hover svg { animation: none !important; }
          .pp-input-line { display: none !important; }
          *, *::before, *::after { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;