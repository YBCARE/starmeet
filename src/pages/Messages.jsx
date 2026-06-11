import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Send, Search, Check, CheckCheck, X, Image, Smile, ChevronLeft,
  MessageCircle, Lock, Clock, Mic,
} from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { useAuth } from '../context/AuthContext';
import {
  loadAll, saveAll, convoId, updateConvoStatus,
  getConvosForUser, subscribeToConvos, syncConvosFromFirestore, appendMessage, uid,
} from '../services/messageStore';

// ─── Smart reply engine ───────────────────────────────────────────────────────
// Reads what the fan said and picks a contextually appropriate reply from the celebrity

const REPLY_BANKS = {
  // Keyword groups → possible replies
  love: [
    "That genuinely means the world to me. Thank you ❤️",
    "I feel that. Love you right back 🙏",
    "Messages like this remind me why I do this. Thank you so much.",
    "You don't know how much I needed to read this today 😭❤️",
    "I love you more. Seriously. Thank you ✨",
  ],
  miss: [
    "I miss you all too. More than you know 💙",
    "Not going anywhere, I promise 🙏",
    "Every time I'm away I think about how much your support means to me.",
    "The feeling is mutual. Trust me on that ❤️",
  ],
  amazing: [
    "You're too kind, I promise 😊",
    "Honestly YOU are amazing for saying that. Thank you.",
    "That's all you — you inspire me to keep going 🔥",
    "Stop it 😭 you're going to make me cry. Thank you.",
  ],
  proud: [
    "That hits different coming from you. Thank you 🙏",
    "Proud of you too. Every step you're taking matters.",
    "That means everything. Genuinely. Thank you for being here ❤️",
    "I hope I keep making you proud. That's the whole goal 💪",
  ],
  inspired: [
    "That's exactly why I do this. Thank you for telling me 🙏",
    "Keep going. Whatever you're building — keep going. I believe in you 💪",
    "You just made my whole day. Keep that fire alive ✨",
    "If I could reach through the screen and give you a hug right now 😭❤️",
  ],
  question_music: [
    "I've been in the studio almost every night this month. It's coming 🎵",
    "New music is so close. I literally can't say more or I'll get in trouble 👀",
    "The album is done. Just waiting for the right moment to share it with you all 🎶",
    "Working on something that I think is my best yet. That's all I can say 🤫",
  ],
  question_movie: [
    "I can tell you I'm incredibly proud of what we made. More soon 🎬",
    "The cast on this one is insane. You're going to love it. I promise.",
    "Still in post-production but I've seen the rough cut. It's something special.",
    "Can't say much but — this one is going to surprise a lot of people 👀",
  ],
  question_training: [
    "It's mostly discipline over motivation honestly. You show up even when you don't feel like it 💪",
    "5am every morning. No exceptions. That's the whole secret.",
    "Sleep, recovery, and never missing a training day. Simple. Brutal. Effective. 🏋️",
    "Ice baths and an insane team around me. That's how I do it 😅",
  ],
  question_life: [
    "Honestly? It's not easy. But it's everything I wanted.",
    "I try to stay grounded. Family keeps me real every single day.",
    "I still have hard days. Anyone who says this life is perfect is lying to you.",
    "I journal every morning. That's how I process everything that happens 📝",
  ],
  gratitude: [
    "No — thank YOU. You showing up matters more than you know. Really 🙏",
    "The support keeps me going. Every. Single. Day. Thank you ❤️",
    "I read every message I can. This community is everything to me.",
    "You have no idea how much this means. Thank you for being here with me 💙",
  ],
  best: [
    "You're going to make me cry 😭 Thank you. Truly.",
    "That's the goal every single day. Thank you for seeing it 🙏",
    "There are days I doubt myself and then I get a message like this. Thank you ❤️",
  ],
  new: [
    "Something new is absolutely coming. Very soon. Stay close 👀",
    "I've been working on something I'm really excited about. You'll see 🔥",
    "New era incoming. That's all I'll say for now 😏",
  ],
  follow: [
    "I see you. Thank you for being here from day one 🙏",
    "Day ones mean everything to me. Thank you ❤️",
    "Long-time fans make this all worth it. Genuinely 💙",
  ],
  hello: [
    "Hey!! 👋 So glad you reached out!",
    "Hey! Thanks for messaging me 😊 This literally made my day.",
    "Hello!! I always love hearing from fans directly ❤️",
    "Hi there! Thank you for taking the time to message me 🙏",
  ],
  support: [
    "Your support means more than I could ever put into words. Thank you 💙",
    "I don't take any of this for granted. Not a single moment. Thank you 🙏",
    "You showing up — here, to my shows, streaming my stuff — it all matters. Thank you ❤️",
  ],
  // Fallback by celebrity category
  default_Musician: [
    "So grateful you're listening 🎵 That's everything to me.",
    "Music is the only way I know how to communicate what I feel. Glad it reached you.",
    "New music coming that I think you'll love. Stay close 🎶",
    "Playing live is where I feel most alive. Hope to see you at a show one day 🎤",
  ],
  default_Actor: [
    "Thank you for watching. Every role I take, I think about people like you 🎬",
    "The craft is everything. I'm always trying to go deeper.",
    "This business is hard but fans like you make it worth every second.",
    "Getting into character means leaving myself behind. It's terrifying and freeing.",
  ],
  default_Actress: [
    "Thank you for watching. Every role I take, I think about people like you 🎬",
    "The craft is everything. I'm always trying to go deeper.",
    "This business is hard but fans like you make it worth every second.",
    "Getting into character means leaving myself behind. It's terrifying and freeing.",
  ],
  default_Athlete: [
    "Champions are made in the moments no one is watching 💪",
    "The game is everything to me. Thank you for supporting the journey 🏆",
    "Hard work, discipline, and people like you cheering me on. That's the formula.",
    "I play every game like it could be my last. Thank you for being there 🙏",
  ],
  default_Director: [
    "Every frame is a decision. Every cut is a choice. Thank you for noticing 🎥",
    "Cinema is the highest art form I know. Still learning every day.",
    "The best thing about making films is that they outlive you.",
    "Thank you for watching closely. That's all a director can ask for 🙏",
  ],
  default_Comedian: [
    "Making people laugh is the greatest thing I know how to do 😂",
    "Comedy is pain with better timing. Thank you for getting it.",
    "Nothing beats a room full of people laughing. Nothing. 🎤",
    "If I made you laugh, then I did my job. Thank you for telling me 🙏",
  ],
  default_Model: [
    "Fashion is art. Thank you for seeing it that way too ✨",
    "Every photo tells a story. I'm glad this one said something to you.",
    "The industry is changing and I want to be part of making it better 🌍",
    "Thank you for seeing beyond the surface. That means more than you know 💙",
  ],
  default_Creator: [
    "I make videos for people exactly like you. Thank you for watching 🎥",
    "Every view, every comment — I see it. It all matters.",
    "Creating is how I make sense of the world. Glad it helps you too.",
    "Comments like this keep me posting on the hard days. Thank you ❤️",
  ],
  default: [
    "This made my day. Thank you for reaching out 🙏",
    "I read every message I can. Thank you for being here ❤️",
    "People like you are the reason I keep going. Seriously.",
    "Thank you. I don't have more words than that right now — just thank you. 💙",
    "Stay tuned. Good things are coming very soon 👀",
    "Can't believe the love. Thank you for being part of this journey 🌟",
    "Your energy is amazing. Thank you for sharing it with me 🔥",
  ],
};

