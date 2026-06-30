import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Eye, Ban, Grid3x3, Trash2, Download, Shield,
  MessageCircle, HardDrive, Wifi,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  SettingsShell, SettingsSection, SettingsRow, SettingsToggle, SettingsNote,
} from '../../components/settings/SettingsUI';

const DEFAULT_PRIVACY = { privateAccount: false, allowMessagesFrom: 'everyone', showActivity: true };
const DEFAULT_NOTIFS = { messages: true, likes: true, comments: true, follows: true, promotions: false };
const DEFAULT_CONTENT = { sensitiveContent: false, autoplay: true, dataSaver: false };

function useUserPrefs(user, key, defaults) {
  return user?.[key] || defaults;
}

export function SettingsPrivacy() {
  const { user, updateProfile } = useAuth();
  const privacy = useUserPrefs(user, 'privacySettings', DEFAULT_PRIVACY);

  function patch(p) {
    updateProfile({ privacySettings: { ...privacy, ...p } });
  }

  return (
    <SettingsShell title="Privacy" backTo="/settings">
      <SettingsNote>Control who can see your profile and interact with you.</SettingsNote>
      <SettingsSection label="Visibility">
        <SettingsToggle
          label="Private account"
          description="Only approved followers see your posts and full profile"
          checked={!!privacy.privateAccount}
          onChange={v => patch({ privateAccount: v })}
        />
        <SettingsToggle
          label="Show activity status"
          description="Let others see when you were last active"
          checked={privacy.showActivity !== false}
          onChange={v => patch({ showActivity: v })}
        />
      </SettingsSection>
      <SettingsSection label="Interactions">
        <SettingsRow
          icon={MessageCircle}
          label="Who can message you"
          meta={privacy.allowMessagesFrom === 'followers' ? 'Followers' : 'Everyone'}
          onClick={() => patch({
            allowMessagesFrom: privacy.allowMessagesFrom === 'followers' ? 'everyone' : 'followers',
          })}
        />
        <SettingsRow icon={Ban} label="Blocked accounts" to="/settings/blocked" badge={(user?.blockedUsers || []).length || undefined} />
      </SettingsSection>
      <SettingsSection>
        <SettingsRow icon={Shield} label="Privacy Centre" to="/privacy-centre" />
      </SettingsSection>
    </SettingsShell>
  );
}

export function SettingsNotifications() {
  const { user, updateProfile } = useAuth();
  const notifs = useUserPrefs(user, 'notifSettings', DEFAULT_NOTIFS);

  function patch(p) {
    updateProfile({ notifSettings: { ...notifs, ...p } });
  }

  return (
    <SettingsShell title="Notifications" backTo="/settings">
      <SettingsSection label="Push & in-app">
        <SettingsToggle label="Messages" description="When someone sends you a message" checked={notifs.messages !== false} onChange={v => patch({ messages: v })} />
        <SettingsToggle label="Likes" description="When someone likes your post" checked={notifs.likes !== false} onChange={v => patch({ likes: v })} />
        <SettingsToggle label="Comments" description="When someone comments on your post" checked={notifs.comments !== false} onChange={v => patch({ comments: v })} />
        <SettingsToggle label="New followers" description="When someone follows you" checked={notifs.follows !== false} onChange={v => patch({ follows: v })} />
      </SettingsSection>
      <SettingsSection label="Email">
        <SettingsToggle label="Promotions & tips" description="Starmeet news and Pro offers" checked={!!notifs.promotions} onChange={v => patch({ promotions: v })} />
      </SettingsSection>
    </SettingsShell>
  );
}

export function SettingsBlocked() {
  const { user, updateProfile, unblockUser, getFanById, fansDb } = useAuth();
  const blocked = user?.blockedUsers || [];

  const blockedFans = useMemo(() =>
    blocked.map(id => getFanById(id) || fansDb.find(f => f.id === id)).filter(Boolean),
    [blocked, getFanById, fansDb]
  );

  return (
    <SettingsShell title="Blocked accounts" backTo="/settings/privacy">
      {blockedFans.length === 0 ? (
        <SettingsNote>You have not blocked anyone. Blocked users cannot message you or see your profile.</SettingsNote>
      ) : (
        <SettingsSection>
          {blockedFans.map(fan => (
            <div key={fan.id} className="sm-settings-blocked-row">
              <div>
                <div className="sm-settings-blocked-name">{fan.name || fan.username}</div>
                <div className="sm-settings-blocked-user">@{fan.username}</div>
              </div>
              <button type="button" className="sm-btn sm-btn-ghost" onClick={() => unblockUser(fan.id)}>Unblock</button>
            </div>
          ))}
        </SettingsSection>
      )}
    </SettingsShell>
  );
}

