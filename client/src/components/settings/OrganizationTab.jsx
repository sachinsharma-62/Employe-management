import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import organizationApi from '../../api/organization.api';
import { useToast } from '../../context/ToastContext';
import EntityFormModal from '../organization/EntityFormModal';
import { SectionLoading } from '../employees/profile/ui';
import { LOCATION_TYPES } from '../../utils/constants';

const CONFIG = {
  departments: {
    title: 'Departments',
    hint: 'Top-level groups employees belong to',
    list: organizationApi.departments,
    remove: organizationApi.removeDepartment,
    kind: 'department',
    icon: Building2,
    describe: (e) => (
      <>
        <strong>{e.name}</strong>
        {e.code && <span className="text-muted"> · {e.code}</span>}
        {e.head?.fullName && <span className="text-muted"> · Head: {e.head.fullName}</span>}
      </>
    ),
    count: (e) => `${e.employeeCount ?? 0} members`,
  },
  designations: {
    title: 'Designations',
    hint: 'Job titles used across departments',
    list: organizationApi.designations,
    remove: organizationApi.removeDesignation,
    kind: 'designation',
    icon: Building2,
    describe: (e) => (
      <>
        <strong>{e.title}</strong>
        {e.department?.name && <span className="text-muted"> · {e.department.name}</span>}
      </>
    ),
    count: (e) => `${e.employeeCount ?? 0} members`,
  },
  locations: {
    title: 'Locations',
    hint: 'Offices and branches around the company',
    list: organizationApi.locations,
    remove: organizationApi.removeLocation,
    kind: 'location',
    icon: Building2,
    describe: (e) => (
      <>
        <strong>{e.name}</strong>
        <span className="text-muted"> · {LOCATION_TYPES.find((t) => t.value === e.type)?.label || e.type}</span>
        {e.city && <span className="text-muted"> · {e.city}</span>}
      </>
    ),
    count: (e) => `${e.employeeCount ?? 0} members`,
  },
};

export default function OrganizationTab({ name, canManage }) {
  const toast = useToast();
  const cfg = CONFIG[name];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState('');
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cfg.list();
      setItems(res.data.items || res.data.departments || res.data.designations || res.data.locations || []);
    } catch (err) {
      toast.error(err.message || 'Could not load list');
    } finally {
      setLoading(false);
    }
  }, [cfg, toast]);

  useEffect(() => {
    load();
  }, [load, name]);

  useEffect(() => {
    Promise.all([organizationApi.managers(), organizationApi.departments()])
      .then(([m, d]) => {
        setManagers(m.data.items || []);
        setDepartments(d.data.departments || d.data.items || []);
      })
      .catch(() => {});
  }, [name]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name || item.title}"?`)) return;
    setDeleting(item._id);
    try {
      await cfg.remove(item._id);
      toast.success('Deleted');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    } finally {
      setDeleting('');
    }
  };

  return (
    <div className="stack-md">
      <div className="panel">
        <div className="panel__header">
          <h3>
            <cfg.icon size={17} className="me-2" /> {cfg.title}
          </h3>
          <span className="panel__hint">{cfg.hint}</span>
        </div>

        {loading ? (
          <SectionLoading label={`Loading ${cfg.title.toLowerCase()}...`} />
        ) : !items.length ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">Nothing here yet.</p>
            {canManage && (
              <button type="button" className="btn btn-primary mt-3" onClick={() => setModal({ entity: null })}>
                <Plus size={15} className="me-1" /> Add {cfg.kind}
              </button>
            )}
          </div>
        ) : (
          <>
            {canManage && (
              <div className="d-flex justify-content-end mb-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal({ entity: null })}>
                  <Plus size={15} className="me-1" /> Add {cfg.kind}
                </button>
              </div>
            )}
            <div className="row g-3">
              {items.map((item) => (
                <div className="col-md-6" key={item._id}>
                  <div className="entity-card d-flex align-items-center justify-content-between">
                    <div>
                      <div className="entity-card__title">{cfg.describe(item)}</div>
                      <small className="text-muted d-block">{cfg.count(item)}</small>
                    </div>
                    {canManage && (
                      <div className="event-actions d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setModal({ entity: item })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          disabled={deleting === item._id}
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <EntityFormModal
        kind={cfg.kind}
        entity={modal?.entity || null}
        departments={departments}
        managers={managers}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          load();
        }}
      />
    </div>
  );
}