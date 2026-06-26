import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { userAPI, redemptionAPI } from '../../services/api';
import { fetchMe, logoutUser } from '../../store/slices/authSlice';

// PointPerks Theme Colors
const C = {
  primary: '#022448',
  primaryContainer: '#1e3a5f',
  secondary: '#795900',
  secondaryFixed: '#ffdfa0',
  secondaryContainer: '#ffc641',
  tertiary: '#002252',
  surface: '#f9f9f8',
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
  errorContainer: '#ffdad6',
};

/* ── Shared styles (no container padding — layout handles that) ── */
const styles = {
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
  header: { marginBottom: 32 },
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
};

const ppStyles = `
  .pp-header { display: flex; flex-direction: column; gap: 24px; align-items: flex-start; background: ${C.surfaceContainerLowest}; padding: 24px; border-radius: 12px; box-shadow: 0px 4px 20px rgba(30, 58, 95, 0.04); margin-bottom: 24px; border: 1px solid ${C.surfaceVariant}; }
  @media (min-width: 768px) { .pp-header { flex-direction: row; align-items: center; } }

  .pp-avatar-wrap { position: relative; flex-shrink: 0; }
  .pp-avatar { width: 96px; height: 96px; border-radius: 9999px; overflow: hidden; border: 4px solid ${C.surfaceContainerHigh}; background: ${C.primary}; color: ${C.white}; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 700; font-family: 'Poppins', sans-serif; }
  .pp-avatar-btn { position: absolute; bottom: 0; right: 0; background: ${C.primary}; color: ${C.white}; padding: 8px; border-radius: 9999px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
  .pp-avatar-btn:hover { transform: scale(1.1); }

  .pp-header-info { flex: 1; text-align: center; }
  @media (min-width: 768px) { .pp-header-info { text-align: left; } }

  .pp-h2 { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; color: ${C.primary}; margin: 0; }
  .pp-tag { background: ${C.secondaryContainer}; color: ${C.secondary}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

  .pp-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
  @media (min-width: 1024px) { .pp-grid { grid-template-columns: 2fr 1fr; } }

  .pp-col { display: flex; flex-direction: column; gap: 24px; min-width: 0; }

  .pp-card { background: ${C.surfaceContainerLowest}; padding: 24px; border-radius: 12px; box-shadow: 0px 4px 20px rgba(30, 58, 95, 0.04); border: 1px solid ${C.surfaceVariant}; }
  .pp-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid ${C.surfaceVariant}; padding-bottom: 8px; color: ${C.primary}; }
  .pp-card-title { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; margin: 0; }

  .pp-form-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
  @media (min-width: 768px) { .pp-form-grid { grid-template-columns: 1fr 1fr; } }
  .pp-form-group { display: flex; flex-direction: column; gap: 4px; }
  .pp-label { font-size: 14px; font-weight: 500; color: ${C.onSurfaceVariant}; margin-left: 4px; }
  .pp-input { width: 100%; border: 1px solid ${C.outlineVariant}; background: ${C.surface}; border-radius: 8px; padding: 12px 16px; font-size: 16px; color: ${C.primary}; outline: none; font-family: 'Inter', sans-serif; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; }
  .pp-input:focus { border-color: ${C.primary}; box-shadow: 0 0 0 2px rgba(2, 36, 72, 0.1); }
  .pp-input:read-only { cursor: default; background-color: ${C.surfaceContainerLow}; }

  .pp-link-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; transition: background 0.2s; text-decoration: none; color: ${C.onSurfaceVariant}; }
  .pp-link-row:hover { background: ${C.surfaceContainerLow}; }
  .pp-link-title { font-size: 14px; font-weight: 500; flex: 1; color: ${C.onSurface}; }

  .pp-loyalty-card { background: linear-gradient(135deg, ${C.primary} 0%, ${C.primaryContainer} 100%); padding: 24px; border-radius: 12px; color: ${C.white}; position: relative; overflow: hidden; box-shadow: 0 10px 15px rgba(2, 36, 72, 0.1); }
  .pp-loyalty-pattern { position: absolute; inset: 0; opacity: 0.1; pointer-events: none; background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px; }
  .pp-loyalty-val { font-family: 'Poppins', sans-serif; font-size: 40px; font-weight: 800; line-height: 1; margin: 8px 0 0; }
  .pp-progress-track { width: 100%; height: 12px; background: rgba(255,255,255,0.2); border-radius: 9999px; overflow: hidden; margin-top: 8px; }
  .pp-progress-bar { height: 100%; background: ${C.secondaryContainer}; border-radius: 9999px; transition: width 1s ease-out; }

  .pp-btn { padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Poppins', sans-serif; font-size: 14px; }
  .pp-btn-primary { background: ${C.primary}; color: ${C.white}; }
  .pp-btn-primary:hover { background: ${C.primaryContainer}; }
  .pp-btn-outline { background: transparent; border: 1.5px solid ${C.primary}; color: ${C.primary}; }
  .pp-btn-outline:hover { background: ${C.surfaceContainerLow}; }
  .pp-btn-danger { background: transparent; border: 1px solid ${C.error}; color: ${C.error}; width: 100%; }
  .pp-btn-danger:hover { background: ${C.errorContainer}; }
  .pp-btn-gold { background: ${C.secondaryFixed}; color: ${C.secondary}; width: 100%; }
  .pp-btn-gold:hover { background: ${C.secondaryContainer}; }

  .pp-footer-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid ${C.surfaceVariant}; }
  @media (min-width: 640px) { .pp-footer-actions { flex-direction: row; justify-content: flex-end; } }

  .pp-material { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased; }
`;

