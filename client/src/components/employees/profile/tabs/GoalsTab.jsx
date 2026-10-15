import { Target } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import { formatDate, goalStatusLabel, goalStatusTone } from '../../../../utils/constants';
import { Badge, EmptyState, SectionLoading, StatTile } from '../ui';
import useEmployeeData from '../useEmployeeData';

export default function GoalsTab({ employeeId }) {
  const { data, loading, error } = useEmployeeData(employeeId, profileApi.goals);

  if (loading) return <SectionLoading label="Loading goals..." />;
  if (error) return <div className="alert alert-danger py-2">{error}</div>;

  const records = data?.records || [];
  const summary = data?.summary;

  return (
    <div className="stack-lg">
      {summary && (
        <div className="profile-stat-grid">
          <StatTile label="Total goals" value={summary.total} tone="indigo" icon={Target} />
          <StatTile label="Completed" value={summary.completed} tone="green" />
          <StatTile label="In progress" value={summary.inProgress} tone="cyan" />
          <StatTile label="At risk" value={summary.atRisk} tone="rose" />
          <StatTile label="Avg progress" value={`${summary.avgProgress}%`} tone="purple" />
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>Goals & objectives</h3>
          <span className="panel__hint">{records.length} goal(s)</span>
        </div>

        {records.length ? (
          <div className="goal-list">
            {records.map((goal) => (
              <div className="goal-item" key={goal._id}>
                <div className="goal-item__head">
                  <div>
                    <strong>{goal.title}</strong>
                    <small className="text-muted d-block">
                      {goal.category} · Weight {goal.weight}%
                      {goal.dueDate ? ` · Due ${formatDate(goal.dueDate)}` : ''}
                    </small>
                  </div>
                  <Badge tone={goalStatusTone(goal.status)}>{goalStatusLabel(goal.status)}</Badge>
                </div>
                {goal.description && <p className="goal-item__desc">{goal.description}</p>}
                <div className="goal-item__progress">
                  <div className="goal-item__track">
                    <span style={{ width: `${goal.progress}%` }} />
                  </div>
                  <strong>{goal.progress}%</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Target} title="No goals set" hint="Goals will appear here." />
        )}
      </div>
    </div>
  );
}
