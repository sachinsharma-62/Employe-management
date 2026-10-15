import {
  Cake,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogOut,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/constants';
import EmptyState from './EmptyState';

const ACTIVITY_META = {
  join: { icon: UserPlus, tone: 'cyan' },
  leave: { icon: CalendarDays, tone: 'amber' },
  attendance: { icon: Clock, tone: 'indigo' },
  promotion: { icon: TrendingUp, tone: 'green' },
  payroll: { icon: Wallet, tone: 'purple' },
  birthday: { icon: Cake, tone: 'rose' },
  exit: { icon: LogOut, tone: 'rose' },
  approved: { icon: CheckCircle2, tone: 'green' },
};

export default function ActivityFeed({ items }) {
  if (!items?.length) return <EmptyState label="No recent activity" />;

  return (
    <ul className="activity-feed">
      {items.map((item) => {
        const meta = ACTIVITY_META[item.type] || ACTIVITY_META.attendance;
        const Icon = meta.icon;
        return (
          <li key={item.id} className="activity-feed__item">
            <span className={`activity-feed__icon activity-feed__icon--${meta.tone}`}>
              <Icon size={15} />
            </span>
            <div className="activity-feed__body">
              <p>{item.message}</p>
              <small>{formatRelativeTime(item.at)}</small>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
