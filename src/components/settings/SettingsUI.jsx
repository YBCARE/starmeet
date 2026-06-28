import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SettingsShell({ title, backTo = '/settings', children }) {
  const navigate = useNavigate();
  return (
    <div className="sm-settings">
      <header className="sm-settings-header">
        <button type="button" className="sm-settings-back" onClick={() => navigate(backTo)} aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <h1 className="sm-settings-title">{title}</h1>
      </header>
      <div className="sm-settings-body">{children}</div>
    </div>
  );
}

export function SettingsSection({ label, children }) {
  return (
    <section className="sm-settings-section">
      {label && <h2 className="sm-settings-section-label">{label}</h2>}
      <div className="sm-settings-card">{children}</div>
    </section>
  );
}

export function SettingsRow({ icon: Icon, label, to, onClick, meta, avatar, danger, badge }) {
  const inner = (
    <>
      <span className="sm-settings-row-icon">{Icon ? <Icon size={20} /> : null}</span>
      <span className="sm-settings-row-label">{label}</span>
      {badge != null && badge > 0 && <span className="sm-settings-row-badge">{badge}</span>}
      {meta && <span className="sm-settings-row-meta">{meta}</span>}
      {avatar && <img src={avatar} alt="" className="sm-settings-row-avatar" />}
      <ChevronRight size={18} className="sm-settings-row-chevron" />
    </>
  );

  if (to) {
    return <Link to={to} className={`sm-settings-row${danger ? ' danger' : ''}`}>{inner}</Link>;
  }
  return (
    <button type="button" onClick={onClick} className={`sm-settings-row${danger ? ' danger' : ''}`}>
      {inner}
    </button>
  );
}

export function SettingsToggle({ label, description, checked, onChange, disabled }) {
  return (
    <div className={`sm-settings-toggle-row${disabled ? ' disabled' : ''}`}>
      <div className="sm-settings-toggle-copy">
        <div className="sm-settings-toggle-label">{label}</div>
        {description && <div className="sm-settings-toggle-desc">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`sm-settings-switch${checked ? ' on' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
      />
    </div>
  );
}

export function SettingsNote({ children }) {
  return <p className="sm-settings-note">{children}</p>;
}
