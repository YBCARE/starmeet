import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Edit2, Heart, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCelebContext } from '../context/CelebContext';

export default function Profile() {
  const { user, updateProfile, logout, follows, likes } = useAuth();
  const { celebrities } = useCelebContext();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const fileRef = useRef(null);

  const followedCelebs = celebrities.filter(c => follows.includes(c.id)).slice(0, 20);

  function handleSave() {
    updateProfile(form);
    setEditing(false);
  }

  function handleAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateProfile({ avatar: ev.target.result });
    reader.readAsDataURL(file);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const av = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Fan')}&background=1a1a1a&color=aaa&size=200&bold=true`;

  return (
    <div style={{ background:'#000', minHeight:'100vh', color:'#fff', fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 16px 80px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h1 style={{ fontSize:20, fontWeight:800 }}>My Profile</h1>
          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid #222',
            borderRadius:8, color:'#888', fontSize:13, fontWeight:500, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit',
          }}>
            <LogOut size={14} /> Log out
          </button>
        </div>

        {/* Profile card */}
        <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <img
                src={user?.avatar || av(user?.name)}
                alt={user?.name}
                style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', cursor:'pointer', border:'2px solid #222' }}
                onClick={() => fileRef.current?.click()}
              />
              <div style={{ position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:'50%', background:'#1a1a1a', border:'2px solid #0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                onClick={() => fileRef.current?.click()}>
                <Edit2 size={10} color="#aaa" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display:'none' }} />
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              {editing ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
                    placeholder="Display name"
                    style={{ background:'#111', border:'1px solid #222', borderRadius:8, padding:'7px 12px', color:'#fff', fontSize:14, outline:'none', fontFamily:'inherit' }} />
                  <textarea value={form.bio} onChange={e => setForm(p=>({...p,bio:e.target.value}))}
                    placeholder="Your bio..."
                    rows={2}
                    style={{ background:'#111', border:'1px solid #222', borderRadius:8, padding:'7px 12px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', resize:'vertical' }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={handleSave} style={{ flex:1, padding:'7px', background:'#3b82f6', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Save</button>
                    <button onClick={() => setEditing(false)} style={{ flex:1, padding:'7px', background:'#1a1a1a', border:'1px solid #222', borderRadius:8, color:'#aaa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:16, fontWeight:700 }}>{user?.name || 'Fan'}</span>
                    <button onClick={() => setEditing(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:0, lineHeight:0 }}>
                      <Edit2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize:12, color:'#555', marginBottom:6 }}>@{user?.username || user?.email?.split('@')[0] || 'fan'}</div>
                  <div style={{ fontSize:13, color:'#888', lineHeight:1.5 }}>{user?.bio || 'No bio yet. Tap ✏️ to add one.'}</div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:20, marginTop:16, paddingTop:14, borderTop:'1px solid #111' }}>
            {[
              { icon:<Users size={14}/>,  label:'Following', val: follows.length },
              { icon:<Heart size={14}/>,  label:'Likes',     val: likes.length   },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color:'#555' }}>{s.icon}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{s.val}</span>
                <span style={{ fontSize:12, color:'#555' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Following section */}
        <h2 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Celebrities you follow</h2>
        {followedCelebs.length === 0 ? (
          <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14, padding:'28px', textAlign:'center', color:'#555', marginBottom:20 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⭐</div>
            <div style={{ fontSize:14, fontWeight:600, color:'#888', marginBottom:6 }}>No follows yet</div>
            <Link to="/explore" style={{ color:'#3b82f6', textDecoration:'none', fontSize:13 }}>Browse celebrities →</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            {followedCelebs.map(c => {
              const av2 = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=111&color=aaa&size=200`;
              return (
                <Link key={c.id} to={`/celebrity/${c.id}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, padding:'10px 14px' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <img src={c.image} alt={c.name}
                      style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
                      onError={e => { e.currentTarget.src = av2; }} />
                    <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderRadius:'50%', background:'#3b82f6', border:'2px solid #0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Check size={7} strokeWidth={3} color="white" />
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{c.name}</div>
                    <div style={{ fontSize:12, color:'#555' }}>{c.category}</div>
                  </div>
                  <div style={{ fontSize:11, color:'#3b82f6', fontWeight:600 }}>Following</div>
                </Link>
              );
            })}
            {follows.length > 20 && (
              <div style={{ textAlign:'center', color:'#555', fontSize:12, padding:'8px 0' }}>+{follows.length - 20} more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
