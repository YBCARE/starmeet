import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, User, Lock, Shield,
  HelpCircle, FileText, LogOut, Mail, Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

function SettingsHeader({ title, backTo = '/settings' }) {
  const navigate = useNavigate();
  return (
    <header className="sm-settings-header">
      <button type="button" className="sm-settings-back" onClick={() => navigate(backTo)} aria-label="Back">
        <ChevronLeft size={22} />
      </button>
      <h1 className="sm-settings-title">{title}</h1>
    </header>
  );
}

function SettingsRow({ icon: Icon, label, to, onClick, meta, avatar, danger }) {
  const inner = (
    <>
      <span className="sm-settings-row-icon"><Icon size={20} /></span>
      <span className="sm-settings-row-label">{label}</span>
      {meta && <span className="sm-settings-row-meta">{meta}</span>}
      {avatar && <img src={avatar} alt="" className="sm-settings-row-avatar" />}
      <ChevronRight size={18} className="sm-settings-row-chevron" />
    </>
  );

  if (to) {
    return <Link to={to} className={`sm-settings-row${danger ? ' danger' : ''}`}>{inner}</Link>;
  }
  return (
    <button type="button" onClick={onClick} className={`sm-settings-row${danger ? ' danger' : ''}`}>
      {inner}
    </button>
  );
}

function SettingsHub() {
  const { user, logout, hasPasswordLogin, usesGoogleLogin } = useAuth();
  const navigate = useNavigate();

  const av = name =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Fan')}&background=1a1a1a&color=aaa&size=80&bold=true`;

  function handleLogout() {
    logout();
    navigate('/');
  }

  const signInLabel = usesGoogleLogin() && hasPasswordLogin()
    ? 'Google + Email'
    : usesGoogleLogin()
      ? 'Google'
      : 'Email';

  return (
    <div className="sm-settings">
      <SettingsHeader title="Settings and privacy" backTo="/profile" />

      <div className="sm-settings-body">
        <section className="sm-settings-section">
          <h2 className="sm-settings-section-label">Account</h2>
          <div className="sm-settings-card">
            <SettingsRow icon={User} label="Account" to="/settings/account" meta={user?.username ? `@${user.username}` : undefined} />
            <SettingsRow icon={Lock} label="Password" to="/settings/password" meta={signInLabel} />
            <SettingsRow icon={Mail} label="Email" to="/settings/account" meta={user?.email || '—'} />
            <SettingsRow icon={Shield} label="Security" to="/settings/password" />
          </div>
        </section>

        <section className="sm-settings-section">
          <h2 className="sm-settings-section-label">Support & about</h2>
          <div className="sm-settings-card">
            <SettingsRow icon={HelpCircle} label="Help centre" to="/messages" />
            <SettingsRow icon={Shield} label="Privacy centre" to="/privacy" />
            <SettingsRow icon={FileText} label="Terms and policies" to="/terms" />
          </div>
        </section>

        <section className="sm-settings-section">
          <h2 className="sm-settings-section-label">Login</h2>
          <div className="sm-settings-card">
            <SettingsRow
              icon={User}
              label="Switch account"
              onClick={() => { logout(); navigate('/login'); }}
              avatar={user?.avatar || av(user?.name)}
            />
            <SettingsRow icon={LogOut} label="Log out" onClick={handleLogout} danger />
          </div>
        </section>

        <p className="sm-settings-version">Starmeet v1.0</p>
      </div>
    </div>
  );
}

