import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../employees/profile/ui';
import { leaveScopeLabel } from '../../utils/constants';

const scopeSummary = (type) => {
  if (type.applicableScope === 'ROLES') {
    return type.applicableRoles?.length ? type.applicableRoles.join(', ') : 'No roles selected';
  }
  if (type.applicableScope === 'DEPARTMENTS') {
    return type.applicableDepartments?.length
      ? type.applicableDepartments.join(', ')
      : 'No departments selected';
  }
  if (type.applicableScope === 'EMPLOYEES') {
    return `${type.applicableEmployees?.length || 0} employee(s)`;
  }
  return 'All employees';
};

export default function LeaveTypePanel({ types, loading, busy, onNew, onEdit, onDelete }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Leave configuration</h3>
        <button type="button" className="btn btn-primary btn-sm" onClick={onNew}>
          <Plus size={15} className="me-1" /> New leave type
        </button>
      </div>

      {loading ? (
        <div className="leave-empty">
          <span className="spinner-border spinner-border-sm" /> <span className="ms-2">Loading…</span>
        </div>
      ) : types.length ? (
        <div className="table-responsive">
          <table className="table app-table align-middle mb-0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Yearly days</th>
                <th>Carry forward</th>
                <th>Encashment</th>
                <th>Applicable to</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type._id}>
                  <td>
                    <Badge tone="indigo">{type.code}</Badge>
                  </td>
                  <td>
                    <strong>{type.name}</strong>
                    {type.description && (
                      <small className="text-muted d-block leave-reason-cell">{type.description}</small>
                    )}
                  </td>
                  <td>{type.unlimited ? 'Unlimited' : type.totalDays === 0 ? '0' : `${type.totalDays} days`}</td>
                  <td>
                    {type.carryForward ? (
                      `Yes${type.carryForwardLimit > 0 ? ` (max ${type.carryForwardLimit})` : ''}`
                    ) : (
                      <span className="text-muted">No</span>
                    )}
                  </td>
                  <td>{type.encashable ? 'Yes' : <span className="text-muted">No</span>}</td>
                  <td>
                    <span className="leave-scope-label">{leaveScopeLabel(type.applicableScope)}</span>
                    <small className="text-muted d-block leave-reason-cell">{scopeSummary(type)}</small>
                  </td>
                  <td>
                    <Badge tone={type.isActive ? 'success' : 'secondary'}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <div className="leave-actions">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => onEdit(type)}
                        disabled={busy === 'type'}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onDelete(type)}
                        disabled={busy === 'type'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="leave-empty">
          <strong>No leave types configured</strong>
          <small>Create a leave type to get started.</small>
        </div>
      )}
    </div>
  );
}
