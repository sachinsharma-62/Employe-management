import Avatar from '../Avatar';
import EmptyState from './EmptyState';

export default function InfoList({ items, emptyLabel = 'Nothing scheduled' }) {
  if (!items?.length) return <EmptyState label={emptyLabel} />;

  return (
    <ul className="info-list">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="info-list__item">
            {item.employee ? (
              <Avatar user={item.employee} size={36} />
            ) : (
              <span className={`info-list__icon info-list__icon--${item.tone || 'indigo'}`}>
                {Icon ? <Icon size={16} /> : null}
              </span>
            )}
            <div className="info-list__body">
              <strong>{item.title}</strong>
              {item.subtitle && <small>{item.subtitle}</small>}
            </div>
            {item.meta && <span className="info-list__meta">{item.meta}</span>}
          </li>
        );
      })}
    </ul>
  );
}
