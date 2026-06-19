import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="sm-empty">
      <div className="sm-empty-icon">404</div>
      <h1 className="sm-empty-title">Page not found</h1>
      <p className="sm-empty-text">This page doesn&apos;t exist or was moved.</p>
      <div className="sm-empty-actions">
        <Link to="/" className="sm-btn sm-btn-primary">
          <ArrowLeft size={16} /> Home
        </Link>
        <Link to="/explore" className="sm-btn sm-btn-ghost">
          <Search size={16} /> Browse stars
        </Link>
      </div>
    </div>
  );
}
