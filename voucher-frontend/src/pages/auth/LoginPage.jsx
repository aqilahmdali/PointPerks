import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';

/* ── Design tokens (mirrors the Tailwind config) ───────────────── */
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  ctaGold: '#D4A017',
  secondary: '#795900',
  secondaryContainer: '#ffc641',
  surface: '#f9f9f8',
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

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    // Clear any existing errors when the page loads
    dispatch(clearError());
    // Trigger entrance animation
    const timer = setTimeout(() => {
      const card = document.querySelector('.pp-login-card');
      if (card) card.classList.add('pp-visible');
    }, 100);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    // The Redux thunk will handle the API call, saving the token, and updating state
    const result = await dispatch(loginUser({ email, password }));
    
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } else {
      setLocalError(result.payload?.message || 'Invalid email or password. Please try again.');
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

  const displayError = localError || error;

  return (
    <div
      style={{
        background: C.surface,
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        color: C.onSurface,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Subtle Background Elements */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '40%', background: `${C.primary}10`, borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '30%', height: '30%', background: `${C.secondary}10`, borderRadius: '50%', filter: 'blur(80px)' }} />
      </div>

      {/* Main Content Canvas */}
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: 448 }}>
          {/* Brand Identity Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 800, color: C.primary, letterSpacing: '-0.02em', marginBottom: 8 }}>
              PointPerks
            </h1>
            <p style={{ fontSize: 16, color: C.onSurfaceVariant }}>
              The institutional standard for rewards.
            </p>
          </div>

          {/* Login Card */}
          <div
            className="pp-login-card pp-reveal"
            style={{
              background: C.surfaceLowest,
              boxShadow: '0px 4px 20px rgba(30, 58, 95, 0.04)',
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12,
              padding: 40,
            }}
          >
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 600, color: C.primary, marginBottom: 4 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: C.onSurfaceVariant }}>
                Please enter your details to sign in.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Error Message */}
              {displayError && (
                <div style={{ background: C.errorContainer, color: C.error, padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
                  {displayError}
                </div>
              )}

              {/* Email Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: C.onSurfaceVariant }} htmlFor="email">
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ ...ms(20), position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.outline }}>
                    mail
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="pp-input"
                    style={{ paddingLeft: 40, paddingRight: 16 }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: C.onSurfaceVariant }} htmlFor="password">
                    Password
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: C.primary, textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ ...ms(20), position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.outline }}>
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pp-input"
                    style={{ paddingLeft: 40, paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ ...ms(20), color: C.outline, transition: 'color 0.2s' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="pp-btn-primary"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                <div style={{ flexGrow: 1, height: 1, background: C.outlineVariant }} />
                <span style={{ fontSize: 12, color: C.outline, fontWeight: 600 }}>OR</span>
                <div style={{ flexGrow: 1, height: 1, background: C.outlineVariant }} />
              </div>

              {/* Social Login */}
              <button
                type="button"
                onClick={authAPI.googleLogin}
                className="pp-btn-google"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>

            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 16, color: C.onSurfaceVariant }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                  Register
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Badges / Footer Info */}
          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={ms(18)}>verified_user</span>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ISO 27001 Certified
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={ms(18)}>lock_reset</span>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                256-bit Encryption
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Shared Footer */}
      <footer
        style={{
          width: '100%',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '48px 24px',
          background: C.surfaceContainerHighest,
          borderTop: `1px solid ${C.outlineVariant}`,
          gap: 16,
        }}
      >
        <p style={{ fontSize: 12, color: C.onSurfaceVariant, textAlign: 'left' }}>
          © {new Date().getFullYear()} PointPerks Institutional. All rights reserved.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
          {['Privacy Policy', 'Terms of Service', 'Compliance', 'Contact'].map((link) => (
            <span key={link} style={{ fontSize: 12, color: C.onSurfaceVariant, cursor: 'pointer', transition: 'color 0.15s' }}>
              {link}
            </span>
          ))}
        </div>
      </footer>

      {/* ── Styles ───────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .pp-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pp-reveal.pp-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .pp-input {
          width: 100%;
          padding-top: 12px;
          padding-bottom: 12px;
          background: ${C.surface};
          border: 1px solid ${C.outlineVariant};
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          color: ${C.onSurface};
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .pp-input:focus {
          outline: none;
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(2, 36, 72, 0.1);
        }

        .pp-btn-primary {
          background: ${C.primary};
          color: ${C.onPrimary};
          border: none;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0px 4px 20px rgba(30, 58, 95, 0.04);
        }
        .pp-btn-primary:hover:not(:disabled) {
          background: ${C.primaryContainer};
        }
        .pp-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }
        .pp-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .pp-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: ${C.surface};
          border: 1px solid ${C.outlineVariant};
          color: ${C.onSurface};
          padding: 12px 16px;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pp-btn-google:hover {
          background: ${C.surfaceContainerHighest};
        }
        .pp-btn-google:active {
          transform: scale(0.98);
        }

        @media (max-width: 768px) {
          footer {
            flex-direction: column !important;
            text-align: center !important;
          }
          footer p {
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;