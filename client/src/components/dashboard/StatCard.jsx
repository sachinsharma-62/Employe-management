import { TrendingDown, TrendingUp } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, tone = 'indigo', trend }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">
        <Icon size={20} />
      </div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {trend && (
          <span className={`stat-card__trend stat-card__trend--${trend.dir}`}>
            {trend.dir === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <strong>
              {trend.value}
              {trend.suffix === undefined ? '%' : trend.suffix}
            </strong>
            {trend.hint && <em>{trend.hint}</em>}
          </span>
        )}
      </div>
    </div>
  );
}
