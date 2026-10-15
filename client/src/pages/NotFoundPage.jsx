import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="state-page">
      <div className="state-page__icon">
        <Compass size={34} />
      </div>
      <h1>404</h1>
      <p className="text-muted">The page you are looking for does not exist or was moved.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
