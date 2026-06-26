import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { referralAPI } from '../../services/api';

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

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [checkingRef, setCheckingRef] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [focusedField, setFocusedField] = useState(null);

  const sLogo = useStagger(0);
  const sHeading = useStagger(1);
  const sSub = useStagger(2);
  const sBonus = useStagger(3);
  const sFeat1 = useStagger(4);
  const sFeat2 = useStagger(5);
  const sFeat3 = useStagger(6);
  const sCard = useStagger(0);
  const sName = useStagger(1);
  const sEmail = useStagger(2);
  const sPw = useStagger(3);
  const sRef = useStagger(4);
  const sSubmit = useStagger(5);
  const sMobileBonus = useStagger(6);
  const sDiv = useStagger(7);
  const sGoogle = useStagger(8);
  const sLogin = useStagger(9);

  useEffect(() => {
    const code = form.referralCode.trim();
    if (code.length < 6) { setReferrerInfo(null); return; }
    setCheckingRef(true);
    const timer = setTimeout(() => {
      referralAPI
        .validate(code)
        .then((res) => setReferrerInfo(res.data))
        .catch(() => setReferrerInfo(null))
        .finally(() => setCheckingRef(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [form.referralCode]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());
    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      setErrorKey((k) => k + 1);
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };
    const referralCode = form.referralCode.trim().toUpperCase();
    if (referralCode) payload.referralCode = referralCode;
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Welcome to PointPerks 🎉');
      navigate('/dashboard');
    } else {
      const message = result.payload || 'Registration failed. Please try again.';
      setLocalError(message);
      setErrorKey((k) => k + 1);
      toast.error(message);
    }
  };

  const errMsg = localError || error;

  return (
    <div className="pp-register-root">
      <div className="pp-blob pp-blob--gold" />
      <div className="pp-blob pp-blob--blue" />

      <main className="pp-main">
        <div className="pp-grid">
          {/* ───── Left column ───── */}
          <aside className="pp-left">
            <div className="pp-left__brand pp-anim" ref={sLogo}>
              <span className="pp-logo">PointPerks</span>
            </div>

            <h1 className="pp-left__heading pp-anim" ref={sHeading}>
              Start your journey to <em>premium</em> rewards.
            </h1>

            <p className="pp-left__sub pp-anim" ref={sSub}>
              Join thousands of institutional users redeeming exclusive vouchers
              and tracking points with precision.
            </p>

            <div className="pp-bonus-card pp-anim" ref={sBonus}>
              <div className="pp-bonus-card__icon">
                <span style={icon(26, 1)}>card_giftcard</span>
              </div>
              <div>
                <span className="pp-bonus-card__label">Welcome Offer</span>
                <p className="pp-bonus-card__value">Get 100 points on sign up</p>
              </div>
            </div>

            <div className="pp-features">
              <div className="pp-feature pp-anim" ref={sFeat1}>
                <span className="pp-feature__icon" style={icon(22)}>verified_user</span>
                <span>Institutional Grade Security</span>
              </div>
              <div className="pp-feature pp-anim" ref={sFeat2}>
                <span className="pp-feature__icon" style={icon(22)}>bolt</span>
                <span>Instant Voucher Delivery</span>
              </div>
              <div className="pp-feature pp-anim" ref={sFeat3}>
                <span className="pp-feature__icon" style={icon(22)}>support_agent</span>
                <span>24 / 7 Dedicated Support</span>
              </div>
            </div>
          </aside>

          {/* ───── Form column ───── */}
          <div className="pp-form-wrap">
            <div className="pp-form-card pp-anim" ref={sCard}>
              <div className="pp-form-card__mobile-brand">
                <span className="pp-logo pp-logo--sm">PointPerks</span>
              </div>

              <div className="pp-form-card__header">
                <h2>Create Account</h2>
                <p>Step into the future of voucher management.</p>
              </div>

              {errMsg && (
                <div className="pp-error pp-error--enter" key={errorKey} role="alert">
                  <span style={icon(18, 1)}>error</span>
                  <span>{errMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="pp-form" noValidate>
                {/* Name */}
                <div
                  className={`pp-field pp-anim${focusedField === 'name' ? ' pp-field--focused' : ''}`}
                  ref={sName}
                >
                  <label htmlFor="reg-name" className="pp-label">Full Name</label>
                  <div className="pp-input-wrap">
                    <span className="pp-input-icon" style={icon(20)}>person</span>
                    <input
                      id="reg-name" type="text" required autoComplete="name"
                      value={form.name} onChange={handleChange('name')}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Jane Doe" className="pp-input"
                    />
                    <span className="pp-input-line" />
                  </div>
                </div>

                {/* Email */}
                <div
                  className={`pp-field pp-anim${focusedField === 'email' ? ' pp-field--focused' : ''}`}
                  ref={sEmail}
                >
                  <label htmlFor="reg-email" className="pp-label">Email Address</label>
                  <div className="pp-input-wrap">
                    <span className="pp-input-icon" style={icon(20)}>mail</span>
                    <input
                      id="reg-email" type="email" required autoComplete="email"
                      value={form.email} onChange={handleChange('email')}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="name@institution.com" className="pp-input"
                    />
                    <span className="pp-input-line" />
                  </div>
                </div>

                {/* Password */}
                <div
                  className={`pp-field pp-anim${focusedField === 'password' ? ' pp-field--focused' : ''}`}
                  ref={sPw}
                >
                  <label htmlFor="reg-pw" className="pp-label">Password</label>
                  <div className="pp-input-wrap">
                    <span className="pp-input-icon" style={icon(20)}>lock</span>
                    <input
                      id="reg-pw"
                      type={showPassword ? 'text' : 'password'}
                      required autoComplete="new-password"
                      value={form.password} onChange={handleChange('password')}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Min. 8 characters" className="pp-input"
                    />
                    <button
                      type="button" className="pp-toggle-pw"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span style={icon(20)}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                    <span className="pp-input-line" />
                  </div>
                  {form.password.length > 0 && form.password.length < 8 && (
                    <span className="pp-hint pp-hint--warn pp-hint--enter">
                      <span style={icon(14)}>info</span>
                      Must be at least 8 characters
                    </span>
                  )}
                </div>

                {/* Referral */}
                <div
                  className={`pp-field pp-anim${focusedField === 'ref' ? ' pp-field--focused' : ''}`}
                  ref={sRef}
                >
                  <label htmlFor="reg-ref" className="pp-label">
                    Referral Code <span className="pp-label__optional">(optional)</span>
                  </label>
                  <div className="pp-input-wrap">
                    <span className="pp-input-icon" style={icon(20)}>redeem</span>
                    <input
                      id="reg-ref" type="text" autoComplete="off"
                      value={form.referralCode}
                      onChange={(e) => setForm((p) => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                      onFocus={() => setFocusedField('ref')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. AB12CD34" className="pp-input"
                    />
                    {checkingRef && (
                      <span className="pp-ref-spinner" style={icon(20, 1)}>progress_activity</span>
                    )}
                    <span className="pp-input-line" />
                  </div>
                  {referrerInfo?.valid && (
                    <span className="pp-hint pp-hint--ok pp-hint--enter" key="ok">
                      <span style={icon(14, 1)}>check_circle</span>
                      Referred by {referrerInfo.referrerName} — bonus applies
                    </span>
                  )}
                  {!checkingRef && form.referralCode.trim().length >= 6 && !referrerInfo?.valid && (
                    <span className="pp-hint pp-hint--warn pp-hint--enter" key="warn">
                      <span style={icon(14)}>warning</span>
                      Code not recognised
                    </span>
                  )}
                </div>

                {/* Submit */}
                <div className="pp-anim" ref={sSubmit}>
                  <button type="submit" disabled={loading} className="pp-btn pp-btn--primary">
                    {loading ? (
                      <><span className="pp-spinner" />Creating account…</>
                    ) : (
                      <>
                        <span className="pp-btn-text">Register Account</span>
                        <span className="pp-btn-arrow" style={icon(20)}>arrow_forward</span>
                        <span className="pp-shimmer" />
                      </>
                    )}
                  </button>
                </div>

                <div className="pp-mobile-bonus pp-anim" ref={sMobileBonus}>
                  <span style={icon(20, 1)}>card_giftcard</span>
                  <span>100 bonus points on sign up!</span>
                </div>

                <div className="pp-divider pp-anim" ref={sDiv}><span>or continue with</span></div>

                <div className="pp-anim" ref={sGoogle}>
                  <button type="button" className="pp-btn pp-btn--google">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <p className="pp-login-link pp-anim" ref={sLogin}>
                  Already have an account? <Link to="/login">Log in</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="pp-footer">
        <span>© {new Date().getFullYear()} PointPerks Institutional</span>
        <nav className="pp-footer__links">
          {['Privacy Policy', 'Terms of Service', 'Compliance', 'Contact'].map((t) => (
            <a key={t} href="#!" onClick={(e) => e.preventDefault()}>{t}</a>
          ))}
        </nav>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
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
           KEYFRAMES
           ══════════════════════════════════════════ */
        .pp-anim {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.5s cubic-bezier(0.22,1,0.36,1),
                      transform 0.5s cubic-bezier(0.22,1,0.36,1);
          will-change: opacity, transform;
        }
        .pp-anim.pp-visible { opacity: 1; transform: translateY(0); }

        @media (min-width: 1024px) {
          .pp-left .pp-anim { transform: translateX(-24px); }
          .pp-left .pp-anim.pp-visible { transform: translateX(0); }
          .pp-form-card.pp-anim { transform: translateX(24px) scale(0.97); }
          .pp-form-card.pp-anim.pp-visible { transform: translateX(0) scale(1); }
        }

        .pp-error--enter { animation: pp-slideDown 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes pp-slideDown {
          from { opacity: 0; transform: translateY(-10px); max-height: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; }
          to   { opacity: 1; transform: translateY(0);    max-height: 120px; margin-bottom: 16px; padding-top: 12px; padding-bottom: 12px; }
        }

        .pp-hint--enter { animation: pp-fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes pp-fadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
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

        .pp-bonus-card__icon { animation: pp-iconPulse 3s ease-in-out infinite; }
        @keyframes pp-iconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(246,190,57,0.35); }
          50%      { box-shadow: 0 0 0 10px rgba(246,190,57,0); }
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

        .pp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pp-spin 0.6s linear infinite;
        }
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        .pp-ref-spinner { animation: pp-spin 1s linear infinite; }

        .pp-mobile-bonus { animation: pp-breathe 4s ease-in-out infinite; }
        @keyframes pp-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.015); }
        }

        .pp-logo::after { animation: pp-dotBlink 2.5s ease-in-out infinite; }
        @keyframes pp-dotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        /* ══════════════════════════════════════════
           HOVER ANIMATIONS
           ══════════════════════════════════════════ */

        /* ── Input fields ── */
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
          transition:
            border-color 0.25s cubic-bezier(0.22,1,0.36,1),
            box-shadow 0.25s cubic-bezier(0.22,1,0.36,1),
            background 0.25s ease;
          position: relative;
          z-index: 1;
        }
        .pp-input::placeholder { color: ${C.outline}; transition: color 0.2s; }

        /* Hover: warm border + subtle shadow lift */
        .pp-input:hover {
          border-color: #9ca3af;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .pp-input:hover::placeholder { color: #9ca3af; }

        /* Focus: full primary ring */
        .pp-input:focus {
          outline: none;
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(2,36,72,0.1);
          background: #fff;
        }

        /* Animated underline that expands on focus */
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
          width: 100%;
          left: 0;
        }

        /* Input icon: color shift on hover + bounce on focus */
        .pp-input-icon {
          position: absolute;
          left: 12px;
          color: ${C.outline};
          pointer-events: none;
          z-index: 3;
          transition: color 0.25s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .pp-input-wrap:hover .pp-input-icon { color: #6b7280; }
        .pp-input:focus ~ .pp-input-icon,
        .pp-input-wrap:focus-within .pp-input-icon {
          color: ${C.primary};
          animation: pp-iconBounce 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes pp-iconBounce {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }

        /* Label: color intensifies when field is focused */
        .pp-label {
          font-size: 13px; font-weight: 600;
          color: ${C.onSurfaceVariant};
          transition: color 0.25s ease, letter-spacing 0.25s ease;
        }
        .pp-field--focused .pp-label {
          color: ${C.primary};
          letter-spacing: 0.01em;
        }

        /* Toggle password button */
        .pp-toggle-pw {
          position: absolute;
          right: 4px; top: 50%;
          transform: translateY(-50%);
          width: 36px; height: 36px;
          display: grid; place-items: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: ${C.outline};
          border-radius: 6px;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
          z-index: 3;
        }
        .pp-toggle-pw:hover {
          background: ${C.surfaceLow};
          color: ${C.onSurfaceVariant};
        }
        .pp-toggle-pw:active { transform: translateY(-50%) scale(0.88); }

        /* ── Primary button ── */
        .pp-btn {
          width: 100%; height: 46px;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          border: none; border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          position: relative; overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.3s ease, background 0.25s ease, border-color 0.25s ease;
        }
        .pp-btn:active:not(:disabled) { transform: scale(0.97); }
        .pp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .pp-btn--primary {
          background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%);
          background-size: 100% 100%;
          color: ${C.onPrimary};
          margin-top: 8px;
        }
        /* Hover: gradient shifts brighter + deeper shadow + slight lift */
        .pp-btn--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, ${C.primaryHover} 0%, ${C.primaryContainer} 100%);
          box-shadow:
            0 6px 24px rgba(2,36,72,0.28),
            0 2px 6px rgba(2,36,72,0.15);
          transform: translateY(-1px);
        }
        .pp-btn--primary:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
          box-shadow: 0 2px 8px rgba(2,36,72,0.18);
        }

        /* Arrow nudge on hover */
        .pp-btn-arrow {
          display: inline-flex;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.2s;
          opacity: 0.7;
        }
        .pp-btn--primary:hover .pp-btn-arrow {
          transform: translateX(5px);
          opacity: 1;
        }

        /* Ripple glow behind button on hover */
        .pp-btn--primary::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          width: 0; height: 0;
          background: rgba(255,255,255,0.06);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.5s ease, height 0.5s ease;
          pointer-events: none;
        }
        .pp-btn--primary:hover::before {
          width: 300px; height: 300px;
        }

        /* ── Google button ── */
        .pp-btn--google {
          background: ${C.surfaceLowest};
          color: ${C.onSurface};
          border: 1.5px solid ${C.outlineVariant};
          font-weight: 600;
        }
        .pp-btn--google:hover {
          background: ${C.surfaceLow};
          border-color: #9ca3af;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }
        .pp-btn--google:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
          box-shadow: none;
        }
        .pp-btn--google svg {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), filter 0.3s;
          filter: drop-shadow(0 0 0 transparent);
        }
        .pp-btn--google:hover svg {
          animation: pp-wiggle 0.5s ease;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }
        @keyframes pp-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-10deg); }
          75%      { transform: rotate(10deg); }
        }

        /* ── Form card (desktop hover lift) ── */
        .pp-form-card {
          width: 100%; max-width: 420px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid ${C.outlineVariant};
          border-radius: 14px;
          padding: 32px 24px 28px;
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

        /* ── Bonus card (left column) ── */
        .pp-bonus-card {
          display: flex; align-items: center; gap: 16px;
          padding: 20px 22px;
          background: ${C.surfaceLowest};
          border: 1px solid ${C.outlineVariant};
          border-left: 4px solid ${C.secondaryFixedDim};
          border-radius: 10px;
          margin-top: 8px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          cursor: default;
        }
        .pp-bonus-card:hover {
          border-left-color: ${C.secondaryContainer};
          box-shadow: 0 4px 16px rgba(121,89,0,0.08);
          transform: translateX(4px);
        }
        .pp-bonus-card:hover .pp-bonus-card__icon {
          transform: scale(1.08) rotate(-5deg);
        }
        .pp-bonus-card__icon {
          width: 50px; height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${C.secondaryContainer} 0%, #d4a017 100%);
          display: grid; place-items: center;
          color: #261a00; flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
        }

        /* ── Feature cards ── */
        .pp-features { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .pp-feature {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; font-weight: 600;
          color: ${C.onSurfaceVariant};
          padding: 14px 16px;
          background: ${C.surfaceLow};
          border-radius: 8px;
          border-left: 3px solid transparent;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s ease,
                      background 0.3s ease,
                      border-color 0.3s ease,
                      color 0.3s ease;
          cursor: default;
        }
        .pp-feature:hover {
          transform: translateY(-3px) translateX(2px);
          box-shadow: 0 6px 20px rgba(2,36,72,0.07);
          background: ${C.surfaceLowest};
          border-left-color: ${C.primary};
          color: ${C.onSurface};
        }
        .pp-feature__icon {
          color: ${C.primary};
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), color 0.3s;
        }
        .pp-feature:hover .pp-feature__icon {
          color: ${C.secondary};
          transform: scale(1.15);
        }

        /* ── Login link ── */
        .pp-login-link {
          text-align: center; font-size: 14px;
          color: ${C.onSurfaceVariant}; margin-top: 4px;
        }
        .pp-login-link a {
          color: ${C.primary}; font-weight: 700;
          text-decoration: none;
          position: relative;
          transition: color 0.2s;
        }
        .pp-login-link a::after {
          content: ' →';
          display: inline-block;
          font-weight: 400;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.2s;
          opacity: 0;
        }
        .pp-login-link a:hover { color: ${C.primaryHover}; }
        .pp-login-link a:hover::after {
          transform: translateX(4px);
          opacity: 1;
        }

        /* ── Mobile bonus strip hover ── */
        .pp-mobile-bonus {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px;
          background: ${C.secondaryFixed};
          border-radius: 8px;
          font-size: 13px; font-weight: 700;
          color: #261a00;
          transition: background 0.2s, transform 0.2s;
          cursor: default;
        }
        .pp-mobile-bonus:hover {
          background: ${C.secondaryContainer};
        }

        /* ── Footer links ── */
        .pp-footer__links a {
          color: ${C.onSurfaceVariant};
          text-decoration: none;
          position: relative;
          transition: color 0.25s ease;
        }
        .pp-footer__links a::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          width: 0; height: 1.5px;
          background: ${C.primary};
          transition: width 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .pp-footer__links a:hover { color: ${C.primary}; }
        .pp-footer__links a:hover::after { width: 100%; }

        /* ── Logo hover ── */
        .pp-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 26px; font-weight: 800;
          color: ${C.primary};
          letter-spacing: -0.02em;
          display: inline-flex; align-items: center; gap: 6px;
          transition: filter 0.3s ease;
          cursor: default;
        }
        .pp-logo:hover { filter: brightness(1.1); }
        .pp-logo::after {
          content: '';
          width: 7px; height: 7px;
          border-radius: 50%;
          background: ${C.secondaryFixedDim};
          display: inline-block;
        }

        /* ── Error banner hover ── */
        .pp-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: ${C.errorContainer};
          color: ${C.error};
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13.5px; font-weight: 500;
          line-height: 1.45;
          overflow: hidden;
          border-left: 3px solid transparent;
          transition: border-color 0.3s, background 0.3s;
        }
        .pp-error:hover {
          border-left-color: ${C.error};
          background: #ffe0dc;
        }

        /* ── Success hint hover ── */
        .pp-hint--ok {
          transition: color 0.2s, transform 0.2s;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .pp-hint--ok:hover { transform: translateX(2px); }

        /* ══════════════════════════════════════════
           LAYOUT
           ══════════════════════════════════════════ */
        .pp-blob {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }
        .pp-blob--gold {
          top: -10%; right: -8%;
          width: min(55vw, 600px); height: min(55vw, 600px);
          background: ${C.secondaryFixed};
          opacity: 0.18; filter: blur(120px);
        }
        .pp-blob--blue {
          bottom: -12%; left: -6%;
          width: min(45vw, 500px); height: min(45vw, 500px);
          background: ${C.primaryContainer};
          opacity: 0.10; filter: blur(100px);
        }

        .pp-main {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px 40px;
          position: relative; z-index: 1;
        }
        .pp-grid {
          width: 100%; max-width: 1060px;
          display: grid; grid-template-columns: 1fr;
          gap: 40px; align-items: center;
        }

        .pp-left {
          display: none; flex-direction: column;
          gap: 20px; padding-right: 32px;
        }
        .pp-left__brand { margin-bottom: 8px; }
        .pp-left__heading {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(30px, 3.2vw, 46px);
          font-weight: 700; line-height: 1.12;
          color: ${C.primary}; max-width: 440px;
        }
        .pp-left__heading em { font-style: normal; color: ${C.secondary}; }
        .pp-left__sub {
          font-size: 17px; line-height: 1.65;
          color: ${C.onSurfaceVariant}; max-width: 380px;
        }

        .pp-bonus-card__label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.09em;
          color: ${C.onSurfaceVariant};
        }
        .pp-bonus-card__value {
          font-family: 'Poppins', sans-serif;
          font-size: 22px; font-weight: 700;
          color: ${C.primary}; line-height: 1.25;
        }

        .pp-form-wrap { display: flex; justify-content: center; width: 100%; }
        .pp-form-card__mobile-brand { display: flex; justify-content: center; margin-bottom: 4px; }
        .pp-form-card__header { text-align: center; margin-bottom: 24px; }
        .pp-form-card__header h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 22px; font-weight: 700;
          color: ${C.primary}; margin-bottom: 4px;
        }
        .pp-form-card__header p { font-size: 14px; color: ${C.onSurfaceVariant}; }

        .pp-logo--sm { font-size: 22px; }

        .pp-form { display: flex; flex-direction: column; gap: 14px; }
        .pp-field { display: flex; flex-direction: column; gap: 5px; }
        .pp-label__optional { font-weight: 400; color: ${C.outline}; }

        .pp-input-wrap { position: relative; display: flex; align-items: center; }
        .pp-input-wrap:has(.pp-toggle-pw) .pp-input { padding-right: 44px; }
        .pp-input-wrap:has(.pp-ref-spinner) .pp-input { padding-right: 40px; }

        .pp-hint {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 12px; font-weight: 600; padding-top: 2px;
        }
        .pp-hint--warn { color: #b45309; }

        .pp-divider {
          display: flex; align-items: center; gap: 14px; padding: 4px 0;
        }
        .pp-divider::before, .pp-divider::after {
          content: ''; flex: 1; height: 1px; background: ${C.outlineVariant};
          transition: background 0.3s;
        }
        .pp-divider:hover::before,
        .pp-divider:hover::after { background: #9ca3af; }
        .pp-divider span {
          font-size: 11px; font-weight: 600;
          color: ${C.outline}; text-transform: uppercase;
          letter-spacing: 0.06em; white-space: nowrap;
          transition: color 0.3s;
        }
        .pp-divider:hover span { color: ${C.onSurfaceVariant}; }

        .pp-footer {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 24px 16px;
          background: ${C.surfaceContainerHighest};
          border-top: 1px solid ${C.outlineVariant};
          font-size: 12px; color: ${C.onSurfaceVariant};
        }
        .pp-footer__links {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 20px;
        }

        /* Feature stagger delays */
        @media (min-width: 1024px) {
          .pp-feature.pp-visible:nth-child(1) { transition-delay: 0.05s; }
          .pp-feature.pp-visible:nth-child(2) { transition-delay: 0.12s; }
          .pp-feature.pp-visible:nth-child(3) { transition-delay: 0.19s; }
        }

        /* ══════════════════════════════════════════
           RESPONSIVE
           ══════════════════════════════════════════ */
        @media (min-width: 1024px) {
          .pp-main { padding: 40px 32px; }
          .pp-grid { grid-template-columns: 1fr 1fr; gap: 56px; }
          .pp-left { display: flex; }
          .pp-form-card__mobile-brand { display: none; }
          .pp-mobile-bonus { display: none; }
          .pp-form-card { padding: 40px 36px 32px; }
          .pp-footer { flex-direction: row; justify-content: space-between; padding: 28px 40px; }
        }
        @media (max-width: 380px) {
          .pp-main { padding: 16px 10px 32px; }
          .pp-form-card { padding: 24px 16px 22px; border-radius: 12px; }
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
          .pp-blob--gold, .pp-blob--blue, .pp-bonus-card__icon,
          .pp-shimmer, .pp-mobile-bonus, .pp-logo::after,
          .pp-ref-spinner, .pp-spinner { animation: none !important; }
          .pp-error--enter, .pp-hint--enter {
            animation: none !important; opacity: 1; transform: none; max-height: none;
          }
          .pp-btn--primary:hover .pp-btn-arrow,
          .pp-btn--google:hover svg { animation: none !important; }
          .pp-input-line { display: none !important; }
          *, *::before, *::after { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;