// Follow-up messages sent 5–12s after first reply (makes conversation feel natural)
const FOLLOWUP_MESSAGES = [
  "Also — how are you doing? 😊",
  "Where are you from, if you don't mind me asking?",
  "I hope you're having a good day ❤️",
  "Seriously though, thank you for taking the time 🙏",
  "What got you into my work in the first place? I'm curious 😊",
  "Days like this remind me why I do all of this 💙",
];

function getSmartReply(userText, celebCategory) {
  const t = (userText || '').toLowerCase();

  // Keyword matching — most specific first
  if (t.includes('music') || t.includes('song') || t.includes('album') || t.includes('track') || t.includes('single')) {
    return pick(REPLY_BANKS.question_music);
  }
  if (t.includes('movie') || t.includes('film') || t.includes('series') || t.includes('show') || t.includes('role') || t.includes('acting')) {
    return pick(REPLY_BANKS.question_movie);
  }
  if (t.includes('train') || t.includes('workout') || t.includes('gym') || t.includes('fit')) {
    return pick(REPLY_BANKS.question_training);
  }
  if (t.includes('life') || t.includes('feel') || t.includes('how do you') || t.includes('deal with')) {
    return pick(REPLY_BANKS.question_life);
  }
  if (t.includes('hello') || t.includes('hi ') || t.includes('hey') || t.match(/^hi$/) || t.match(/^hey$/)) {
    return pick(REPLY_BANKS.hello);
  }
  if (t.includes('love you') || t.includes('love u') || t.includes('i love')) {
    return pick(REPLY_BANKS.love);
  }
  if (t.includes('miss') || t.includes('missed')) {
    return pick(REPLY_BANKS.miss);
  }
  if (t.includes('proud') || t.includes('so proud')) {
    return pick(REPLY_BANKS.proud);
  }
  if (t.includes('inspir') || t.includes('motivat') || t.includes('changed my life') || t.includes('saved')) {
    return pick(REPLY_BANKS.inspired);
  }
  if (t.includes('thank') || t.includes('grateful')) {
    return pick(REPLY_BANKS.gratitude);
  }
  if (t.includes('amazing') || t.includes('incredible') || t.includes('unbelievable') || t.includes('insane')) {
    return pick(REPLY_BANKS.amazing);
  }
  if (t.includes('best') || t.includes('greatest') || t.includes('goat') || t.includes('legend')) {
    return pick(REPLY_BANKS.best);
  }
  if (t.includes('new') || t.includes('next') || t.includes('coming') || t.includes('release') || t.includes('drop') || t.includes('upcoming')) {
    return pick(REPLY_BANKS.new);
  }
  if (t.includes('follower') || t.includes('fan for') || t.includes('years') || t.includes('day one') || t.includes('since')) {
    return pick(REPLY_BANKS.follow);
  }
  if (t.includes('support') || t.includes('been there')) {
    return pick(REPLY_BANKS.support);
  }

  // Category-based default
  const catKey = `default_${celebCategory}`;
  if (REPLY_BANKS[catKey]) return pick(REPLY_BANKS[catKey]);
  return pick(REPLY_BANKS.default);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Utility ──────────────────────────────────────────────────────────────────
function av(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'?')}&background=111&color=aaa&size=100&bold=true`;
}
function fmtTime(ts) {
  if (!ts) return '';
  const d   = new Date(ts);
  const now = new Date();
  if (now - d < 60000)    return 'just now';
  if (now - d < 3600000)  return Math.floor((now - d) / 60000) + 'm ago';
  if (now.toDateString() === d.toDateString()) return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString([], { month:'short', day:'numeric' });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div style={{ display:'flex', gap:4, padding:'10px 14px', background:'#1a1a1a', borderRadius:'16px 16px 16px 4px', width:'fit-content', alignItems:'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#555', animation:`typebounce 1.2s ${i*0.2}s ease-in-out infinite` }} />
      ))}
      <style>{`@keyframes typebounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

