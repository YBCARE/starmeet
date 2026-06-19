import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="sm-legal">
      <div className="sm-legal-inner">
        <Link to="/" className="sm-legal-back">← Starmeet</Link>
        <h1>Terms of Service</h1>
        <p className="sm-legal-updated">Last updated: June 2026</p>
        <section>
          <h2>Using Starmeet</h2>
          <p>Starmeet connects fans with celebrity profiles and messaging features. You must be 13+ to use the service.</p>
        </section>
        <section>
          <h2>Accounts</h2>
          <p>You are responsible for your account credentials and activity. Do not impersonate others or harass users.</p>
        </section>
        <section>
          <h2>Subscriptions</h2>
          <p>Pro and premium features may require payment. Billing terms are shown at checkout. Cancel anytime from your account settings.</p>
        </section>
        <section>
          <h2>Content</h2>
          <p>You retain rights to content you post. You grant Starmeet a license to display it on the platform. We may remove content that violates these terms.</p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>Questions: <a href="mailto:support@starmeet.online">support@starmeet.online</a></p>
        </section>
      </div>
    </div>
  );
}
