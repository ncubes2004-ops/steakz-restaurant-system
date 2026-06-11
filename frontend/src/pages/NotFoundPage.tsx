import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="hero">
      <h1 style={{ fontSize: '6rem' }}>404</h1>
      <div className="glow-line" />
      <p>This page doesn't exist in our system.</p>
      <Link to="/" className="btn btn-primary">Return Home</Link>
    </div>
  );
}
