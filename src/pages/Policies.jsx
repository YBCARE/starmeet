import { BookOpen, Users, FileText, Copyright, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SettingsShell, SettingsSection, SettingsRow } from '../components/settings/SettingsUI';
import { POLICY_LINKS } from '../data/legalDocs';

const ICONS = {
  users: Users,
  book: BookOpen,
  file: FileText,
  copyright: Copyright,
  star: Star,
};

export default function Policies() {
  const { isLoggedIn } = useAuth();

  return (
    <SettingsShell title="Terms and policies" backTo={isLoggedIn ? '/settings' : '/'}>
      <SettingsSection>
        {POLICY_LINKS.map(link => (
          <SettingsRow
            key={link.slug}
            icon={ICONS[link.icon]}
            label={link.label}
            to={`/legal/${link.slug}`}
          />
        ))}
      </SettingsSection>
      <p className="sm-settings-version">Starmeet policies · June 2026</p>
    </SettingsShell>
  );
}
