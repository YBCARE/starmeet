import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Camera, MessageCircle, Star, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  const initMode  = location.pathname === '/signup' ? 'signup' : 'login';
  const [mode, setMode]         = useState(initMode);

  useEffect(() => {
    setMode(location.pathname === '/signup' ? 'signup' : 'login');
  }, [location.pathname]);
  const [showPass, setShowPass]           = useState(false);
  const [error, setError]                 = useState('');
  const [verifyNotice, setVerifyNotice]   = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    username: '', name: '', email: '', password: '', confirmPassword: '',
    bio: '', dob: '', avatar: null,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function handleAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatarPreview(ev.target.result);
      set('avatar', ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setSubmitting(true);
    const from = location.state?.from || '/feed';

    try {
      if (mode === 'login') {
        const res = await login({ email: form.email, password: form.password });
        if (res?.error) { setError(res.error); return; }
        navigate(from, { replace: true });
      } else {
        if (!form.username.trim()) { setError('Username is required'); return; }
        if (!form.email.trim())    { setError('Email is required'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        const res = await signup({
          username: form.username, email: form.email, password: form.password,
          name: form.name || form.username, bio: form.bio, dob: form.dob, avatar: form.avatar,
        });
        if (res?.error) { setError(res.error); return; }
        setError('');
        setVerifyNotice(true);
        setTimeout(() => navigate('/onboarding', { replace: true }), 4000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res?.error) { setError(res.error); return; }
      navigate('/onboarding', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setResetSent(false);
    if (!form.email.trim()) {
      setError('Enter your email above, then tap Forgot password.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await resetPassword(form.email);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setResetSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next) {
    setResetSent(false);
    setMode(next);
    setError('');
    navigate(next === 'signup' ? '/signup' : '/login', { replace: true });
  }

  return (
    <div className="sm-auth-page">
      <aside className="sm-auth-hero">
        <Link to="/" className="sm-logo" style={{ marginBottom: 40, display: 'inline-block', textDecoration: 'none' }}>
          Starmeet
        </Link>

        <h1 className="sm-auth-hero-title">
          Your message.<br />
          <span>Their reply.</span>
        </h1>
        <p className="sm-auth-hero-lead">
          Join 500,000+ fans who DM the celebrities they love — and actually hear back.
        </p>

        <div className="sm-auth-hero-stats">
          {[
            { icon: <MessageCircle size={16} color="var(--sm-accent)" />, text: <><strong>1,300+</strong> verified celebrities</> },
            { icon: <Star size={16} color="#f59e0b" />, text: <><strong>98%</strong> Pro reply rate</> },
            { icon: <Shield size={16} color="#a78bfa" />, text: <><strong>Free</strong> to browse and follow</> },
          ].map((item, i) => (
            <div key={i} className="sm-auth-hero-stat">
              <span className="sm-auth-hero-icon">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </aside>

      <main className="sm-auth-panel">
        <div className="sm-auth-box">
          <div className="sm-auth-panel-logo">
            <Link to="/" className="sm-logo" style={{ textDecoration: 'none' }}>Starmeet</Link>
          </div>

          <div className="sm-auth-toggle">
            {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`sm-auth-toggle-btn${mode === m ? ' active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button type="button" onClick={handleGoogle} disabled={submitting} className="sm-auth-google">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.97 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            </svg>
            Continue with Google
          </button>

          <div className="sm-auth-divider"><span>or</span></div>

          {verifyNotice && (
            <div className="sm-auth-alert sm-auth-alert-success">
              Account created! We sent a verification email to <strong>{form.email}</strong>. Check your inbox and click the link to verify.
            </div>
          )}

          {resetSent && mode === 'login' && (
            <div className="sm-auth-alert sm-auth-alert-success">
              If an account exists for <strong>{form.email.trim()}</strong>, we sent a password reset link.
              Check your inbox and spam folder.
            </div>
          )}

          {error && (
            <div className="sm-auth-alert sm-auth-alert-error">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="sm-auth-avatar-wrap">
                  <div className="sm-auth-avatar" onClick={() => fileRef.current?.click()} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}>
                    <div className="sm-auth-avatar-ring">
                      {avatarPreview
                        ? <img src={avatarPreview} alt="Profile preview" />
                        : <Camera size={22} color="var(--sm-text-faint)" />
                      }
                    </div>
                    <span className="sm-auth-avatar-badge">
                      <Camera size={11} color="white" />
                    </span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} hidden />
                </div>

                <input
                  className="sm-input"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  placeholder="Username (e.g. keanu_fan)"
                  required
                />
                <input
                  className="sm-input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Display name"
                />
                <textarea
                  className="sm-input sm-textarea"
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="Bio (optional)"
                  rows={2}
                />
                <input
                  className="sm-input"
                  value={form.dob}
                  onChange={e => set('dob', e.target.value)}
                  type="date"
                  required={false}
                />
              </>
            )}

            <input
              className="sm-input"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              type="email"
              placeholder="Email address"
              required
              autoComplete="email"
            />

            <div className="sm-auth-pass-wrap">
              <input
                className="sm-input"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="sm-auth-pass-toggle"
                onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'signup' && (
              <input
                className="sm-input"
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                type={showPass ? 'text' : 'password'}
                placeholder="Confirm password"
                required
                autoComplete="new-password"
              />
            )}

            {mode === 'login' && (
              <div className="sm-auth-forgot">
                <button type="button" onClick={handleForgotPassword} disabled={submitting}>
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="sm-btn sm-btn-white sm-auth-submit"
              style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="sm-auth-terms">
            By continuing you agree to Starmeet&apos;s{' '}
            <Link to="/terms">Terms</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