function SettingsAccount() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const av = name =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Fan')}&background=1a1a1a&color=aaa&size=120&bold=true`;

  function readAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (!form.username.trim()) {
      setError('Username is required');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        username: form.username.trim().toLowerCase().replace(/\s+/g, '_'),
        avatar,
      });
      setSaved(true);
    } catch {
      setError('Could not save changes. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sm-settings">
      <SettingsHeader title="Account" />

      <div className="sm-settings-body">
        {saved && (
          <div className="sm-auth-alert sm-auth-alert-success" style={{ marginBottom: 12 }}>
            Your profile was updated.
          </div>
        )}
        {error && (
          <div className="sm-auth-alert sm-auth-alert-error" style={{ marginBottom: 12 }}>{error}</div>
        )}

        <form className="sm-settings-form" onSubmit={handleSave}>
          <div className="sm-settings-avatar-block">
            <img src={avatar || av(form.name)} alt="" className="sm-settings-avatar-preview" />
            <button type="button" className="sm-btn sm-btn-ghost" onClick={() => fileRef.current?.click()}>
              <Camera size={16} /> Change photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={readAvatar} hidden />
          </div>

          <div className="sm-settings-field">
            <label htmlFor="settings-email">Email</label>
            <input id="settings-email" className="sm-input" value={user?.email || ''} disabled />
          </div>

          <div className="sm-settings-field">
            <label htmlFor="settings-name">Display name</label>
            <input id="settings-name" className="sm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
          </div>

          <div className="sm-settings-field">
            <label htmlFor="settings-username">Username</label>
            <input id="settings-username" className="sm-input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="username" required />
          </div>

          <div className="sm-settings-field">
            <label htmlFor="settings-bio">Bio</label>
            <textarea id="settings-bio" className="sm-input" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell fans about yourself" />
          </div>

          <div className="sm-settings-field">
            <label htmlFor="settings-location">Location</label>
            <input id="settings-location" className="sm-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, country" />
          </div>

          <button type="submit" className="sm-settings-save" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

function SettingsPassword() {
  const { user, changePassword, resetPassword, hasPasswordLogin, usesGoogleLogin } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const canChange = hasPasswordLogin();

  async function handleChange(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (next !== confirm) {
      setError('New passwords do not match');
      return;
    }
    if (next.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const res = await changePassword(current, next);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSuccess('Password updated successfully.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailReset() {
    setError('');
    setResetSent(false);
    if (!user?.email) {
      setError('No email on this account');
      return;
    }
    setSubmitting(true);
    try {
      const res = await resetPassword(user.email);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setResetSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sm-settings">
      <SettingsHeader title="Password & security" />

      <div className="sm-settings-body">
        {usesGoogleLogin() && !canChange && (
          <p className="sm-settings-note">
            You signed in with Google. To add a password, we can email you a reset link — that lets you set one for email login too.
          </p>
        )}

        {resetSent && (
          <div className="sm-auth-alert sm-auth-alert-success" style={{ marginBottom: 12 }}>
            Reset link sent to <strong>{user?.email}</strong>. Check inbox and spam.
          </div>
        )}
        {success && (
          <div className="sm-auth-alert sm-auth-alert-success" style={{ marginBottom: 12 }}>{success}</div>
        )}
        {error && (
          <div className="sm-auth-alert sm-auth-alert-error" style={{ marginBottom: 12 }}>{error}</div>
        )}

        {canChange ? (
          <form className="sm-settings-form" onSubmit={handleChange}>
            <div className="sm-settings-field">
              <label htmlFor="pw-current">Current password</label>
              <input id="pw-current" type="password" className="sm-input" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required />
            </div>
            <div className="sm-settings-field">
              <label htmlFor="pw-new">New password</label>
              <input id="pw-new" type="password" className="sm-input" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" required minLength={6} />
            </div>
            <div className="sm-settings-field">
              <label htmlFor="pw-confirm">Confirm new password</label>
              <input id="pw-confirm" type="password" className="sm-input" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required minLength={6} />
            </div>
            <button type="submit" className="sm-settings-save" disabled={submitting}>
              {submitting ? 'Updating…' : 'Change password'}
            </button>
          </form>
        ) : (
          <button type="button" className="sm-settings-save" onClick={handleEmailReset} disabled={submitting}>
            {submitting ? 'Sending…' : 'Email reset link'}
          </button>
        )}

        {canChange && (
          <p className="sm-settings-note" style={{ marginTop: 16 }}>
            Forgot your current password?{' '}
            <button type="button" onClick={handleEmailReset} disabled={submitting} style={{ background: 'none', border: 'none', color: 'var(--sm-accent)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 0 }}>
              Send reset email
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { pathname } = useLocation();
  if (pathname.endsWith('/account')) return <SettingsAccount />;
  if (pathname.endsWith('/password')) return <SettingsPassword />;
  return <SettingsHub />;
}
