import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Camera, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const inp = {
  width:'100%', display:'block', background:'#0d0d0d', border:'1px solid #222',
  borderRadius:10, padding:'11px 14px', fontSize:14, color:'#fff',
  outline:'none', fontFamily:'Inter,system-ui,sans-serif',
  marginBottom:10, boxSizing:'border-box',
};

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, signup, loginWithGoogle } = useAuth();

  const initMode  = location.pathname === '/signup' ? 'signup' : 'login';
  const [mode, setMode]         = useState(initMode);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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
        navigate('/onboarding', { replace: true });
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

  return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:420, background:'#000', border:'1px solid #1a1a1a', borderRadius:20, padding:'32px 24px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <Link to="/" style={{ textDecoration:'none' }}>
            <span style={{ fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>Starmeet</span>
          </Link>
        </div>

        {/* Toggle */}
        <div style={{ display:'flex', background:'#0d0d0d', borderRadius:10, padding:4, marginBottom:20 }}>
          {[['login','Sign In'],['signup','Sign Up']].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex:1, padding:'8px 0', border:'none', borderRadius:8,
              fontSize:13, fontWeight:600, cursor:'pointer',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#000' : '#555', transition:'all 0.15s', fontFamily:'inherit',
            }}>{label}</button>
          ))}
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          padding:'11px 16px', background:'#0d0d0d', border:'1px solid #222', borderRadius:10,
          color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:16, fontFamily:'inherit',
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.97 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div style={{ flex:1, height:1, background:'#1a1a1a' }} />
          <span style={{ fontSize:11, color:'#444' }}>or</span>
          <div style={{ flex:1, height:1, background:'#1a1a1a' }} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, padding:'9px 12px', marginBottom:12, fontSize:13, color:'#e05252' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Signup extras */}
          {mode === 'signup' && (
            <>
              {/* Avatar upload */}
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                <div style={{ position:'relative', cursor:'pointer' }} onClick={() => fileRef.current?.click()}>
                  <div style={{ width:72, height:72, borderRadius:'50%', background:'#1a1a1a', border:'2px dashed #333', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {avatarPreview
                      ? <img src={avatarPreview} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                      : <Camera size={22} color="#555" />
                    }
                  </div>
                  <div style={{ position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Camera size={11} color="white" />
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display:'none' }} />
              </div>

              <input value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="Username (e.g. keanu_fan)" required style={inp} />
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Display name" style={inp} />
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                placeholder="Bio (optional)" rows={2}
                style={{ ...inp, resize:'vertical', lineHeight:1.5 }} />
              <input value={form.dob} onChange={e => set('dob', e.target.value)}
                type="date" placeholder="Date of birth"
                style={{ ...inp, color: form.dob ? '#fff' : '#555', colorScheme:'dark' }} />
            </>
          )}

          <input value={form.email} onChange={e => set('email', e.target.value)}
            type="email" placeholder="Email address" required style={inp} />

          <div style={{ position:'relative', marginBottom:10 }}>
            <input value={form.password} onChange={e => set('password', e.target.value)}
              type={showPass ? 'text' : 'password'} placeholder="Password" required
              style={{ ...inp, marginBottom:0, paddingRight:44 }} />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{
              position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'#555', lineHeight:0,
            }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'signup' && (
            <input value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
              type={showPass ? 'text' : 'password'} placeholder="Confirm password" required style={inp} />
          )}

          {mode === 'login' && (
            <div style={{ textAlign:'right', marginBottom:12 }}>
              <button type="button" style={{ background:'none', border:'none', fontSize:12, color:'#888', cursor:'pointer', fontFamily:'inherit' }}>
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" disabled={submitting} style={{
            width:'100%', padding:'13px', border:'none', borderRadius:10,
            background: submitting ? '#333' : '#fff', color: submitting ? '#888' : '#000',
            fontSize:14, fontWeight:700,
            cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit', marginTop:4,
            transition:'background 0.15s',
          }}>
            {submitting ? '⏳ Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>

      {/* Terms */}
      <p style={{ fontSize:11, color:'#444', textAlign:'center', marginTop:16, maxWidth:340, lineHeight:1.6 }}>
        By continuing you agree to Starmeet's{' '}
        <Link to="/" style={{ color:'#666', textDecoration:'underline' }}>Terms</Link> and{' '}
        <Link to="/" style={{ color:'#666', textDecoration:'underline' }}>Privacy Policy</Link>.
      </p>
    </div>
  );
}
