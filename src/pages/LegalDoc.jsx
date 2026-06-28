import { Link, useParams, useLocation } from 'react-router-dom';
import { LEGAL_DOCS } from '../data/legalDocs';
import { SettingsShell } from '../components/settings/SettingsUI';
import NotFound from './NotFound';

export default function LegalDoc() {
  const { slug } = useParams();
  const location = useLocation();
  const doc = LEGAL_DOCS[slug];

  if (!doc) return <NotFound />;

  const backTo = location.state?.from || '/policies';

  return (
    <SettingsShell title={doc.title} backTo={backTo}>
      <p className="sm-legal-updated" style={{ marginTop: 0 }}>Last updated: {doc.updated}</p>
      {doc.sections.map(section => (
        <section key={section.heading} className="sm-settings-legal-section">
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p className="sm-settings-note" style={{ marginTop: 20 }}>
        Questions? <Link to="/messages?with=support_starmeet">Contact support</Link>
      </p>
    </SettingsShell>
  );
}
