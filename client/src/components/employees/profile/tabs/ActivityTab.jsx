import { useEffect, useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import { formatDateTime } from '../../../../utils/constants';
import { EmptyState, SectionLoading } from '../ui';

const TYPE_TONES = {
  profile: 'indigo',
  employment: 'cyan',
  document: 'purple',
  note: 'amber',
  goal: 'green',
};

export default function ActivityTab({ employeeId }) {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    profileApi
      .activity(employeeId, { page, limit: 15 })
      .then((res) => {
        if (!active) return;
        setRecords((prev) => (page === 1 ? res.data.records : [...prev, ...res.data.records]));
        setPages(res.data.pagination.pages);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load activity');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [employeeId, page]);

  if (loading && records.length === 0) return <SectionLoading label="Loading activity history..." />;

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>
          <ActivityIcon size={17} className="me-2" /> Activity history
        </h3>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {records.length ? (
        <>
          <ul className="activity-feed">
            {records.map((item) => {
              const actor = item.actor;
              const actorName = actor
                ? actor.fullName || `${actor.firstName} ${actor.lastName}`
                : 'System';
              return (
                <li className="activity-feed__item" key={item._id}>
                  <span className={`activity-feed__icon activity-feed__icon--${TYPE_TONES[item.type] || 'indigo'}`}>
                    <ActivityIcon size={15} />
                  </span>
                  <div className="activity-feed__body">
                    <p>
                      <strong>{item.action}</strong>
                      {item.description ? ` — ${item.description}` : ''}
                    </p>
                    <small>
                      {actorName} · {formatDateTime(item.createdAt)}
                    </small>
                  </div>
                </li>
              );
            })}
          </ul>

          {page < pages && (
            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={ActivityIcon} title="No activity yet" hint="Employee actions will be tracked here." />
      )}
    </div>
  );
}
