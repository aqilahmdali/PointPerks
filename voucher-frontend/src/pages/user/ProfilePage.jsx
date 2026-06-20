import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { userAPI } from '../../services/api';
import { fetchMe, logoutUser } from '../../store/slices/authSlice';

const ProfilePage = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await userAPI.updateProfile({ name: name.trim() });
      await dispatch(fetchMe());
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="vx-page" style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>Profile</h1>

      <div className="vx-card" style={{ padding: '2rem', marginBottom: '1.25rem' }}>
        {/* Avatar & name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <Avatar
            label={user?.name?.[0]?.toUpperCase()}
            image={user?.avatar}
            shape="circle"
            size="xlarge"
            style={{ backgroundColor: '#6366f1', color: '#fff', fontSize: '1.5rem', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{user?.name}</div>
            <div style={{ color: 'var(--ink-500)', fontSize: '0.9rem' }}>{user?.email}</div>
            <Tag value={user?.role} severity={user?.role === 'admin' ? 'danger' : 'info'}
              style={{ marginTop: '0.4rem' }} />
          </div>
        </div>

        {/* Points */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', background: 'var(--surface-50)', borderRadius: 12,
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontWeight: 600 }}>Points balance</span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f59e0b' }}>
            <i className="pi pi-star" style={{ marginRight: '0.3rem' }} />
            {user?.points ?? 0} pts
          </span>
        </div>

        {/* Edit name */}
        {editing ? (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Display name
            </label>
            <InputText
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              style={{ marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Button label="Cancel" outlined severity="secondary" onClick={() => { setEditing(false); setName(user?.name || ''); }} />
              <Button label="Save" loading={saving} onClick={handleSave}
                style={{ background: 'var(--brand-600)', border: 'none' }} />
            </div>
          </div>
        ) : (
          <Button label="Edit name" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />
        )}
      </div>

      {/* Referral code */}
      {user?.referralCode && (
        <div className="vx-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-500)', marginBottom: '0.3rem' }}>Your referral code</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: 2 }}>
              {user.referralCode}
            </span>
            <Button icon="pi pi-copy" text size="small"
              onClick={() => { navigator.clipboard.writeText(user.referralCode); toast.success('Copied!'); }} />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="vx-card" style={{ padding: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'My Redemptions', icon: 'pi pi-check-circle', path: '/my-redemptions' },
          { label: 'Points History', icon: 'pi pi-star', path: '/points-history' },
          { label: 'Referral Program', icon: 'pi pi-share-alt', path: '/referral' },
        ].map(({ label, icon, path }) => (
          <button key={path} onClick={() => navigate(path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
              padding: '0.85rem 1rem', background: 'none', border: 'none',
              borderRadius: 10, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500,
              color: 'var(--ink-700)', textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-50)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <i className={`pi ${icon}`} style={{ width: 20, color: '#6366f1' }} />
            {label}
            <i className="pi pi-chevron-right" style={{ marginLeft: 'auto', color: 'var(--ink-400)', fontSize: '0.8rem' }} />
          </button>
        ))}
      </div>

      <Button label="Logout" icon="pi pi-sign-out" severity="danger" outlined className="w-full"
        onClick={handleLogout} />
    </div>
  );
};

export default ProfilePage;
