import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="state-page">
      <div className="state-page__icon state-page__icon--danger">
        <ShieldAlert size={34} />
      </div>
      <h1>403</h1>
      <p className="text-muted">
        You do not have permission to view this page. Contact your administrator if you
        believe this is a mistake.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