export function SettingsContent() {
  const { user, updateProfile } = useAuth();
  const content = useUserPrefs(user, 'contentSettings', DEFAULT_CONTENT);

  function patch(p) {
    updateProfile({ contentSettings: { ...content, ...p } });
  }

  return (
    <SettingsShell title="Content preferences" backTo="/settings">
      <SettingsSection label="Feed">
        <SettingsToggle label="Autoplay videos" description="Videos play automatically in feed" checked={content.autoplay !== false} onChange={v => patch({ autoplay: v })} />
        <SettingsToggle label="Sensitive content" description="Show posts that may contain mature themes" checked={!!content.sensitiveContent} onChange={v => patch({ sensitiveContent: v })} />
      </SettingsSection>
      <SettingsSection label="Your posts">
        <SettingsRow icon={Grid3x3} label="Manage posts" to="/profile" meta="View profile" />
      </SettingsSection>
    </SettingsShell>
  );
}

export function SettingsData() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');

  function downloadData() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user?.id,
        username: user?.username,
        name: user?.name,
        email: user?.email,
        bio: user?.bio,
        location: user?.location,
        createdAt: user?.createdAt,
        privacySettings: user?.privacySettings,
        notifSettings: user?.notifSettings,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starmeet-data-${user?.username || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Your data file was downloaded.');
  }

  function requestDelete() {
    if (!window.confirm('Request account deletion? You will be taken to Support to confirm.')) return;
    navigate('/support');
  }

  return (
    <SettingsShell title="Your data" backTo="/settings">
      <SettingsNote>Download a copy of your profile data or request account deletion.</SettingsNote>
      {status && <div className="sm-auth-alert sm-auth-alert-success" style={{ marginBottom: 12 }}>{status}</div>}
      <SettingsSection label="Download">
        <SettingsRow icon={Download} label="Download your data" onClick={downloadData} meta="JSON file" />
      </SettingsSection>
      <SettingsSection label="Delete account">
        <SettingsRow icon={Trash2} label="Delete account" onClick={requestDelete} danger />
      </SettingsSection>
      <SettingsNote style={{ marginTop: 16 }}>
        Account deletion is processed by our team. You can also email <a href="mailto:privacy@starmeet.online">privacy@starmeet.online</a>.
      </SettingsNote>
    </SettingsShell>
  );
}

export function SettingsCache() {
  const { user, updateProfile } = useAuth();
  const content = useUserPrefs(user, 'contentSettings', DEFAULT_CONTENT);
  const [cleared, setCleared] = useState(false);

  function freeSpace() {
    const preserve = new Set([
      'sm_user', 'sm_fans_db', 'sm_celeb_follows', 'sm_fan_follows',
      'sm_fan_followers', 'sm_likes', 'sm_saved', 'sm_notifications',
    ]);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sm_') && !preserve.has(key)) {
        try { localStorage.removeItem(key); } catch {}
      }
    });
    setCleared(true);
  }

  function patchContent(p) {
    updateProfile({ contentSettings: { ...content, ...p } });
  }

  return (
    <SettingsShell title="Cache & mobile" backTo="/settings">
      {cleared && <div className="sm-auth-alert sm-auth-alert-success" style={{ marginBottom: 12 }}>Cache cleared. You may need to refresh the feed.</div>}
      <SettingsSection label="Storage">
        <SettingsRow icon={HardDrive} label="Free up space" onClick={freeSpace} meta="Clear cache" />
      </SettingsSection>
      <SettingsSection label="Data usage">
        <SettingsToggle
          label="Data Saver"
          description="Load lower-quality images on mobile"
          checked={!!content.dataSaver}
          onChange={v => patchContent({ dataSaver: v })}
        />
      </SettingsSection>
      <SettingsSection label="Offline">
        <SettingsRow icon={Wifi} label="Offline mode" meta="Coming soon" onClick={() => {}} />
      </SettingsSection>
    </SettingsShell>
  );
}
