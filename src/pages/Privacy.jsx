import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="sm-legal">
      <div className="sm-legal-inner">
        <Link to="/" className="sm-legal-back">← Starmeet</Link>
        <h1>Privacy Policy</h1>
        <p className="sm-legal-updated">Last updated: June 2026</p>
        <section>
          <h2>What we collect</h2>
          <p>Account info (email, username, profile photo), usage data, messages you send, and device/browser data for security and analytics.</p>
        </section>
        <section>
          <h2>How we use it</h2>
          <p>To run the app, personalize your feed, process payments, prevent abuse, and improve Starmeet.</p>
        </section>
        <section>
          <h2>Sharing</h2>
          <p>We use Firebase, Stripe, and analytics providers. We do not sell your personal data.</p>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>Request access, correction, or deletion of your data by emailing <a href="mailto:privacy@starmeet.online">privacy@starmeet.online</a>.</p>
        </section>
      </div>
    </div>
  );
}
