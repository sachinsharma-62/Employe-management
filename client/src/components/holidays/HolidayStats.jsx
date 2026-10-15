import { Building2, CalendarDays, CalendarOff, Landmark } from 'lucide-react';

const TILES = [
  { key: 'total', label: 'Holidays', tone: 'indigo', icon: CalendarDays },
  { key: 'national', label: 'National', tone: 'cyan', icon: Landmark },
  { key: 'company', label: 'Company', tone: 'purple', icon: Building2 },
  { key: 'optional', label: 'Optional', tone: 'amber', icon: CalendarOff },
];

export default function HolidayStats({ counts }) {
  if (!counts) return null;

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
              <p className="stat-card__value">{counts[key] ?? 0}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}