import {
  BadgeCheck,
  CalendarClock,
  CircleSlash,
  FileClock,
  Files,
  ShieldX,
} from 'lucide-react';

const TILES = [
  { key: 'total', label: 'Total documents', tone: 'indigo', icon: Files },
  { key: 'pending', label: 'Pending review', tone: 'warning', icon: FileClock },
  { key: 'verified', label: 'Verified', tone: 'success', icon: BadgeCheck },
  { key: 'rejected', label: 'Rejected', tone: 'danger', icon: ShieldX },
  { key: 'expired', label: 'Expired', tone: 'danger', icon: CircleSlash },
  { key: 'expiringSoon', label: 'Expiring in 30d', tone: 'warning', icon: CalendarClock },
];

export default function DocumentStats({ stats }) {
  return (
    <div className="doc-stats">
      {TILES.map(({ key, label, tone, icon: Icon }) => (
        <div className="doc-stats__tile" key={key}>
          <span className={`doc-stats__icon doc-stats__icon--${tone}`}>
            <Icon size={18} />
          </span>
          <div>
            <small>{label}</small>
            <strong>{stats?.[key] ?? 0}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
