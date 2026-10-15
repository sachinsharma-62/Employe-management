import { Star, TrendingUp } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import {
  formatDate,
  performanceStatusLabel,
  performanceStatusTone,
} from '../../../../utils/constants';
import { Badge, EmptyState, SectionLoading } from '../ui';
import useEmployeeData from '../useEmployeeData';

function Stars({ rating }) {
  if (!rating) return <span className="text-muted">Not rated</span>;
  return (
    <span className="rating-stars" title={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={15}
          className={n <= Math.round(rating) ? 'is-filled' : ''}
          fill={n <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
      <strong>{rating}</strong>
    </span>
  );
}

export default function PerformanceTab({ employeeId }) {
  const { data, loading, error } = useEmployeeData(employeeId, profileApi.performance);

  if (loading) return <SectionLoading label="Loading performance reviews..." />;
  if (error) return <div className="alert alert-danger py-2">{error}</div>;

  const records = data?.records || [];
  const summary = data?.summary;

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel__header">
          <h3>
            <TrendingUp size={17} className="me-2" /> Performance
          </h3>
          <span className="panel__hint">
            {summary ? `${summary.avgRating} avg from ${summary.reviews} review(s)` : ''}
          </span>
        </div>

        {records.length ? (
          <div className="review-list">
            {records.map((review) => {
              const reviewer = review.reviewer;
              const reviewerName = reviewer
                ? reviewer.fullName || `${reviewer.firstName} ${reviewer.lastName}`
                : 'Not assigned';
              return (
                <article className="review-card" key={review._id}>
                  <div className="review-card__head">
                    <div>
                      <h4>{review.cycle}</h4>
                      <small className="text-muted">
                        {formatDate(review.periodStart)} – {formatDate(review.periodEnd)}
                      </small>
                    </div>
                    <div className="review-card__meta">
                      <Stars rating={review.rating} />
                      <Badge tone={performanceStatusTone(review.status)}>
                        {performanceStatusLabel(review.status)}
                      </Badge>
                    </div>
                  </div>
                  <p className="review-card__summary">{review.summary || 'No summary provided.'}</p>
                  <div className="review-card__grid">
                    <div>
                      <small>Strengths</small>
                      <p>{review.strengths || '—'}</p>
                    </div>
                    <div>
                      <small>Improvements</small>
                      <p>{review.improvements || '—'}</p>
                    </div>
                  </div>
                  <small className="text-muted">
                    Reviewer: {reviewerName}
                    {review.reviewedAt ? ` · Reviewed ${formatDate(review.reviewedAt)}` : ''}
                  </small>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={TrendingUp} title="No performance reviews" hint="Reviews will appear here." />
        )}
      </div>
    </div>
  );
}
