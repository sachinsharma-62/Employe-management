import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  MapPin,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import organizationApi from '../../api/organization.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import PageLoader from '../../components/PageLoader';
import Avatar from '../../components/Avatar';
import { Badge } from '../../components/employees/profile/ui';
import TreeView from '../../components/organization/TreeView';
import EntityFormModal from '../../components/organization/EntityFormModal';
import AssignEmployeesModal from '../../components/organization/AssignEmployeesModal';
import {
  ROLES,
  employmentTypeLabel,
  locationTypeLabel,
  locationTypeTone,
} from '../../utils/constants';

const TABS = [
  { id: 'tree', label: 'Organization', icon: Network },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'designations', label: 'Designations', icon: BadgeCheck },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'managers', label: 'Reporting Managers', icon: UserCog },
  { id: 'employment-types', label: 'Employment Types', icon: Briefcase },
];

const ENTITY_LABELS = {
  department: 'department',
  designation: 'designation',
  team: 'team',
  location: 'location',
};

export default function OrganizationPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const canManage = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN].includes(currentUser?.role);

  const initialTab = searchParams.get('tab') || '';
  const [tab, setTab] = useState(
    TABS.some((item) => item.id === initialTab) ? initialTab : 'tree'
  );
  const [data, setData] = useState({
    departments: [],
    designations: [],
    teams: [],
    locations: [],
    tree: [],
    managers: [],
    employmentTypes: [],
    totalActive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [deptSearch, setDeptSearch] = useState('');
  const [desigSearch, setDesigSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [locSearch, setLocSearch] = useState('');

  const [form, setForm] = useState(null);
  const [assign, setAssign] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const fetchAll = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [depts, desigs, teams, locs, treeRes, managersRes, empTypesRes] = await Promise.all([
        organizationApi.departments(),
        organizationApi.designations(),
        organizationApi.teams(),
        organizationApi.locations(),
        organizationApi.tree(),
        organizationApi.managers(),
        organizationApi.employmentTypes(),
      ]);
      setData({
        departments: depts.data.departments || [],
        designations: desigs.data.designations || [],
        teams: teams.data.teams || [],
        locations: locs.data.locations || [],
        tree: treeRes.data.tree || [],
        managers: managersRes.data.managers || [],
        employmentTypes: empTypesRes.data.types || [],
        totalActive: empTypesRes.data.total || 0,
      });
    } catch (err) {
      setError(err.message || 'Could not load organization data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredDepartments = useMemo(() => {
    const term = deptSearch.trim().toLowerCase();
    if (!term) return data.departments;
    return data.departments.filter(
      (d) => d.name.toLowerCase().includes(term) || (d.code || '').toLowerCase().includes(term)
    );
  }, [data.departments, deptSearch]);

  const filteredDesignations = useMemo(() => {
    const term = desigSearch.trim().toLowerCase();
    if (!term) return data.designations;
    return data.designations.filter((d) => d.title.toLowerCase().includes(term));
  }, [data.designations, desigSearch]);

  const filteredTeams = useMemo(() => {
    const term = teamSearch.trim().toLowerCase();
    if (!term) return data.teams;
    return data.teams.filter((t) => t.name.toLowerCase().includes(term));
  }, [data.teams, teamSearch]);

  const filteredLocations = useMemo(() => {
    const term = locSearch.trim().toLowerCase();
    if (!term) return data.locations;
    return data.locations.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.city || '').toLowerCase().includes(term) ||
        (l.country || '').toLowerCase().includes(term)
    );
  }, [data.locations, locSearch]);

  const openAdd = (kind) => setForm({ kind, entity: null });
  const openEdit = (kind, entity) => setForm({ kind, entity });

  const handleSaved = () => {
    setForm(null);
    fetchAll(true);
  };

  const openAssign = (kind, entity) => setAssign({ kind, entity });

  const handleAssign = async (ids) => {
    const { kind, entity } = assign;
    const res =
      kind === 'department'
        ? await organizationApi.assignDepartmentEmployees(entity._id, ids)
        : await organizationApi.assignDesignationEmployees(entity._id, ids);
    toast.success(res.data.message || 'Employees assigned');
    fetchAll(true);
  };

  const requestDelete = (kind, entity) => {
    const label = entity.name || entity.title || ENTITY_LABELS[kind];
    const actions = {
      department: organizationApi.removeDepartment,
      designation: organizationApi.removeDesignation,
      team: organizationApi.removeTeam,
      location: organizationApi.removeLocation,
    };
    setConfirm({
      title: `Delete ${ENTITY_LABELS[kind]}`,
      message: `Permanently delete "${label}"?${
        kind === 'department'
          ? ' Employees will be unassigned from this department.'
          : kind === 'designation'
            ? ' Employees will have this designation removed.'
            : ''
      } This action cannot be undone.`,
      confirmLabel: 'Delete',
      run: () => actions[kind](entity._id),
    });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      const res = await confirm.run();
      toast.success(res.data.message || 'Deleted successfully');
      setConfirm(null);
      fetchAll(true);
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    } finally {
      setConfirmBusy(false);
    }
  };

  if (loading) return <PageLoader label="Loading organization..." />;

  const renderDeptCard = (dept) => (
    <div className="org-card" key={dept._id}>
      <div className="org-card__head">
        <div className="org-card__title">
          <span className="org-card__name">{dept.name}</span>
          {dept.code && <span className="org-card__code">{dept.code}</span>}
        </div>
        <span className={`status-dot ${dept.isActive ? 'status-dot--on' : 'status-dot--off'}`}>
          {dept.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className="org-card__meta">
        <UserCog size={14} /> Head: {dept.head?.fullName || 'Not assigned'}
        {dept.description && <span className="org-card__desc"> · {dept.description}</span>}
      </p>
      <div className="org-card__stats">
        <span>
          <strong>{dept.employeeCount}</strong> Active
        </span>
        <span>
          <strong>{dept.totalCount}</strong> Total
        </span>
        <span>
          <strong>{dept.teamCount}</strong> Teams
        </span>
      </div>
      {canManage && (
        <div className="org-card__actions">
          <button
            type="button"
            className="emp-actions__btn"
            title="Assign employees"
            onClick={() => openAssign('department', dept)}
          >
            <UserPlus size={15} />
          </button>
          <button
            type="button"
            className="emp-actions__btn"
            title="Edit department"
            onClick={() => openEdit('department', dept)}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="emp-actions__btn emp-actions__btn--danger"
            title="Delete department"
            onClick={() => requestDelete('department', dept)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );

  const renderActionButtons = (kind, entity) => {
    if (!canManage) return null;
    const assignable = kind === 'department' || kind === 'designation';
    return (
      <div className="d-flex justify-content-end gap-1">
        {assignable && (
          <button
            type="button"
            className="emp-actions__btn"
            title="Assign employees"
            onClick={() => openAssign(kind, entity)}
          >
            <UserPlus size={15} />
          </button>
        )}
        <button
          type="button"
          className="emp-actions__btn"
          title={`Edit ${kind}`}
          onClick={() => openEdit(kind, entity)}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          className="emp-actions__btn emp-actions__btn--danger"
          title={`Delete ${kind}`}
          onClick={() => requestDelete(kind, entity)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  };

  return (
    <div className="stack-lg">
      {!canManage && (
        <div className="alert alert-info py-2 mb-0">Organization structure is shown in read-only mode.</div>
      )}
      <div className="panel">
        <div className="panel__header">
          <h3>
            <Network size={17} className="me-2" /> Organization Management
          </h3>
          <div className="d-flex gap-2 align-items-center">
            <span className="panel__hint d-none d-sm-inline">{data.totalActive} active employees</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => fetchAll(true)}
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`profile-tabs__tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger py-2 mt-3">{error}</div>}

        <div className="mt-3">
          {tab === 'tree' && (
            <div className="panel">
              <div className="panel__header">
                <h3>
                  <Network size={17} className="me-2" /> Hierarchy
                </h3>
                <span className="panel__hint">Company → Department → Team → Manager → Employees</span>
              </div>
              <TreeView tree={data.tree} />
            </div>
          )}

          {tab === 'departments' && (
            <div className="stack-md">
              <div className="org-toolbar">
                <div className="org-toolbar__search">
                  <Search size={15} />
                  <input
                    className="form-control"
                    placeholder="Search departments..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                  />
                </div>
                {canManage && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('department')}>
                    <Plus size={15} className="me-1" /> Add department
                  </button>
                )}
              </div>
              {filteredDepartments.length ? (
                <div className="org-card-grid">{filteredDepartments.map(renderDeptCard)}</div>
              ) : (
                <p className="text-muted text-center py-4 mb-0">No departments found.</p>
              )}
            </div>
          )}

          {tab === 'designations' && (
            <div className="stack-md">
              <div className="org-toolbar">
                <div className="org-toolbar__search">
                  <Search size={15} />
                  <input
                    className="form-control"
                    placeholder="Search designations..."
                    value={desigSearch}
                    onChange={(e) => setDesigSearch(e.target.value)}
                  />
                </div>
                {canManage && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('designation')}>
                    <Plus size={15} className="me-1" /> Add designation
                  </button>
                )}
              </div>
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Designation</th>
                      <th>Department</th>
                      <th className="text-center">Employees</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDesignations.map((d) => (
                      <tr key={d._id}>
                        <td className="fw-semibold">{d.title}</td>
                        <td>{d.department ? <Badge tone="indigo">{d.department.name}</Badge> : <span className="text-muted">Unassigned</span>}</td>
                        <td className="text-center">{d.employeeCount}</td>
                        <td>
                          <span className={`status-dot ${d.isActive ? 'status-dot--on' : 'status-dot--off'}`}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{renderActionButtons('designation', d)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'teams' && (
            <div className="stack-md">
              <div className="org-toolbar">
                <div className="org-toolbar__search">
                  <Search size={15} />
                  <input
                    className="form-control"
                    placeholder="Search teams..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                  />
                </div>
                {canManage && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('team')}>
                    <Plus size={15} className="me-1" /> Add team
                  </button>
                )}
              </div>
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Department</th>
                      <th>Manager</th>
                      <th className="text-center">Members</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((t) => (
                      <tr key={t._id}>
                        <td className="fw-semibold">{t.name}</td>
                        <td>{t.department ? t.department.name : <span className="text-muted">—</span>}</td>
                        <td>
                          {t.manager ? (
                            <div className="d-flex align-items-center gap-2">
                              <Avatar user={t.manager} size={28} />
                              <span>{t.manager.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </td>
                        <td className="text-center">{t.memberCount}</td>
                        <td>
                          <span className={`status-dot ${t.isActive ? 'status-dot--on' : 'status-dot--off'}`}>
                            {t.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{renderActionButtons('team', t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'locations' && (
            <div className="stack-md">
              <div className="org-toolbar">
                <div className="org-toolbar__search">
                  <Search size={15} />
                  <input
                    className="form-control"
                    placeholder="Search locations..."
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                  />
                </div>
                {canManage && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openAdd('location')}>
                    <Plus size={15} className="me-1" /> Add location
                  </button>
                )}
              </div>
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Type</th>
                      <th>City</th>
                      <th className="text-center">Employees</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map((l) => (
                      <tr key={l._id}>
                        <td className="fw-semibold">{l.name}</td>
                        <td>
                          <Badge tone={locationTypeTone(l.type)}>{locationTypeLabel(l.type)}</Badge>
                        </td>
                        <td>
                          {l.city || '—'}
                          {(l.state || l.country) && (
                            <small className="text-muted">
                              {' '}
                              ({[l.state, l.country].filter(Boolean).join(', ')})
                            </small>
                          )}
                        </td>
                        <td className="text-center">{l.employeeCount}</td>
                        <td>
                          <span className={`status-dot ${l.isActive ? 'status-dot--on' : 'status-dot--off'}`}>
                            {l.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{renderActionButtons('location', l)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'managers' && (
            <div className="stack-md">
              <div className="profile-stat-grid">
                <div className="profile-stat">
                  <span className="profile-stat__icon profile-stat__icon--indigo">
                    <UserCog size={18} />
                  </span>
                  <div>
                    <small>Reporting managers</small>
                    <strong>{data.managers.length}</strong>
                  </div>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat__icon profile-stat__icon--green">
                    <Users size={18} />
                  </span>
                  <div>
                    <small>Reports</small>
                    <strong>
                      {data.managers.reduce((sum, m) => sum + (m.reportCount || 0), 0)}
                    </strong>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table app-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Manager</th>
                      <th className="d-none d-md-table-cell">Designation</th>
                      <th className="d-none d-lg-table-cell">Department</th>
                      <th className="text-center">Direct reports</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.managers.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Avatar user={m} size={34} />
                            <div>
                              <strong className="d-block lh-sm">{m.fullName}</strong>
                              <small className="text-muted">{m.employeeId || ''}</small>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">{m.designation || '—'}</td>
                        <td className="d-none d-lg-table-cell">{m.department || '—'}</td>
                        <td className="text-center">
                          <span className="badge-soft badge-soft--info">{m.reportCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'employment-types' && (
            <div className="stack-md">
              <div className="profile-stat-grid">
                {data.employmentTypes.map((t) => {
                  const pct = data.totalActive ? Math.round((t.count / data.totalActive) * 100) : 0;
                  return (
                    <div className="profile-stat" key={t.type}>
                      <span className="profile-stat__icon profile-stat__icon--indigo">
                        <Briefcase size={18} />
                      </span>
                      <div>
                        <small>{employmentTypeLabel(t.type)}</small>
                        <strong>{t.count}</strong>
                        <span className="profile-stat__hint">{pct}% of workforce</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="panel">
                <div className="panel__header">
                  <h3>
                    <Briefcase size={17} className="me-2" /> Distribution
                  </h3>
                  <span className="panel__hint">{data.totalActive} active employees</span>
                </div>
                <div className="table-responsive">
                  <table className="table app-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Employment type</th>
                        <th className="text-center">Employees</th>
                        <th className="d-none d-md-table-cell">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employmentTypes.map((t) => {
                        const pct = data.totalActive ? Math.round((t.count / data.totalActive) * 100) : 0;
                        return (
                          <tr key={t.type}>
                            <td className="fw-semibold">{employmentTypeLabel(t.type)}</td>
                            <td className="text-center">{t.count}</td>
                            <td className="d-none d-md-table-cell">
                              <div className="org-share">
                                <div className="org-share__track">
                                  <span style={{ width: `${pct}%` }} />
                                </div>
                                <small>{pct}%</small>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <EntityFormModal
        kind={form?.kind}
        entity={form?.entity}
        departments={data.departments}
        managers={data.managers}
        onClose={() => setForm(null)}
        onSaved={handleSaved}
      />

      {assign && (
        <AssignEmployeesModal
          open={Boolean(assign)}
          title={`Assign employees to ${assign.entity?.name || assign.entity?.title || assign.kind}`}
          subtitle={`Choose employees to assign to this ${ENTITY_LABELS[assign.kind]}`}
          onClose={() => setAssign(null)}
          onAssign={handleAssign}
        />
      )}

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
              className="btn btn-danger"
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