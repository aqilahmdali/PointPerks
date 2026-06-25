import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { authAPI, referralAPI } from '../../services/api';

/* ── Design tokens ─────────────────────────────────────────────── */
const C = {
  primary: '#022448',
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
  successContainer: '#c4f0c4',
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (form.referralCode && form.referralCode.length >= 6) {
      referralAPI.validate(form.referralCode)
        .then((res) => setReferrerInfo(res.data))
        .catch(() => setReferrerInfo(null));
    } else {
      setReferrerInfo(null);
    }
  }, [form.referralCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    const referralCode = form.referralCode.trim().toUpperCase();
    if (referralCode) {
      payload.referralCode = referralCode;
    }

    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Welcome to PointPerks 🎉');
      navigate('/dashboard');
    } else {
      const message = result.payload || 'Registration failed. Please check your details and try again.';
      setLocalError(message);
      toast.error(message);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.surface, fontFamily: "'Inter', sans-serif", color: C.onSurface }}>
      
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Ambient Background Decoration */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600, background: C.secondaryFixed, opacity: 0.15, borderRadius: '50%', filter: 'blur(120px)', transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40vw', height: '40vw', maxWidth: 500, maxHeight: 500, background: C.secondaryContainer, opacity: 0.1, borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(-25%, 25%)', pointerEvents: 'none' }} />

        <div className="pp-register-grid" style={{ width: '100%', maxWidth: 1100, display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center', zIndex: 10 }}>
          
          {/* Left Side: Branding & Content */}
          <div className="pp-left-col" style={{ display: 'none', flexDirection: 'column', gap: 24, paddingRight: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>
                PointPerks
              </span>
              <div style={{ height: 6, width: 6, borderRadius: '50%', background: C.secondaryFixedDim, marginTop: 8 }}></div>
            </div>
            
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, color: C.primary, lineHeight: 1.1, maxWidth: 440, margin: 0 }}>
              Start your journey to <span style={{ color: C.secondary }}>premium</span> rewards.
            </h1>
            
            <p style={{ fontSize: 18, lineHeight: 1.6, color: C.onSurfaceVariant, maxWidth: 380, margin: 0 }}>
              Join thousands of institutional users redeeming exclusive vouchers and tracking points with precision.
            </p>

            {/* Signup Bonus Callout Card */}
            <div className="pp-glass-card" style={{ padding: 24, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${C.secondaryFixedDim}` }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${C.secondaryContainer} 0%, ${C.ctaGold || '#D4A017'} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#261a00' }}>
                <span style={ms(24, 1)}>card_giftcard</span>
              </div>
              <div>
                <p style={{ fontSize: 14, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Welcome Offer</p>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 600, color: C.primary, margin: 0 }}>Get 100 points on sign up</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32 }}>
              <div style={{ padding: 16, background: C.surfaceLow, borderRadius: 8 }}>
                <span style={{ ...ms(24), color: C.primary, marginBottom: 8 }}>verified_user</span>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, margin: 0 }}>Institutional Grade Security</p>
              </div>
              <div style={{ padding: 16, background: C.surfaceLow, borderRadius: 8 }}>
                <span style={{ ...ms(24), color: C.primary, marginBottom: 8 }}>bolt</span>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, margin: 0 }}>Instant Voucher Delivery</p>
              </div>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="pp-glass-card" style={{ width: '100%', maxWidth: 440, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderRadius: 12, padding: 40, border: `1px solid ${C.outlineVariant}`, boxShadow: '0px 12px 32px rgba(30, 58, 95, 0.08)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                <div className="pp-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>
                    PointPerks
                  </span>
                </div>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 600, color: C.primary, margin: 0 }}>Create Account</h2>
                <p style={{ color: C.onSurfaceVariant, margin: 0 }}>Step into the future of voucher management.</p>
              </div>

              {(localError || error) && (
                <div style={{ background: C.errorContainer, color: C.error, padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
                  {localError || error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* Full Name Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: C.onSurfaceVariant }} htmlFor="name">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="name" required type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="pp-input" style={{ paddingLeft: 40 }}
                    />
                    <span style={{ ...ms(20), position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.outline }}>person</span>
                  </div>
                </div>

                {/* Email Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: C.onSurfaceVariant }} htmlFor="email">Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="email" required type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@email.com"
                      className="pp-input" style={{ paddingLeft: 40 }}
                    />
                    <span style={{ ...ms(20), position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.outline }}>mail</span>
                  </div>
                </div>

                {/* Password Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: C.onSurfaceVariant }} htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password" required type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="pp-input" style={{ paddingLeft: 40, paddingRight: 40 }}
                    />
                    <span style={{ ...ms(20), position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.outline }}>lock</span>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <span style={{ ...ms(20), color: C.outline }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Referral Code Field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: C.onSurfaceVariant }} htmlFor="referralCode">
                    Referral Code <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="referralCode" type="text"
                      value={form.referralCode}
                      onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. AB12CD34"
                      className="pp-input" style={{ paddingLeft: 40 }}
                    />
                    <span style={{ ...ms(20), position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.outline }}>redeem</span>
                  </div>
                  {referrerInfo?.valid && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: C.success, fontSize: 12, fontWeight: 600 }}>
                      <span style={ms(16, 1)}>check_circle</span>
                      Referred by {referrerInfo.referrerName} — bonus applies on signup
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading} className="pp-btn-primary" style={{ width: '100%', marginTop: 16, padding: '14px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? 'Creating account...' : 'Register Account'}
                  {!loading && <span style={ms(20)}>arrow_forward</span>}
                </button>

                {/* Mobile-only bonus callout */}
                <div className="pp-mobile-bonus" style={{ display: 'none', marginTop: 16, padding: 16, background: C.secondaryFixed, borderRadius: 8, alignItems: 'center', gap: 12 }}>
                  <span style={{ ...ms(24, 1), color: '#261a00' }}>card_giftcard</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#261a00', margin: 0 }}>100 bonus points on sign up!</p>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                  <div style={{ flexGrow: 1, height: 1, background: C.outlineVariant }} />
                  <span style={{ fontSize: 12, color: C.outline, fontWeight: 600 }}>OR</span>
                  <div style={{ flexGrow: 1, height: 1, background: C.outlineVariant }} />
                </div>

                {/* Google Login */}
                <button type="button" onClick={authAPI.googleLogin} className="pp-btn-google">
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <p style={{ fontSize: 16, color: C.onSurfaceVariant, margin: 0 }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                      Log in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 24px', background: C.surfaceContainerHighest, borderTop: `1px solid ${C.outlineVariant}`, gap: 16, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .pp-input {
          width: 100%;
          padding-top: 12px;
          padding-bottom: 12px;
          padding-right: 16px;
          background: #ffffff;
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
          background: #ffffff;
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
          background: ${C.surfaceLow};
        }

        @media (min-width: 1024px) {
          .pp-register-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .pp-left-col {
            display: flex !important;
          }
        }

        @media (max-width: 1023px) {
          .pp-mobile-logo {
            display: flex !important;
          }
          .pp-mobile-bonus {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
