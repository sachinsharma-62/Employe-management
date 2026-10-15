import { CalendarClock, CalendarDays, GraduationCap, PartyPopper, Users2 } from 'lucide-react';

const TILES = [
  { key: 'total', label: 'Total events', tone: 'indigo', icon: CalendarDays },
  { key: 'upcoming', label: 'Upcoming', tone: 'cyan', icon: CalendarClock },
  { key: 'meetings', label: 'Meetings', tone: 'amber', icon: Users2 },
  { key: 'trainings', label: 'Training & workshops', tone: 'green', icon: GraduationCap },
  { key: 'celebrations', label: 'Celebrations', tone: 'purple', icon: PartyPopper },
];

export default function EventStats({ counts }) {
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
