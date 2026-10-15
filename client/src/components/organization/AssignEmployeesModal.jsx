import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import organizationApi from '../../api/organization.api';
import Modal from '../Modal';

const PAGE_LIMIT = 50;

export default function AssignEmployeesModal({
  open,
  title,
  subtitle,
  onClose,
  onAssign,
}) {
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (!open) return;
    setEmployees([]);
    setPage(1);
    setPages(1);
    setSearch('');
    setSelected([]);
    setError('');
    setSaving(false);
  }, [open]);

  const fetchEmployees = useCallback(async (nextPage, term) => {
    setLoading(true);
    setError('');
    try {
      const res = await organizationApi.employees({ page: nextPage, limit: PAGE_LIMIT, search: term });
      setEmployees((prev) => (nextPage === 1 ? res.data.employees : [...prev, ...res.data.employees]));
      setPages(res.data.pagination.pages);
    } catch (err) {
      setError(err.message || 'Could not load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchEmployees(1, search);
    }, search ? 350 : 0);
    return () => clearTimeout(searchTimer.current);
  }, [open, search, fetchEmployees]);

  useEffect(() => {
    if (!open || page === 1) return;
    fetchEmployees(page, search);
  }, [open, page, search, fetchEmployees]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Select at least one employee to assign');
      return;
    }
    setSaving(true);
    try {
      await onAssign(selected);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not assign employees');
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={Users}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <>
                <UserPlus size={15} className="me-1" /> Assign {selected.length > 0 && `(${selected.length})`}
              </>
            )}
          </button>
        </div>
      }
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="usa-search">
        <Search size={15} />
        <input
          className="form-control"
          placeholder="Search by name, email or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="usa-list">
        {loading && employees.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">No employees found</p>
        ) : (
          employees.map((emp) => {
            const checked = selected.includes(emp._id);
            return (
              <label className={`usa-item ${checked ? 'is-checked' : ''}`} key={emp._id}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={checked}
                  onChange={() => toggle(emp._id)}
                />
                <div className="usa-item__body">
                  <strong>{emp.fullName}</strong>
                  <small>
                    {emp.employeeId || 'No ID'}
                    {emp.designation ? ` · ${emp.designation}` : ''}
                    {emp.department ? ` · ${emp.department}` : ''}
                  </small>
                </div>
              </label>
            );
          })
        )}
      </div>

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
    </Modal>
  );
}