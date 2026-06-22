import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Send, Search, Check, CheckCheck, X, Image, Smile, ChevronLeft,
  MessageCircle, Lock, Clock,
} from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { useAuth } from '../context/AuthContext';
import {
  loadAll, saveAll, convoId, updateConvoStatus,
  getConvosForUser, subscribeToConvos, syncConvosFromFirestore, appendMessage, uid,
  isAutoReplyEnabled,
} from '../services/messageStore';
import { celebPath } from '../utils/celebrity';
import { redirectToStripe } from '../config/stripe';
import './Messages.css';

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
    <div className="msg-typing">
      <div className="msg-typing-dot" />
      <div className="msg-typing-dot" />
      <div className="msg-typing-dot" />
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
    <div className="msg-modal-overlay">
      <div className="msg-modal">
        <div className="msg-modal-head">
          <h3>New Message</h3>
          <button onClick={onClose} className="msg-modal-close"><X size={20} /></button>
        </div>
        <div className="msg-modal-body">
          <div className="msg-search" style={{ marginBottom: 12 }}>
            <Search size={15} color="var(--sm-text-faint)" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search celebrities or fans..." />
          </div>
          {q.length < 2 && (
            <div className="msg-modal-hint">Type to search celebrities and fans</div>
          )}
          {results.map(r => (
            <div key={`${r.type}_${r.id}`} onClick={() => onSelect(r)} className="msg-modal-result">
              <div className="msg-convo-avatar-wrap">
                <img src={r.image || av(r.name)} alt=""
                  onError={e => { e.currentTarget.src = av(r.name); }} />
                {r.verified && (
                  <div className="msg-verified">
                    <Check size={8} strokeWidth={3} color="white" />
                  </div>
                )}
              </div>
              <div>
                <div className="msg-modal-result-name">{r.name}</div>
                <div className="msg-modal-result-sub">{r.sub}</div>
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
    <div className="msg-chat">
      <div className="msg-chat-head">
        <button onClick={onBack} className="msg-back-btn">
          <ChevronLeft size={22} />
        </button>
        <Link to={them.type === 'celeb' ? celebPath(them) : `/user/${them.id}`}
          className="msg-chat-profile">
          <div className="msg-chat-avatar-wrap">
            <img src={them.image || av(them.name)} alt="" className="msg-chat-avatar"
              onError={e => { e.currentTarget.src = av(them.name); }} />
            {them.verified && (
              <div className="msg-verified">
                <Check size={7} strokeWidth={3} color="white" />
              </div>
            )}
            <div className="msg-chat-online-lg" />
          </div>
          <div>
            <div className="msg-chat-name">{them.name}</div>
            <div className="msg-chat-status">Online now</div>
          </div>
        </Link>
        {isRequest && (
          <span className="msg-request-badge">
            <Clock size={11} /> Request
          </span>
        )}
      </div>

      <div className="msg-body">
        {msgs.length === 0 && (
          <div className="msg-empty-chat">
            <div className="msg-empty-chat-avatar">
              <img src={them.image || av(them.name)} alt=""
                onError={e => { e.currentTarget.src = av(them.name); }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sm-text-secondary)', marginBottom: 4 }}>{them.name}</div>
            <div style={{ fontSize: 12, color: 'var(--sm-text-faint)', marginBottom: 4 }}>{them.category || ''}</div>
            <div style={{ fontSize: 12, color: '#333' }}>
              {them.verified ? '✦ Verified celebrity · Online now' : 'Start your conversation below'}
            </div>
          </div>
        )}

        {msgs.map((msg, msgIdx) => {
          const isLast = msgIdx === msgs.length - 1;
          return (
            <div key={msg.id} className={`msg-row ${msg.from === 'me' ? 'me' : msg.from === 'system' ? 'system' : 'them'}`}>
              {msg.from === 'system' ? (
                <div className="msg-system">
                  <Lock size={11} /> {msg.text}
                </div>
              ) : (
                <div className="msg-bubble-wrap">
                  {msg.from !== 'me' && (
                    <img src={them.image || av(them.name)} alt="" className="msg-bubble-avatar"
                      onError={e => { e.currentTarget.src = av(them.name); }} />
                  )}
                  <div className={`msg-bubble ${msg.from}${msg.media ? ' media' : ''}`}>
                    {msg.media && <img src={msg.media} alt="" />}
                    {msg.text && <div style={{ padding: msg.media ? '6px 8px 4px' : 0 }}>{msg.text}</div>}
                    <div className={`msg-bubble-time ${msg.from}`}>{fmtTime(msg.timestamp)}</div>
                  </div>
                  {msg.from === 'me' && isLast && seenMsgId === 'latest' && (
                    <div className="msg-receipt seen">
                      <CheckCheck size={13} />
                      <span>Seen by {them.name?.split(' ')[0]}</span>
                    </div>
                  )}
                  {msg.from === 'me' && isLast && seenMsgId !== 'latest' && (
                    <div className="msg-receipt sent">
                      <Check size={13} />
                      <span>Sent</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {typingExternal && (
          <div className="msg-typing-row">
            <img src={them.image || av(them.name)} alt="" className="msg-bubble-avatar"
              onError={e => { e.currentTarget.src = av(them.name); }} />
            <TypingBubble />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showEmoji && (
        <div className="msg-emoji-bar">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setInput(i => i + e)} className="msg-emoji-btn">{e}</button>
          ))}
        </div>
      )}

      {!isPro && them.type === 'celeb' && msgCount >= freeLimit - 2 && msgCount < freeLimit && (
        <div className="msg-limit-bar">
          <span>
            ⚡ {freeLimit - msgCount} free message{freeLimit - msgCount !== 1 ? 's' : ''} left with {them.name?.split(' ')[0]}
          </span>
          <button onClick={onUpgradeClick} className="msg-limit-upgrade">Upgrade</button>
        </div>
      )}

      <div className="msg-input-bar">
        <button onClick={() => setShowEmoji(s => !s)} className={`msg-input-icon${showEmoji ? ' active' : ''}`}>
          <Smile size={22} />
        </button>
        <button onClick={() => fileRef.current?.click()} className="msg-input-icon">
          <Image size={22} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message ${them.name?.split(' ')[0] || 'them'}...`}
          className="msg-input"
        />
        <button onClick={() => send(input)} className={`msg-send-btn${input.trim() ? ' active' : ' inactive'}`}>
          <Send size={17} color="#fff" />
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
    <div className="msg-upgrade-overlay" onClick={onClose}>
      <div className="msg-upgrade" onClick={e => e.stopPropagation()}>
        <div className="msg-upgrade-hero">
          <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
          <h3>Unlock Unlimited Messages</h3>
          <p>
            You&apos;ve used your {FREE_MSG_LIMIT} free messages with <strong>{celebName}</strong>.<br />
            Upgrade to keep the conversation going.
          </p>
        </div>
        <div className="msg-upgrade-body">
          <div className="msg-upgrade-plan">
            <span className="msg-upgrade-popular">MOST POPULAR</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Pro Fan</div>
                <div style={{ fontSize: 12, color: '#60a5fa' }}>Unlimited messages · All celebrities</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>$9</div>
                <div style={{ fontSize: 11, color: 'var(--sm-text-faint)' }}>/month</div>
              </div>
            </div>
            {['Unlimited direct messages', 'Priority replies from celebrities', 'Pro badge on your profile', 'Exclusive celebrity content', 'Early access to new features'].map(f => (
              <div key={f} className="msg-upgrade-feature">
                <div className="msg-upgrade-check">
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
                {f}
              </div>
            ))}
            <button onClick={() => handleUpgrade('pro')} className="msg-upgrade-cta">
              Upgrade to Pro — $9/mo →
            </button>
          </div>
          <div className="msg-upgrade-secondary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Celebrity 🌟</div>
              <div><span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>$29</span><span style={{ fontSize: 11, color: 'var(--sm-text-faint)' }}>/mo</span></div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--sm-text-faint)' }}>Everything in Pro + verified celebrity badge + direct fan inbox</div>
          </div>
          <button onClick={onClose} className="msg-upgrade-dismiss">
            Maybe later — I&apos;ll use my remaining free messages
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

    // Smart auto-reply for celebs — until admin takes over the chat
    if (convo.with?.type === 'celeb' && isAutoReplyEnabled(convo)) {
      const celebCategory = convo.with?.category || '';
      setTypingConvoId(cid);

      // Base delay: 1.5s–4s, longer for longer messages (feels human)
      const baseDelay = 1500 + Math.random() * 2500 + Math.min((text?.length || 0) * 20, 1000);

      setTimeout(() => {
        const latest = loadAll()[cid];
        if (!latest || !isAutoReplyEnabled(latest)) {
          setTypingConvoId(prev => (prev === cid ? null : prev));
          return;
        }

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
            const still = loadAll()[cid];
            if (!still || !isAutoReplyEnabled(still)) return;

            setTypingConvoId(cid);
            setTimeout(() => {
              const again = loadAll()[cid];
              if (!again || !isAutoReplyEnabled(again)) {
                setTypingConvoId(prev => (prev === cid ? null : prev));
                return;
              }
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
    <div className="msg-page">

      <div className={`msg-sidebar${showMobile ? ' hidden' : ''}`}>
        <div className="msg-sidebar-head">
          <div className="msg-sidebar-top">
            <div className="msg-sidebar-title">
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Messages</h2>
              {totalUnread > 0 && (
                <span className="msg-unread-badge">{totalUnread}</span>
              )}
            </div>
            <button onClick={() => setShowNew(true)} className="msg-new-btn">
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New
            </button>
          </div>

          <div className="msg-search">
            <Search size={15} color="var(--sm-text-faint)" />
            <input placeholder="Search conversations..." />
          </div>
        </div>

        <div className="msg-convo-list">
          {sortedConvos.length === 0 ? (
            <div className="msg-empty-sidebar">
              <div className="msg-empty-icon-wrap">
                <MessageCircle size={28} color="#333" />
              </div>
              <div className="msg-empty-title">No messages yet</div>
              <div className="msg-empty-text">Start a conversation with a celebrity.</div>
              <button onClick={() => setShowNew(true)} className="msg-new-btn" style={{ padding: '11px 24px' }}>
                Message a celebrity
              </button>
            </div>
          ) : (
            sortedConvos.map(convo => {
              const them = convo.with;
              const lastMsg = convo.messages.filter(m => m.from !== 'system').slice(-1)[0];
              const isActive = convo.id === activeId;
              const hasUnread = unreadIds[convo.id];

              return (
                <div key={convo.id}
                  onClick={() => {
                    setUnreadIds(prev => { const n = { ...prev }; delete n[convo.id]; return n; });
                    setActiveId(convo.id);
                    setShowMobile(true);
                    refreshConvos();
                  }}
                  className={`msg-convo${isActive ? ' active' : ''}`}>

                  {hasUnread && <div className="msg-convo-unread-dot" />}

                  <div className="msg-convo-avatar-wrap">
                    <img src={them.image || av(them.name)} alt="" className="msg-convo-avatar"
                      onError={e => { e.currentTarget.src = av(them.name); }} />
                    {them.verified && (
                      <div className="msg-verified">
                        <Check size={8} strokeWidth={3} color="white" />
                      </div>
                    )}
                    {them.verified && <div className="msg-online" />}
                  </div>
                  <div className="msg-convo-body">
                    <div className="msg-convo-row">
                      <span className={`msg-convo-name${hasUnread ? ' unread' : ''}`}>{them.name}</span>
                      <span className="msg-convo-time">{fmtTime(convo.updatedAt)}</span>
                    </div>
                    <div className={`msg-convo-preview${hasUnread ? ' unread' : ''}${typingConvoId === convo.id ? ' typing' : ''}`}>
                      {typingConvoId === convo.id
                        ? 'typing...'
                        : lastMsg?.media ? '📷 Photo' : (lastMsg?.text?.slice(0, 42) || 'Start chatting...')}
                    </div>
                  </div>
                  {hasUnread && <div className="msg-convo-badge" />}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={`msg-chat-area${!showMobile && typeof window !== 'undefined' && window.innerWidth < 640 ? ' mobile-hidden' : ''}`}>
        {!activeConvo ? (
          <div className="msg-chat-empty">
            <MessageCircle size={44} color="var(--sm-border)" />
            <div className="msg-chat-empty-title">Your messages</div>
            <div className="msg-chat-empty-text">Message a celebrity directly. They reply personally.</div>
            <button onClick={() => setShowNew(true)} className="msg-new-btn" style={{ padding: '11px 24px', marginTop: 8 }}>
              Start a conversation
            </button>
          </div>
        ) : (
          <ChatWindow
            convo={activeConvo}
            myId={myId}
            onSend={handleSend}
            onBack={() => { setShowMobile(false); setActiveId(null); }}
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
