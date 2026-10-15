import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import employeeApi from '../../api/employee.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import EmployeeToolbar from '../../components/employees/EmployeeToolbar';
import EmployeeTable from '../../components/employees/EmployeeTable';
import EmployeeFormModal from '../../components/employees/EmployeeFormModal';
import EmployeeViewModal from '../../components/employees/EmployeeViewModal';
import { ROLES } from '../../utils/constants';

const DEFAULT_SORT = 'joiningDate:desc';
const PAGE_LIMIT = 10;

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const canViewRole = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.MANAGER].includes(currentUser?.role);
  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(currentUser?.role);
  const canAssignRole = currentUser?.role === ROLES.SUPER_ADMIN;

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_LIMIT, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);
  const [exporting, setExporting] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [sortBy, sortOrder] = useMemo(() => sort.split(':'), [sort]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await employeeApi.list({
        page,
        limit: PAGE_LIMIT,
        search,
        department,
        employmentType,
        status,
        sortBy,
        sortOrder,
      });
      setEmployees(res.data.employees);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Could not load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, department, employmentType, status, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchEmployees, search]);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    employeeApi
      .meta()
      .then((res) => {
        if (active) setMeta(res.data.meta);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [canManage]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, search, department, employmentType, status, sort]);

  const resetFilters = () => {
    setSearch('');
    setDepartment('');
    setEmploymentType('');
    setStatus('');
    setSort(DEFAULT_SORT);
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allSelected = employees.length > 0 && employees.every((e) => selectedIds.includes(e._id));
  const someSelected = employees.some((e) => selectedIds.includes(e._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !employees.some((e) => e._id === id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...employees.map((e) => e._id)])]);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSort(`${field}:${sortOrder === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSort(`${field}:asc`);
    }
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (employee) => {
    setViewOpen(false);
    setEditing(employee);
    setFormOpen(true);
  };

  const openView = (employee) => {
    setViewing(employee);
    setViewOpen(true);
  };

  const openProfile = (employee) => {
    navigate(`/employees/${employee._id}`);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditing(null);
    fetchEmployees();
  };

  const requestStatusToggle = (employee) => {
    setConfirm({
      title: employee.isActive ? 'Deactivate employee' : 'Activate employee',
      message: `${employee.isActive ? 'Deactivate' : 'Activate'} ${employee.fullName}? ${
        employee.isActive ? 'They will lose access immediately.' : 'They will regain access.'
      }`,
      confirmLabel: employee.isActive ? 'Deactivate' : 'Activate',
      tone: employee.isActive ? 'danger' : 'success',
      run: () => employeeApi.bulk(employee.isActive ? 'deactivate' : 'activate', [employee._id]),
    });
  };

  const requestDelete = (employee) => {
    setConfirm({
      title: 'Delete employee',
      message: `Permanently delete ${employee.fullName}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      run: () => employeeApi.remove(employee._id),
    });
  };

  const requestBulk = (action) => {
    if (selectedIds.length === 0) return;
    const labels = {
      activate: 'Activate',
      deactivate: 'Deactivate',
      delete: 'Delete',
    };
    setConfirm({
      title: `${labels[action]} employees`,
      message: `${labels[action]} ${selectedIds.length} selected employee(s)?${
        action === 'delete' ? ' This action cannot be undone.' : ''
      }`,
      confirmLabel: labels[action],
      tone: action === 'activate' ? 'success' : 'danger',
      run: () => employeeApi.bulk(action, selectedIds),
    });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      const res = await confirm.run();
      toast.success(res.data.message || 'Done');
      if (confirm.title.toLowerCase().includes('delete') || confirm.title.toLowerCase().includes('activate') || confirm.title.toLowerCase().includes('deactivate')) {
        setViewOpen(false);
      }
      setSelectedIds([]);
      setConfirm(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await employeeApi.exportCsv({
        search,
        department,
        employmentType,
        status,
        sortBy,
        sortOrder,
      });
      triggerDownload(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }), `employees-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Employee data exported');
    } catch {
      toast.error('Could not export employee data');
    } finally {
      setExporting(false);
    }
  };

  if (!canViewRole) return null;

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel__header">
          <h3>
            <Users size={17} className="me-2" />
            Employee Directory
          </h3>
          <span className="panel__hint">{pagination.total} employees</span>
        </div>

        <EmployeeToolbar
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          department={department}
          onDepartment={(v) => {
            setDepartment(v);
            setPage(1);
          }}
          employmentType={employmentType}
          onEmploymentType={(v) => {
            setEmploymentType(v);
            setPage(1);
          }}
          status={status}
          onStatus={(v) => {
            setStatus(v);
            setPage(1);
          }}
          sort={sort}
          onSort={setSort}
          canManage={canManage}
          onAdd={openAdd}
          onExport={handleExport}
          exporting={exporting}
          selectedCount={selectedIds.length}
          onBulk={requestBulk}
          onClearSelection={() => setSelectedIds([])}
          onReset={resetFilters}
        />

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <EmployeeTable
          employees={employees}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelected={allSelected}
          someSelected={someSelected}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onView={openView}
          onEdit={openEdit}
          onDelete={requestDelete}
          onToggleStatus={requestStatusToggle}
          onOpenProfile={openProfile}
          canManage={canManage}
          currentUserId={currentUser?._id}
        />

        <div className="users-pagination">
          <span className="text-muted small">
            Showing {employees.length} of {pagination.total} · Page {pagination.page} of {pagination.pages}
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

      {canManage && (
        <EmployeeFormModal
          open={formOpen}
          employee={editing}
          meta={meta}
          canAssignRole={canAssignRole}
          selfId={currentUser?._id}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      <EmployeeViewModal
        open={viewOpen}
        employee={viewing}
        canManage={canManage}
        currentUserId={currentUser?._id}
        onClose={() => setViewOpen(false)}
        onEdit={openEdit}
        onToggleStatus={(emp) => {
          setViewOpen(false);
          requestStatusToggle(emp);
        }}
        onOpenProfile={(emp) => {
          setViewOpen(false);
          openProfile(emp);
        }}
      />

      <Modal
        open={Boolean(confirm)}
        onClose={() => (confirmBusy ? null : setConfirm(null))}
        title={confirm?.title}
        size="sm"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setConfirm(null)}
              disabled={confirmBusy}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-${confirm?.tone === 'success' ? 'success' : 'danger'}`}
              onClick={runConfirm}
              disabled={confirmBusy}
            >
              {confirmBusy ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                confirm?.confirmLabel
              )}
            </button>
          </div>
        }
      >
        <p className="mb-0">{confirm?.message}</p>
      </Modal>
    </div>
  );
}
