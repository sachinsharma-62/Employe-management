import { Loader2 } from 'lucide-react';

export default function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="page-loader">
      <Loader2 size={30} className="spin" />
      <span>{label}</span>
    </div>
  );
}
