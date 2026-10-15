import { CalendarDays } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import {
  formatDate,
  leaveStatusLabel,
  leaveStatusTone,
  leaveTypeLabel,
} from '../../../../utils/constants';
import { Badge, EmptyState, SectionLoading } from '../ui';
import useEmployeeData from '../useEmployeeData';

export default function LeaveTab({ employeeId }) {
  const { data, loading, error } = useEmployeeData(employeeId, profileApi.leaves);

  if (loading) return <SectionLoading label="Loading leave details..." />;
  if (error) return <div className="alert alert-danger py-2">{error}</div>;

  const records = data?.records || [];
  const balances = data?.summary?.balances || [];
  const pending = data?.summary?.pending || 0;

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel__header">
          <h3>Leave balance</h3>
          <span className="panel__hint">{pending} request(s) pending approval</span>
        </div>
        <div className="leave-balance-grid">
          {balances.map((balance) => {
            const pct =
              balance.entitlement > 0
                ? Math.min(Math.round((balance.used / balance.entitlement) * 100), 100)
                : 0;
            return (
              <div className="leave-balance" key={balance.type}>
                <div className="leave-balance__head">
                  <strong>{leaveTypeLabel(balance.type)}</strong>
                  <span>
                    {balance.balance}
                    <small> left</small>
                  </span>
                </div>
                <div className="leave-balance__track">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <small className="text-muted">
                  {balance.used} used of {balance.entitlement} days
                </small>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Leave history</h3>
          <span className="panel__hint">{records.length} record(s)</span>
        </div>

        {records.length ? (
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <Badge tone="indigo">{leaveTypeLabel(record.type)}</Badge>
                    </td>
                    <td>{formatDate(record.fromDate)}</td>
                    <td>{formatDate(record.toDate)}</td>
                    <td>{record.days}</td>
                    <td>
                      <Badge tone={leaveStatusTone(record.status)}>
                        {leaveStatusLabel(record.status)}
                      </Badge>
                    </td>
                    <td className="text-muted">{record.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={CalendarDays} title="No leave records" hint="Leave requests will appear here." />
        )}
      </div>
    </div>
  );
}
