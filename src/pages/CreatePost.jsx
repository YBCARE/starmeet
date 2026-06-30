import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Video, MapPin, Tag, X, ChevronLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFanPosts } from '../context/FanPostContext';
import { useCelebContext } from '../context/CelebContext';
import './CreatePost.css';

export default function CreatePost() {
  const navigate = useNavigate();
  const { user }          = useAuth();
  const { createPost }    = useFanPosts();
  const { celebrities }   = useCelebContext();

  const [caption,     setCaption]     = useState('');
  const [media,       setMedia]       = useState(null);
  const [mediaType,   setMediaType]   = useState('photo');
  const [location,    setLocation]    = useState('');
  const [tagInput,    setTagInput]    = useState('');
  const [tagged,      setTagged]      = useState([]);
  const [tagSuggestions, setTagSugs]  = useState([]);
  const [posting,     setPosting]     = useState(false);
  const fileRef = useRef(null);

  const av = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name||'Fan')}&background=1a1a1a&color=aaa&size=100`;

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const type = file.type.startsWith('video') ? 'video' : 'photo';
    setMediaType(type);
    const reader = new FileReader();
    reader.onload = ev => setMedia(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleTagInput(v) {
    setTagInput(v);
    if (v.length < 2) { setTagSugs([]); return; }
    const q = v.toLowerCase();
    setTagSugs(celebrities.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5));
  }

  function addTag(name) {
    if (!tagged.includes(name)) setTagged(t => [...t, name]);
    setTagInput('');
    setTagSugs([]);
  }

  function removeTag(name) { setTagged(t => t.filter(x => x !== name)); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!caption.trim() && !media) return;
    setPosting(true);
    createPost(user, { caption, media, mediaType, taggedCelebs: tagged, location });
    setTimeout(() => navigate('/profile'), 400);
  }

  return (
    <div className="sm-create-post">
      <div className="sm-create-post-header">
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:14, fontFamily:'inherit' }}>
          <ChevronLeft size={18} /> Cancel
        </button>
        <span style={{ fontSize:16, fontWeight:700, color:'#fff' }}>New Post</span>
        <button onClick={handleSubmit} disabled={posting || (!caption.trim() && !media)} style={{
          background: (!caption.trim() && !media) ? '#1a1a1a' : '#3b82f6',
          border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700,
          padding:'7px 16px', cursor:'pointer', fontFamily:'inherit', opacity: posting ? 0.7 : 1,
          display:'flex', alignItems:'center', gap:5,
        }}>
          <Send size={13} /> {posting ? 'Posting…' : 'Post'}
        </button>
      </div>

      <div className="sm-create-post-body">

        {/* User row */}
        <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
          <img src={user?.avatar || av} alt="" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover' }} />
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{user?.name || user?.username}</div>
            <div style={{ fontSize:12, color:'#555' }}>@{user?.username}</div>
          </div>
        </div>

        {/* Caption */}
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={4}
          style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:16, fontFamily:'inherit', resize:'none', lineHeight:1.6, marginBottom:16, boxSizing:'border-box' }}
        />

        {/* Media preview */}
        {media && (
          <div style={{ position:'relative', marginBottom:16, borderRadius:12, overflow:'hidden', background:'#111' }}>
            {mediaType === 'video'
              ? <video src={media} controls style={{ width:'100%', maxHeight:400, display:'block' }} />
              : <img src={media} alt="" style={{ width:'100%', maxHeight:400, objectFit:'cover', display:'block' }} />
            }
            <button onClick={() => setMedia(null)} style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.7)', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tag celebrities */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, position:'relative' }}>
            <Tag size={16} color="#555" />
            <input value={tagInput} onChange={e => handleTagInput(e.target.value)}
              placeholder="Tag a celebrity..."
              style={{ flex:1, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:8, padding:'8px 12px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit' }}
            />
            {tagSuggestions.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:24, right:0, background:'#0d0d0d', border:'1px solid #222', borderRadius:10, zIndex:10, marginTop:2 }}>
                {tagSuggestions.map(c => (
                  <div key={c.id} onClick={() => addTag(c.name)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid #111' }}>
                    <img src={c.image} alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }} onError={e=>{e.currentTarget.style.display='none'}} />
                    <span style={{ fontSize:13, color:'#fff' }}>{c.name}</span>
                    <span style={{ fontSize:11, color:'#555' }}>{c.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {tagged.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {tagged.map(name => (
                <span key={name} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#1a1a1a', border:'1px solid #333', borderRadius:999, padding:'4px 10px', fontSize:12, color:'#aaa' }}>
                  @{name}
                  <button onClick={() => removeTag(name)} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:0, lineHeight:0 }}><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
          <MapPin size={16} color="#555" />
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Add location..."
            style={{ flex:1, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:8, padding:'8px 12px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit' }}
          />
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'#111', marginBottom:20 }} />

        {/* Media buttons */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => fileRef.current?.click()} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:10, color:'#aaa', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
            <Image size={18} color="#3b82f6" /> Add Photo
          </button>
          <button onClick={() => fileRef.current?.click()} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:10, color:'#aaa', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
            <Video size={18} color="#8b5cf6" /> Add Video
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display:'none' }} />
      </div>
    </div>
  );
}
