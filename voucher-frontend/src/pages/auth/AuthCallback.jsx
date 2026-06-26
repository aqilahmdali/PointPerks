import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { authAPI, referralAPI } from '../../services/api';

/* ── Design tokens ───────────────────────────────────────────────── */
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  primaryFixed: '#d5e3ff',
  secondaryFixed: '#ffdfa0',
  secondaryFixedDim: '#f6be39',
  surface: '#f9f9f8',
  surfaceLowest: '#ffffff',
  surfaceContainerHigh: '#e8e8e7',
  surfaceContainerHighest: '#e2e2e2',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#43474e',
  onPrimary: '#ffffff',
};

/**
 * AuthCallback
 * Handles the Google OAuth redirect: /auth/callback?token=JWT
 * Shows the branded authenticating screen while the token is validated.
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const progressRef = useRef(null);

  /* ── Progress bar simulation ───────────────────────────────────── */
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;

    let width = 0;
    const interval = setInterval(() => {
      if (width >= 90) {
        clearInterval(interval);
      } else {
        const increment = width < 60 ? 1.5 : 0.4;
        width += increment;
        bar.style.width = width + '%';
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  /* ── Auth logic ────────────────────────────────────────────────── */
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=google_failed');
      return;
    }

    localStorage.setItem('token', token);

    authAPI
      .getMe()
      .then(async (res) => {
        const user = res.data.user;
        dispatch(setCredentials({ token, user }));

        const pendingCode = localStorage.getItem('pendingReferralCode');
        if (pendingCode) {
          localStorage.removeItem('pendingReferralCode');
          try {
            await referralAPI.apply(pendingCode);
          } catch (err) {
            console.error('Referral apply failed:', err?.response?.data?.message || err.message);
          }
        }

        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=auth_failed');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        background: C.surface,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Auth Card */}
      <main
        style={{
          width: '100%',
          maxWidth: 448,
          background: C.surfaceLowest,
          borderRadius: 12,
          padding: 48,
          border: `1px solid ${C.surfaceContainerHighest}`,
          boxShadow: '0px 12px 32px rgba(30, 58, 95, 0.08)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Brand identity */}
        <div style={{ marginBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: C.primary,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.onPrimary,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: C.onSurfaceVariant,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            PointPerks
          </h2>
        </div>

        {/* Spinner */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 48,
          }}
        >
          <svg
            width={96}
            height={96}
            viewBox="0 0 96 96"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="transparent"
              stroke={C.surfaceContainerHigh}
              strokeWidth="4"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="transparent"
              stroke={C.primary}
              strokeWidth="4"
              strokeLinecap="round"
              className="pp-auth-ring"
            />
          </svg>

          {/* Centre icon */}
          <div style={{ position: 'absolute' }}>
            <span
              className="material-symbols-outlined pp-auth-pulse"
              style={{ fontSize: 32, color: C.primaryContainer }}
            >
              key
            </span>
          </div>
        </div>

        {/* Feedback text */}
        <div style={{ marginBottom: 48 }}>
          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 24,
              fontWeight: 600,
              color: C.onSurface,
              marginBottom: 8,
            }}
          >
            Authenticating...
          </h1>
          <p
            style={{
              fontSize: 16,
              color: C.onSurfaceVariant,
              maxWidth: 280,
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Please wait while we securely sign you in to your PointPerks institutional account.
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            background: C.surfaceContainerHigh,
            height: 4,
            borderRadius: 9999,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <div
            ref={progressRef}
            style={{
              height: '100%',
              width: '0%',
              background: C.secondaryFixedDim,
              borderRadius: 9999,
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>

        {/* Retry link */}
        <div style={{ paddingTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.onSurfaceVariant, margin: 0 }}>
            Taking too long?{' '}
            <a
              href="/login"
              style={{
                color: C.primary,
                fontWeight: 700,
                textDecoration: 'none',
                marginLeft: 4,
                transition: 'text-decoration 0.15s',
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
            >
              Go back to login
            </a>
          </p>
        </div>

        {/* Background decoration blobs */}
        <div
          style={{
            position: 'absolute',
            bottom: -48,
            right: -48,
            width: 128,
            height: 128,
            background: C.primaryFixed,
            opacity: 0.1,
            borderRadius: '50%',
            filter: 'blur(24px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -48,
            left: -48,
            width: 128,
            height: 128,
            background: C.secondaryFixed,
            opacity: 0.1,
            borderRadius: '50%',
            filter: 'blur(24px)',
            pointerEvents: 'none',
          }}
        />
      </main>

      {/* ── Styles ─────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        @keyframes pp-ring-rotate {
          0%   { stroke-dashoffset: 280; transform: rotate(0deg); }
          50%  { stroke-dashoffset: 70;  transform: rotate(180deg); }
          100% { stroke-dashoffset: 280; transform: rotate(360deg); }
        }
        @keyframes pp-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .pp-auth-ring {
          stroke-dasharray: 280;
          animation: pp-ring-rotate 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .pp-auth-pulse {
          animation: pp-pulse 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .pp-auth-ring, .pp-auth-pulse { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;