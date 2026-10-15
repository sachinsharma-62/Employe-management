import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function QuickActions({ items }) {
  return (
    <div className="quick-actions">
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <>
            <span className={`quick-action__icon quick-action__icon--${item.tone}`}>
              <Icon size={17} />
            </span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
            <ArrowRight size={15} className="ms-auto text-muted" />
          </>
        );

        if (item.to) {
          return (
            <Link key={item.label} to={item.to} className="quick-action">
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            className="quick-action"
            onClick={item.onClick}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
