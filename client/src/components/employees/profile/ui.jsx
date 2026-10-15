import { Loader2 } from 'lucide-react';

export function Badge({ tone = 'secondary', children, className = '' }) {
  return <span className={`badge-soft badge-soft--${tone} ${className}`}>{children}</span>;
}

export function Detail({ label, value, className = '' }) {
  return (
    <div className={`detail-item ${className}`}>
      <small>{label}</small>
      <strong className={value ? '' : 'detail-item--empty'}>{value || '—'}</strong>
    </div>
  );
}

export function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="profile-info__row">
      <span className="profile-info__label">
        {Icon && <Icon size={14} />} {label}
      </span>
      <span className="profile-info__value">{value || '—'}</span>
    </div>
  );
}

export function SectionLoading({ label = 'Loading...' }) {
  return (
    <div className="profile-empty">
      <Loader2 size={22} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="profile-empty">
      {Icon && <Icon size={26} />}
      <strong>{title}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function StatTile({ label, value, hint, tone = 'indigo', icon: Icon }) {
  return (
    <div className="profile-stat">
      {Icon && (
        <span className={`profile-stat__icon profile-stat__icon--${tone}`}>
          <Icon size={18} />
        </span>
      )}
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {hint && <span className="profile-stat__hint">{hint}</span>}
      </div>
    </div>
  );
}