const ProfilePage = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [activeVouchers, setActiveVouchers] = useState(0);

  const ms = (size = 24, fill = 0) => ({
    fontFamily: "'Material Symbols Outlined'",
    fontSize: size,
    fontVariationSettings: `"FILL" ${fill}, "wght" 400, "GRAD" 0, "opsz" 24`,
    lineHeight: 1,
    display: 'inline-block',
    verticalAlign: 'middle',
  });

  useEffect(() => {
    redemptionAPI.getMy({ status: 'active', limit: 1, page: 1 })
      .then((res) => {
        const count = res.data.pagination?.total || (Array.isArray(res.data.data) ? res.data.data.length : 0);
        setActiveVouchers(count);
      })
      .catch(() => setActiveVouchers(0));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await userAPI.updateProfile({ name: name.trim() });
      await dispatch(fetchMe());
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const targetPoints = 15000;
  const progress = user?.points ? Math.min(100, (user.points / targetPoints) * 100) : 0;

  return (
    <div>
      <style>{ppStyles}</style>

      {/* BREADCRUMB */}
      <nav style={styles.breadcrumb}>
        <button onClick={() => navigate('/dashboard')} style={styles.breadcrumbLink}>
          <span style={ms(16, 0)}>home</span>
          Home
        </button>
        <span style={{ color: C.outlineVariant }}>/</span>
        <span style={{ color: C.onSurface, fontWeight: 600 }}>Profile</span>
      </nav>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Profile</h1>
        <p style={styles.subtitle}>Manage your account details, points balance, and quick links.</p>
      </div>

      {/* Profile Header Card */}
      <header className="pp-header">
        <div className="pp-avatar-wrap">
          <div className="pp-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
        </div>

        <div className="pp-header-info" style={{ textAlign: 'left' }}>
          <h2 className="pp-h2">{user?.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <span className="pp-tag">{user?.role || 'Member'}</span>
            <span style={{ color: C.onSurfaceVariant, fontSize: '14px' }}>{user?.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexShrink: 0, alignItems: 'flex-start' }}>
          <button className="pp-btn pp-btn-outline" onClick={() => navigate('/my-redemptions')}>View Rewards</button>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="pp-grid">
        {/* Left Column */}
        <div className="pp-col">
          {/* Personal Information */}
          <div className="pp-card">
            <div className="pp-card-head" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pp-material">person</span>
                <h3 className="pp-card-title">Personal Information</h3>
              </div>

              {!editing && (
                <button
                  className="pp-btn pp-btn-outline"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="pp-form-grid">
              <div className="pp-form-group">
                <label className="pp-label">Full Name</label>
                <input
                  className="pp-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!editing}
                  style={{ cursor: editing ? 'text' : 'default', borderColor: editing ? C.primary : C.outlineVariant }}
                />
              </div>
              <div className="pp-form-group">
                <label className="pp-label">Email Address</label>
                <input className="pp-input" type="email" value={user?.email || ''} readOnly />
              </div>
              {user?.referralCode && (
                <div className="pp-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="pp-label">Referral Code</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="pp-input" type="text" value={user.referralCode} readOnly style={{ fontFamily: 'monospace', letterSpacing: '2px' }} />
                    <button
                      className="pp-btn pp-btn-outline"
                      style={{ flexShrink: 0, padding: '0 16px' }}
                      onClick={() => { navigator.clipboard.writeText(user.referralCode); toast.success('Copied!'); }}
                    >
                      <span className="pp-material" style={{ fontSize: '18px' }}>content_copy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="pp-card">
            <div className="pp-card-head">
              <span className="pp-material">dashboard</span>
              <h3 className="pp-card-title">Quick Access</h3>
            </div>
            <div>
              {[
                { label: 'My Redemptions', icon: 'confirmation_number', path: '/my-redemptions' },
                { label: 'Points History', icon: 'history', path: '/points-history' },
                { label: 'Referral Program', icon: 'share', path: '/referral' },
              ].map(({ label, icon, path }) => (
                <div
                  key={path}
                  className="pp-link-row"
                  onClick={() => navigate(path)}
                >
                  <span className="pp-material" style={{ color: C.primary }}>{icon}</span>
                  <span className="pp-link-title">{label}</span>
                  <span className="pp-material" style={{ fontSize: '20px', color: C.outline }}>chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="pp-col">
          {/* Loyalty & Points */}
          <div className="pp-loyalty-card">
            <div className="pp-loyalty-pattern"></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.secondaryFixed, margin: 0 }}>Current Balance</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="pp-loyalty-val">{user?.points?.toLocaleString() || 0}</span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '24px', opacity: 0.8 }}>pts</span>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  <span>{user?.role || 'Gold'} Tier</span>
                  <span style={{ color: C.secondaryFixed }}>{targetPoints.toLocaleString()} for Platinum</span>
                </div>
                <div className="pp-progress-track">
                  <div className="pp-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <p style={{ fontSize: '12px', opacity: 0.7, margin: '8px 0 0' }}>
                  {(targetPoints - (user?.points || 0)).toLocaleString()} points until Platinum status
                </p>
              </div>

              <button
                className="pp-btn pp-btn-gold"
                style={{ marginTop: '24px' }}
                onClick={() => navigate('/vouchers')}
              >
                <span className="pp-material">redeem</span>
                Redeem Points
              </button>
            </div>
          </div>

          {/* Account Overview */}
          <div className="pp-card">
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: C.onSurfaceVariant, margin: '0 0 16px 0' }}>Account Overview</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.onSurface, fontSize: '14px' }}>Active Vouchers</span>
                <span style={{ fontWeight: 700, color: C.primary, fontSize: '14px' }}>{activeVouchers}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.onSurface, fontSize: '14px' }}>Total Earned</span>
                <span style={{ fontWeight: 700, color: C.primary, fontSize: '14px' }}>{user?.points?.toLocaleString() || 0} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.onSurface, fontSize: '14px' }}>Referral Code</span>
                <span style={{ fontWeight: 700, color: C.secondary, fontSize: '14px', fontFamily: 'monospace' }}>{user?.referralCode || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button className="pp-btn pp-btn-danger" onClick={handleLogout}>
            <span className="pp-material">logout</span>
            Logout
          </button>
        </div>
      </div>

      {/* Footer Actions (Appears when editing) */}
      {editing && (
        <div className="pp-footer-actions">
          <button
            className="pp-btn pp-btn-outline"
            onClick={() => { setEditing(false); setName(user?.name || ''); }}
            disabled={saving}
          >
            Discard Changes
          </button>
          <button
            className="pp-btn pp-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;