import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[Starmeet] UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="sm-empty">
          <div className="sm-empty-icon">!</div>
          <h1 className="sm-empty-title">Something went wrong</h1>
          <p className="sm-empty-text">Refresh the page or head back home.</p>
          <Link to="/" className="sm-btn sm-btn-primary">Back to Starmeet</Link>
        </div>
      );
    }
    return this.props.children;
  }
}
