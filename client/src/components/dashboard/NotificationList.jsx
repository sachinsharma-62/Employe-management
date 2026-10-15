import { Bell } from 'lucide-react';
import { formatRelativeTime } from '../../utils/constants';
import EmptyState from './EmptyState';

export default function NotificationList({ items }) {
  if (!items?.length) return <EmptyState label="You are all caught up" />;

  const unread = items.filter((i) => i.unread).length;

  return (
    <div>
      <div className="notif-summary">
        <Bell size={14} />
        <span>
          <strong>{unread}</strong> unread of {items.length}
        </span>
      </div>
      <ul className="notif-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`notif-list__item ${item.unread ? 'notif-list__item--unread' : ''}`}
          >
            <span className={`notif-list__dot notif-list__dot--${item.tone}`} />
            <div className="notif-list__body">
              <strong>{item.title}</strong>
              <small>{item.message}</small>
            </div>
            <span className="notif-list__time">{formatRelativeTime(item.at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
