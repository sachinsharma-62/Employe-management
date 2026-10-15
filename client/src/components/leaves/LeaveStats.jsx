import { CalendarCheck, CalendarDays, CalendarX, Clock } from 'lucide-react';

const TILES = [
  { key: 'available', label: 'Available', tone: 'green', icon: CalendarCheck },
  { key: 'used', label: 'Used', tone: 'amber', icon: CalendarX },
  { key: 'pending', label: 'Pending', tone: 'cyan', icon: Clock },
  { key: 'entitlement', label: 'Total entitled', tone: 'indigo', icon: CalendarDays },
];

export default function LeaveStats({ totals }) {
  if (!totals) return null;

  const valueOf = (key) => {
    if (key === 'available') return totals.unlimited ? '∞' : totals.available;
    if (key === 'entitlement') return totals.unlimited ? '—' : totals.entitlement;
    return totals[key];
  };

  return (
    <div className="row g-3">
      {TILES.map(({ key, label, tone, icon: Icon }) => (
        <div className="col-6 col-lg-3" key={key}>
          <div className={`stat-card stat-card--${tone}`}>
            <span className="stat-card__icon">
              <Icon size={20} />
            </span>
            <div className="stat-card__body">
              <p className="stat-card__label">{label}</p>
              <p className="stat-card__value">
                {valueOf(key)}
                {key !== 'entitlement' && !totals.unlimited && (
                  <small className="text-muted ms-1" style={{ fontSize: '0.72rem', fontWeight: 500 }}>
                    days
                  </small>
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
