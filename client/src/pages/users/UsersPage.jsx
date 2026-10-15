import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, Users } from 'lucide-react';
import userApi from '../../api/user.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import { ALL_ROLES, ROLES, roleLabel } from '../../utils/constants';

const ROLES_FILTER = [
  { value: '', label: 'All roles' },
  ...ALL_ROLES.map((r) => ({ value: r, label: roleLabel(r) })),
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState(null);

  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const canToggleStatus =
    currentUser && [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(currentUser.role);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userApi.list({ page, limit: 10, search, role });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Could not load employees');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  const changeRole = async (user, newRole) => {
    if (!newRole || newRole === user.role) return;
    setActionId(user._id);
    try {
      const res = await userApi.updateRole(user._id, newRole);
      toast.success(res.data.message || 'Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Could not update role');
    } finally {
      setActionId(null);
    }
  };

  const toggleStatus = async (user) => {
    setActionId(user._id);
    try {
      const res = await userApi.updateStatus(user._id, !user.isActive);
      toast.success(res.data.message || 'Status updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Could not update status');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel__header">
          <h3>
            <Users size={17} className="me-2" />
            Employees
          </h3>
          <span className="panel__hint">{pagination.total} total</span>
        </div>

        <div className="users-toolbar">
          <div className="users-toolbar__search">
            <Search size={15} />
            <input
              className="form-control"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="form-select users-toolbar__filter"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            {ROLES_FILTER.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchUsers}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="table-responsive">
          <table className="table table-hover align-middle app-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="d-none d-md-table-cell">Designation</th>
                <th>Role</th>
                <th className="d-none d-lg-table-cell">Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">
                    No employees found
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u._id === currentUser?._id;
                  const busy = actionId === u._id;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar user={u} size={34} />
                          <div>
                            <strong className="d-block lh-sm">{u.fullName}</strong>
                            <small className="text-muted">{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">{u.designation || '—'}</td>
                      <td>
                        {isSuperAdmin && !isSelf ? (
                          <select
                            className="form-select form-select-sm role-select"
                            value={u.role}
                            disabled={busy}
                            onChange={(e) => changeRole(u, e.target.value)}
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {roleLabel(r)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`role-chip role-chip--${u.role.toLowerCase()}`}>
                            {roleLabel(u.role)}
                            {isSelf ? ' (you)' : ''}
                          </span>
                        )}
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <span
                          className={`status-dot ${u.isActive ? 'status-dot--on' : 'status-dot--off'}`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        {canToggleStatus && !isSelf && (
                          <button
                            type="button"
                            className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            disabled={busy}
                            onClick={() => toggleStatus(u)}
                          >
                            {busy ? (
                              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                            ) : u.isActive ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="users-pagination">
          <span className="text-muted small">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= pagination.pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
