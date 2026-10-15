import EmptyState from './EmptyState';

export default function BreakdownList({ items, emptyLabel = 'No data' }) {
  if (!items?.length) return <EmptyState label={emptyLabel} />;

  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <ul className="breakdown-list">
      {items.map((item) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <li key={item.label} className="breakdown-list__item">
            <div className="breakdown-list__head">
              <span>
                <i className={`breakdown-list__swatch breakdown-list__swatch--${item.tone}`} />
                {item.label}
              </span>
              <strong>
                {item.value} <small>{pct}%</small>
              </strong>
            </div>
            <div className="breakdown-list__track">
              <span
                className={`breakdown-list__bar breakdown-list__bar--${item.tone}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