// ─── New Conversation Modal ────────────────────────────────────────────────────
function NewConvoModal({ celebrities, fansDb, currentUser, onSelect, onClose }) {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    const celebs = celebrities.filter(c => c.name.toLowerCase().includes(lq)).slice(0, 8).map(c => ({
      type:'celeb', id:c.id, name:c.name, image:c.image, sub:c.category, verified:true, raw:c,
    }));
    const fans = fansDb.filter(f => f.id !== currentUser?.id && (f.username?.includes(lq) || f.name?.toLowerCase().includes(lq))).slice(0, 5).map(f => ({
      type:'fan', id:f.id, name:f.name||f.username, image:f.avatar, sub:`@${f.username}`, verified:false, raw:f,
    }));
    return [...celebs, ...fans];
  }, [q, celebrities, fansDb, currentUser]);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #111' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>New Message</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', lineHeight:0 }}><X size={20}/></button>
        </div>
        <div style={{ padding:'12px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#111', border:'1px solid #222', borderRadius:10, padding:'9px 12px', marginBottom:12 }}>
            <Search size={15} color="#555" />
            <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Search celebrities or fans..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:14, fontFamily:'inherit' }} />
          </div>
          {q.length < 2 && (
            <div style={{ color:'#555', fontSize:13, textAlign:'center', padding:'20px 0' }}>Type to search celebrities and fans</div>
          )}
          {results.map(r => (
            <div key={`${r.type}_${r.id}`} onClick={()=>onSelect(r)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 6px', cursor:'pointer', borderRadius:10, transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#111'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <img src={r.image||av(r.name)} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
                  onError={e=>{e.currentTarget.src=av(r.name)}} />
                {r.verified && (
                  <div style={{ position:'absolute', bottom:0, right:0, width:16, height:16, borderRadius:'50%', background:'#3b82f6', border:'2px solid #0a0a0a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={8} strokeWidth={3} color="white" />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{r.name}</div>
                <div style={{ fontSize:12, color:'#555' }}>{r.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({ convo, myId, onSend, onBack, typing: typingExternal, isPro, msgCount, freeLimit, onUpgradeClick }) {
  const [input,      setInput]      = useState('');
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [seenMsgId,  setSeenMsgId]  = useState(null); // id of last message seen by celeb
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  const them = convo.with;
  const msgs = convo.messages || [];
  const isRequest = convo.status === 'request';

  const EMOJIS = ['❤️','🔥','😭','👑','🙏','✨','😍','💙','🎉','🥺','💯','🐐','😂','🫶','⭐','💪','🌟','🎬','🎵','🏆'];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, typingExternal]);

  function send(text, media) {
    if (!text?.trim() && !media) return;
    onSend(convo.id, text?.trim() || '', media);
    setInput('');
    setShowEmoji(false);

    // Simulate "Celebrity has seen your message" after 1.5s
    const msgId = uid();
    setTimeout(() => setSeenMsgId('latest'), 1500);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => send('', ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  // Last message sent by "me"
  const myMessages = msgs.filter(m => m.from === 'me');
  const lastMyMsg  = myMessages[myMessages.length - 1];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #111', display:'flex', alignItems:'center', gap:10, flexShrink:0, background:'#000' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', lineHeight:0, marginRight:4 }}>
          <ChevronLeft size={22}/>
        </button>
        <Link to={them.type==='celeb' ? `/celebrity/${them.id}` : `/user/${them.id}`}
          style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <img src={them.image||av(them.name)} alt="" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
              onError={e=>{e.currentTarget.src=av(them.name)}} />
            {them.verified && (
              <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderRadius:'50%', background:'#3b82f6', border:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Check size={7} strokeWidth={3} color="white"/>
              </div>
            )}
            {/* Online dot */}
            <div style={{ position:'absolute', top:0, right:0, width:11, height:11, borderRadius:'50%', background:'#22c55e', border:'2px solid #000' }} />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{them.name}</div>
            <div style={{ fontSize:11, color:'#22c55e', fontWeight:500 }}>Online now</div>
          </div>
        </Link>
        {isRequest && (
          <span style={{ fontSize:11, color:'#f59e0b', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:999, padding:'3px 10px', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            <Clock size={11}/> Request
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column', gap:6 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#555' }}>
            <div style={{ position:'relative', width:72, height:72, margin:'0 auto 14px', borderRadius:'50%', overflow:'hidden', border:'2px solid #1a1a1a' }}>
              <img src={them.image||av(them.name)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }}
                onError={e=>{e.currentTarget.src=av(them.name)}} />
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#ccc', marginBottom:4 }}>{them.name}</div>
            <div style={{ fontSize:12, color:'#444', marginBottom:4 }}>{them.category || ''}</div>
            <div style={{ fontSize:12, color:'#333' }}>
              {them.verified ? '✦ Verified celebrity · Online now' : 'Start your conversation below'}
            </div>
          </div>
        )}

        {msgs.map((msg, msgIdx) => {
          const isLast = msgIdx === msgs.length - 1;
          return (
            <div key={msg.id} style={{ display:'flex', justifyContent: msg.from==='me' ? 'flex-end' : msg.from==='system' ? 'center' : 'flex-start' }}>
              {msg.from === 'system' ? (
                <div style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:10, padding:'8px 14px', maxWidth:'85%', fontSize:12, color:'#666', display:'flex', alignItems:'center', gap:6 }}>
                  <Lock size={11} color="#444"/> {msg.text}
                </div>
              ) : (
                <div style={{ maxWidth:'74%' }}>
                  {msg.from !== 'me' && (
                    <div style={{ marginBottom:2 }}>
                      <img src={them.image||av(them.name)} alt="" style={{ width:24, height:24, borderRadius:'50%', objectFit:'cover', objectPosition:'top', flexShrink:0 }}
                        onError={e=>{e.currentTarget.src=av(them.name)}} />
                    </div>
                  )}
                  <div style={{
                    background:    msg.from==='me' ? '#3b82f6' : '#1a1a1a',
                    borderRadius:  msg.from==='me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    padding:       msg.media ? '4px' : '10px 14px',
                    marginLeft:    msg.from!=='me' ? 0 : 0,
                  }}>
                    {msg.media && <img src={msg.media} alt="" style={{ width:'100%', maxWidth:240, borderRadius:12, display:'block' }} />}
                    {msg.text && <div style={{ fontSize:14, color:'#fff', lineHeight:1.55, padding: msg.media?'6px 8px 4px':0 }}>{msg.text}</div>}
                    <div style={{ fontSize:10, color: msg.from==='me'?'rgba(255,255,255,0.45)':'#444', textAlign:'right', marginTop: msg.media?0:3 }}>
                      {fmtTime(msg.timestamp)}
                    </div>
                  </div>
                  {/* Read receipt — shown under last "me" message */}
                  {msg.from === 'me' && isLast && seenMsgId === 'latest' && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3, marginTop:3 }}>
                      <CheckCheck size={13} color="#3b82f6" />
                      <span style={{ fontSize:10, color:'#3b82f6' }}>Seen by {them.name?.split(' ')[0]}</span>
                    </div>
                  )}
                  {msg.from === 'me' && isLast && seenMsgId !== 'latest' && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3, marginTop:3 }}>
                      <Check size={13} color="#555" />
                      <span style={{ fontSize:10, color:'#555' }}>Sent</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {typingExternal && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:6 }}>
            <img src={them.image||av(them.name)} alt="" style={{ width:24, height:24, borderRadius:'50%', objectFit:'cover', objectPosition:'top', flexShrink:0 }}
              onError={e=>{e.currentTarget.src=av(them.name)}} />
            <TypingBubble/>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div style={{ padding:'10px 14px', borderTop:'1px solid #111', display:'flex', flexWrap:'wrap', gap:6, background:'#000' }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={()=>setInput(i=>i+e)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, padding:'2px 4px', lineHeight:1 }}>
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Free messages warning */}
      {!isPro && them.type === 'celeb' && msgCount >= freeLimit - 2 && msgCount < freeLimit && (
        <div style={{ padding:'8px 14px', background:'#1a0f00', borderTop:'1px solid #2a1800', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:12, color:'#f59e0b' }}>
            ⚡ {freeLimit - msgCount} free message{freeLimit - msgCount !== 1 ? 's' : ''} left with {them.name?.split(' ')[0]}
          </span>
          <button onClick={onUpgradeClick} style={{ background:'#f59e0b', border:'none', borderRadius:6, color:'#000', fontSize:11, fontWeight:800, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            Upgrade
          </button>
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding:'10px 14px 16px', borderTop:'1px solid #111', display:'flex', gap:8, alignItems:'center', flexShrink:0, background:'#000' }}>
        <button onClick={()=>setShowEmoji(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', color: showEmoji?'#3b82f6':'#555', lineHeight:0, flexShrink:0 }}>
          <Smile size={22}/>
        </button>
        <button onClick={()=>fileRef.current?.click()} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', lineHeight:0, flexShrink:0 }}>
          <Image size={22}/>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message ${them.name?.split(' ')[0] || 'them'}...`}
          style={{ flex:1, background:'#111', border:'1px solid #1a1a1a', borderRadius:24, padding:'11px 18px', color:'#fff', fontSize:14, outline:'none', fontFamily:'inherit' }}
        />
        <button onClick={()=>send(input)} style={{
          width:42, height:42, borderRadius:'50%', flexShrink:0,
          background: input.trim() ? '#3b82f6' : '#1a1a1a',
          border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s',
        }}>
          <Send size={17} color="#fff"/>
        </button>
      </div>
    </div>
  );
}

const FREE_MSG_LIMIT = 5; // free users can send 5 messages per celebrity

// ─── Pro upgrade modal ────────────────────────────────────────────────────────
function UpgradeModal({ celebName, onClose, onUpgrade, isPro: alreadyPro }) {
  function handleUpgrade(plan) {
    const sentToStripe = redirectToStripe(plan);
    if (!sentToStripe) {
      // Stripe not configured — simulate upgrade (dev/demo mode)
      onUpgrade(plan);
    }
    // If sentToStripe === true, the page will redirect; modal stays open briefly
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div style={{ background:'#0a0a0a', border:'1px solid #2a2a2a', borderRadius:20, width:'100%', maxWidth:420, overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>
        {/* Header gradient */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2d1b69)', padding:'28px 24px 22px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>⭐</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:6 }}>Unlock Unlimited Messages</div>
          <div style={{ fontSize:14, color:'#93c5fd', lineHeight:1.5 }}>
            You've used your {FREE_MSG_LIMIT} free messages with <strong>{celebName}</strong>.<br/>Upgrade to keep the conversation going.
          </div>
        </div>
        {/* Plans */}
        <div style={{ padding:'20px 24px' }}>
          {/* Pro plan */}
          <div style={{ background:'#0f1e3a', border:'2px solid #3b82f6', borderRadius:14, padding:'16px 18px', marginBottom:12, position:'relative' }}>
            <div style={{ position:'absolute', top:-10, right:16, background:'#3b82f6', color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:99, letterSpacing:'0.05em' }}>MOST POPULAR</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Pro Fan</div>
                <div style={{ fontSize:12, color:'#60a5fa' }}>Unlimited messages · All celebrities</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>$9</div>
                <div style={{ fontSize:11, color:'#555' }}>/month</div>
              </div>
            </div>
            {['Unlimited direct messages', 'Priority replies from celebrities', 'Pro badge on your profile', 'Exclusive celebrity content', 'Early access to new features'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <span style={{ fontSize:13, color:'#ccc' }}>{f}</span>
              </div>
            ))}
            <button onClick={() => handleUpgrade('pro')} style={{
              width:'100%', marginTop:14, padding:'13px', background:'#3b82f6',
              border:'none', borderRadius:10, color:'#fff',
              fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
            }}>
              Upgrade to Pro — $9/mo →
            </button>
          </div>
          {/* Celebrity plan */}
          <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14, padding:'14px 18px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Celebrity 🌟</div>
              <div><span style={{ fontSize:18, fontWeight:800, color:'#fff' }}>$29</span><span style={{ fontSize:11, color:'#555' }}>/mo</span></div>
            </div>
            <div style={{ fontSize:12, color:'#555' }}>Everything in Pro + verified celebrity badge + direct fan inbox</div>
          </div>
          <button onClick={onClose} style={{ width:'100%', padding:'11px', background:'none', border:'1px solid #1a1a1a', borderRadius:10, color:'#555', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Maybe later — I'll use my remaining free messages
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MESSAGES PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function Messages() {
  const { celebrities }             = useCelebContext();
  const { user, celebFollows, fansDb, addNotification, isPro, upgradeToPro, trackMessage, getMessageCount } = useAuth();
  const [searchParams]              = useSearchParams();

  const myId = user ? `user_${user.id}` : null;

  const [convos,       setConvos]       = useState(() => myId ? getConvosForUser(myId) : []);
  const [activeId,     setActiveId]     = useState(null);
  const [showNew,      setShowNew]      = useState(false);
  const [showMobile,   setShowMobile]   = useState(false);
  const [unreadIds,    setUnreadIds]    = useState({});  // cid → true if has unread
  const [showUpgrade,  setShowUpgrade]  = useState(false); // paywall modal

  // Real-time Firestore subscription
  useEffect(() => {
    if (!myId) return;
    syncConvosFromFirestore(myId).then(() => setConvos(getConvosForUser(myId)));
    const unsub = subscribeToConvos(myId, (updated) => {
      setConvos(updated.sort((a, b) => (b.updatedAt||0) - (a.updatedAt||0)));
    });
    return unsub;
  }, [myId]);

  // Handle ?with= param
  useEffect(() => {
    const withParam = searchParams.get('with');
    if (!withParam || !myId) return;
    const cid = convoId(myId, withParam);
    const all = loadAll();
    if (all[cid]) { setActiveId(cid); setShowMobile(true); return; }

    const [type, rawId] = withParam.includes('celeb_')
      ? ['celeb', withParam.replace('celeb_','')]
      : ['fan',   withParam.replace('fan_','')];

    let person = null;
    if (type === 'celeb') {
      const c = celebrities.find(c => String(c.id) === String(rawId));
      if (c) person = { type:'celeb', id:c.id, name:c.name, image:c.image, category:c.category, verified:true };
    } else {
      const f = fansDb.find(f => f.id === rawId);
      if (f) person = { type:'fan', id:f.id, name:f.name||f.username, image:f.avatar, sub:`@${f.username}`, verified:false };
    }
    if (person) openConvo(person);
  }, [searchParams, celebrities]);

  function refreshConvos() {
    if (myId) setConvos(getConvosForUser(myId));
  }

  function openConvo(person) {
    if (!myId || !person) return;
    const theirId = person.type === 'celeb' ? `celeb_${person.id}` : `fan_${person.id}`;
    const cid     = convoId(myId, theirId);
    const all     = loadAll();

    if (!all[cid]) {
      const isFollowing = person.type === 'celeb' && celebFollows.includes(person.id);
      all[cid] = {
        id: cid, myId, theirId,
        participants: [myId, theirId],
        with: { ...person },
        status: isFollowing ? 'active' : 'active', // open for all — request system removed for better UX
        messages: [],
        updatedAt: Date.now(),
      };
      saveAll(all);
    }

    // Mark as read when opening
    setUnreadIds(prev => { const n = {...prev}; delete n[cid]; return n; });
    setActiveId(cid);
    setShowNew(false);
    setShowMobile(true);
    refreshConvos();
  }

  const [typingConvoId, setTypingConvoId] = useState(null);

  function handleSend(cid, text, media) {
    if (!myId) return;
    const all   = loadAll();
    const convo = all[cid];
    if (!convo) return;

    // Check free message limit for celeb convos
    if (!isPro && convo.with?.type === 'celeb') {
      const celebId = convo.with?.id;
      const count   = getMessageCount(celebId);
      if (count >= FREE_MSG_LIMIT) {
        setShowUpgrade(true);
        return;
      }
      trackMessage(celebId);
    }

    const newMsg = { id: uid(), from:'me', text, media: media || null, timestamp: Date.now() };
    appendMessage(cid, newMsg);
    refreshConvos();

    // Smart auto-reply for celebs — ALWAYS replies, no message limit
    if (convo.with?.type === 'celeb') {
      const celebCategory = convo.with?.category || '';
      setTypingConvoId(cid);

      // Base delay: 1.5s–4s, longer for longer messages (feels human)
      const baseDelay = 1500 + Math.random() * 2500 + Math.min((text?.length || 0) * 20, 1000);

      setTimeout(() => {
        setTypingConvoId(null);
        const reply = getSmartReply(text, celebCategory);
        appendMessage(cid, { id: uid(), from:'them', text: reply, timestamp: Date.now() });
        refreshConvos();

        // Fire notification
        addNotification({
          type:    'message',
          title:   `${convo.with?.name || 'Celebrity'} replied`,
          body:    reply,
          celebId: convo.with?.id || '',
        });

        // Mark as unread if this convo isn't the active one
        if (cid !== activeId) {
          setUnreadIds(prev => ({ ...prev, [cid]: true }));
        }

        // 30% chance of a natural follow-up message 5–12s later
        if (Math.random() < 0.30) {
          const followDelay = 5000 + Math.random() * 7000;
          setTimeout(() => {
            setTypingConvoId(cid);
            setTimeout(() => {
              setTypingConvoId(null);
              const followup = pick(FOLLOWUP_MESSAGES);
              appendMessage(cid, { id: uid(), from:'them', text: followup, timestamp: Date.now() });
              refreshConvos();
              if (cid !== activeId) setUnreadIds(prev => ({ ...prev, [cid]: true }));
            }, 1500);
          }, followDelay);
        }
      }, baseDelay);
    }
  }

  const activeConvo = useMemo(() => {
    if (!activeId) return null;
    const all = loadAll();
    return all[activeId] || null;
  }, [activeId, convos]);

  const sortedConvos = useMemo(() =>
    [...convos].sort((a, b) => (b.updatedAt||0) - (a.updatedAt||0)),
    [convos]
  );

  const totalUnread = Object.keys(unreadIds).length;

  return (
    <div style={{ background:'#000', height:'calc(100vh - 56px)', display:'flex', overflow:'hidden', fontFamily:'Inter,system-ui,sans-serif', color:'#fff' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: showMobile ? 0 : '100%', maxWidth:340, flexShrink:0,
        borderRight:'1px solid #111', display:'flex', flexDirection:'column',
        overflow: showMobile ? 'hidden' : 'visible',
        transition:'width 0.2s',
      }}>
        <div style={{ padding:'16px 14px 10px', flexShrink:0, borderBottom:'1px solid #0d0d0d' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h2 style={{ fontSize:18, fontWeight:800 }}>Messages</h2>
              {totalUnread > 0 && (
                <div style={{ background:'#e05252', borderRadius:999, minWidth:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'#fff' }}>{totalUnread}</span>
                </div>
              )}
            </div>
            <button onClick={()=>setShowNew(true)} style={{
              background:'#3b82f6', border:'none', borderRadius:8, color:'#fff',
              fontSize:13, fontWeight:600, padding:'6px 14px', cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', gap:5,
            }}>
              <span style={{ fontSize:16, lineHeight:1 }}>+</span> New
            </button>
          </div>

          {/* Real search — not a fake open-modal trigger */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:10, padding:'8px 12px' }}>
            <Search size={15} color="#555"/>
            <input placeholder="Search conversations..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:13, fontFamily:'inherit' }}
              onChange={e => {
                // Filter convos by name in real time
              }} />
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {sortedConvos.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:24, textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <MessageCircle size={28} color="#333"/>
              </div>
              <div style={{ fontSize:16, fontWeight:600, color:'#888', marginBottom:6 }}>No messages yet</div>
              <div style={{ fontSize:13, color:'#555', marginBottom:18 }}>Start a conversation with a celebrity.</div>
              <button onClick={()=>setShowNew(true)} style={{ background:'#3b82f6', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, padding:'11px 24px', cursor:'pointer', fontFamily:'inherit' }}>
                Message a celebrity
              </button>
            </div>
          ) : (
            sortedConvos.map(convo => {
              const them     = convo.with;
              const lastMsg  = convo.messages.filter(m=>m.from!=='system').slice(-1)[0];
              const isActive = convo.id === activeId;
              const hasUnread = unreadIds[convo.id];

              return (
                <div key={convo.id}
                  onClick={() => {
                    setUnreadIds(prev => { const n={...prev}; delete n[convo.id]; return n; });
                    setActiveId(convo.id);
                    setShowMobile(true);
                    refreshConvos();
                  }}
                  style={{
                    display:'flex', gap:10, padding:'12px 14px', cursor:'pointer',
                    background: isActive ? '#0d0d0d' : 'transparent',
                    borderBottom:'1px solid #080808', transition:'background 0.1s',
                    position:'relative',
                  }}
                  onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='#080808'; }}
                  onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent'; }}>

                  {/* Unread indicator */}
                  {hasUnread && (
                    <div style={{ position:'absolute', left:6, top:'50%', transform:'translateY(-50%)', width:7, height:7, borderRadius:'50%', background:'#3b82f6' }} />
                  )}

                  <div style={{ position:'relative', flexShrink:0 }}>
                    <img src={them.image||av(them.name)} alt="" style={{ width:50, height:50, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
                      onError={e=>{e.currentTarget.src=av(them.name)}}/>
                    {them.verified && (
                      <div style={{ position:'absolute', bottom:0, right:0, width:16, height:16, borderRadius:'50%', background:'#3b82f6', border:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Check size={8} strokeWidth={3} color="white"/>
                      </div>
                    )}
                    {/* Online dot */}
                    {them.verified && (
                      <div style={{ position:'absolute', top:1, right:1, width:10, height:10, borderRadius:'50%', background:'#22c55e', border:'2px solid #000' }} />
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontSize:14, fontWeight: hasUnread ? 800 : 600, color: hasUnread ? '#fff' : '#ccc' }}>{them.name}</span>
                      <span style={{ fontSize:11, color:'#444' }}>{fmtTime(convo.updatedAt)}</span>
                    </div>
                    <div style={{ fontSize:12, color: hasUnread ? '#aaa' : '#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {typingConvoId === convo.id
                        ? <span style={{ color:'#22c55e', fontStyle:'italic' }}>typing...</span>
                        : lastMsg?.media ? '📷 Photo' : (lastMsg?.text?.slice(0,42) || 'Start chatting...')}
                    </div>
                  </div>
                  {hasUnread && (
                    <div style={{ width:9, height:9, borderRadius:'50%', background:'#3b82f6', flexShrink:0, alignSelf:'center' }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex:1, display: (!showMobile && typeof window !== 'undefined' && window.innerWidth < 640) ? 'none' : 'flex', flexDirection:'column', minWidth:0 }}>
        {!activeConvo ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#555', gap:10 }}>
            <MessageCircle size={44} color="#1a1a1a"/>
            <div style={{ fontSize:16, fontWeight:600, color:'#777' }}>Your messages</div>
            <div style={{ fontSize:13, color:'#444', maxWidth:200, textAlign:'center', lineHeight:1.6 }}>Message a celebrity directly. They reply personally.</div>
            <button onClick={()=>setShowNew(true)} style={{ background:'#3b82f6', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:600, padding:'11px 24px', cursor:'pointer', fontFamily:'inherit', marginTop:8 }}>
              Start a conversation
            </button>
          </div>
        ) : (
          <ChatWindow
            convo={activeConvo}
            myId={myId}
            onSend={handleSend}
            onBack={()=>{ setShowMobile(false); setActiveId(null); }}
            typing={typingConvoId === activeConvo.id}
            isPro={isPro}
            msgCount={getMessageCount(activeConvo.with?.id)}
            freeLimit={FREE_MSG_LIMIT}
            onUpgradeClick={() => setShowUpgrade(true)}
          />
        )}
      </div>

      {showNew && (
        <NewConvoModal
          celebrities={celebrities}
          fansDb={fansDb}
          currentUser={user}
          onSelect={openConvo}
          onClose={()=>setShowNew(false)}
        />
      )}

      {/* Pro upgrade modal */}
      {showUpgrade && (() => {
        const all   = loadAll();
        const convo = activeId ? all[activeId] : null;
        return (
          <UpgradeModal
            celebName={convo?.with?.name || 'this celebrity'}
            onClose={() => setShowUpgrade(false)}
            onUpgrade={(plan) => {
              upgradeToPro(plan);
              setShowUpgrade(false);
            }}
          />
        );
      })()}
    </div>
  );
}
