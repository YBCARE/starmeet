import { useState, useRef } from 'react';
import { X, Upload, Send } from 'lucide-react';
import { createFanStory } from '../services/storyStore';
import './CreateStoryModal.css';

export default function CreateStoryModal({ user, onClose, onPosted }) {
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setMediaType(type);
    const reader = new FileReader();
    reader.onload = ev => setMedia(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!media || posting) return;
    setError('');
    setPosting(true);
    try {
      await createFanStory(user, { media, mediaType, caption });
      onPosted?.();
      onClose();
    } catch (err) {
      setError(err?.code === 'permission-denied'
        ? 'Could not post — check you are logged in and Firestore rules are published.'
        : (err?.message || 'Could not post story'));
    } finally {
      setPosting(false);
    }
  }

  const av = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'You')}&background=111&color=aaa&size=120`;

  return (
    <div className="sm-create-story-overlay" onClick={onClose}>
      <div className="sm-create-story-modal" onClick={e => e.stopPropagation()}>
        <div className="sm-create-story-head">
          <h2>New story</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="sm-create-story-body">
          {error && <div className="sm-create-story-error">{error}</div>}

          <button type="button" className="sm-create-story-upload" onClick={() => fileRef.current?.click()}>
            {media ? (
              mediaType === 'video'
                ? <video src={media} controls className="sm-create-story-preview" />
                : <img src={media} alt="" className="sm-create-story-preview" />
            ) : (
              <>
                <Upload size={28} />
                <span>Tap to add photo or video</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={handleFile} />

          <input
            className="sm-create-story-caption"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            maxLength={120}
          />

          <div className="sm-create-story-user">
            <img src={av} alt="" />
            <span>Posting as {user?.name || user?.username || 'You'}</span>
          </div>

          <button type="submit" className="sm-create-story-submit" disabled={!media || posting}>
            <Send size={16} /> {posting ? 'Posting…' : 'Share to story'}
          </button>
          <p className="sm-create-story-note">Stories disappear after 24 hours.</p>
        </form>
      </div>
    </div>
  );
}
