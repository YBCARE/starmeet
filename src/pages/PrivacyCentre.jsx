import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, Lock, Database, Megaphone, Users, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SettingsShell, SettingsSection, SettingsRow } from '../components/settings/SettingsUI';

function PrivacyOverview() {
  return (
    <SettingsShell title="Overview" backTo="/privacy-centre">
      <div className="sm-privacy-hero sm-privacy-hero-compact">
        <Shield size={32} />
        <h2>Starmeet protects your privacy</h2>
        <p>We give you tools to control who sees your profile, who can message you, and what data we collect.</p>
      </div>
      <SettingsSection label="Quick links">
        <SettingsRow icon={Lock} label="Privacy tools" to="/settings/privacy" />
        <SettingsRow icon={Database} label="Learn about your data" to="/legal/privacy-policy" />
        <SettingsRow icon={Users} label="Community safety" to="/legal/community-guidelines" />
      </SettingsSection>
    </SettingsShell>
  );
}

function PrivacyAds() {
  return (
    <SettingsShell title="Ads and your data" backTo="/privacy-centre">
      <p className="sm-settings-note">
        Starmeet does not sell your personal data. We may show promotional content for Starmeet Pro inside the app.
      </p>
      <SettingsSection label="Your choices">
        <SettingsRow icon={Megaphone} label="Promotional emails" to="/settings/notifications" meta="In settings" />
        <SettingsRow icon={Database} label="Full privacy policy" to="/legal/privacy-policy" />
      </SettingsSection>
    </SettingsShell>
  );
}

function PrivacyHub() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <div className="sm-settings">
      <header className="sm-settings-header">
        <button type="button" className="sm-settings-back" onClick={() => navigate(isLoggedIn ? '/settings' : '/')} aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <h1 className="sm-settings-title">Privacy Centre</h1>
      </header>

      <div className="sm-privacy-hero">
        <div className="sm-privacy-hero-bg" />
        <div className="sm-privacy-hero-content">
          <Shield size={36} strokeWidth={1.5} />
          <h2>Starmeet protects your privacy</h2>
          <p>Control your account, learn how your data is used, and stay safe on Starmeet.</p>
        </div>
      </div>

      <div className="sm-settings-body" style={{ paddingTop: 8 }}>
        <SettingsSection>
          <SettingsRow icon={Shield} label="Overview" to="/privacy-centre/overview" />
          <SettingsRow icon={Lock} label="Your privacy tools" to="/settings/privacy" />
          <SettingsRow icon={Database} label="Learn about your data" to="/legal/privacy-policy" />
          <SettingsRow icon={Megaphone} label="Ads and your data" to="/privacy-centre/ads" />
          <SettingsRow icon={Users} label="Community Guidelines" to="/legal/community-guidelines" />
        </SettingsSection>
      </div>
    </div>
  );
}

export default function PrivacyCentre() {
  const { pathname } = useLocation();
  if (pathname.endsWith('/overview')) return <PrivacyOverview />;
  if (pathname.endsWith('/ads')) return <PrivacyAds />;
  return <PrivacyHub />;
}
