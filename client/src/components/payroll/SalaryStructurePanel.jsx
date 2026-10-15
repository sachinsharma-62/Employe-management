import { useCallback, useEffect, useState } from 'react';
import { Pencil, Search, Wallet } from 'lucide-react';
import payrollApi from '../../api/payroll.api';
import { useToast } from '../../context/ToastContext';
import Avatar from '../Avatar';
import SalaryStructureModal from './SalaryStructureModal';
import { DEPARTMENTS, formatCurrency } from '../../utils/constants';

const computeGross = (structure) =>
  structure
    ? structure.basic + structure.hra + structure.conveyance + structure.specialAllowance
    : 0;

const computeNet = (structure) =>
  structure
    ? computeGross(structure) +
      structure.bonus +
      structure.incentives +
      structure.overtime -
      (structure.pf +
        structure.esi +
        structure.professionalTax +
        structure.tds +
        structure.loanDeduction +
        structure.otherDeduction)
    : 0;

export default function SalaryStructurePanel({ canManage }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', department: '' });
  const [modal, setModal] = useState({ open: false, employee: null, structure: null });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.department) params.department = filters.department;
      const res = await payrollApi.structures(params);
      setRows(res.data.employees || []);
    } catch (err) {
      setError(err.message || 'Could not load salary structures');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      await payrollApi.saveStructure(modal.employee._id, payload);
      toast.success('Salary structure saved');
      setModal({ open: false, employee: null, structure: null });
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not save salary structure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <h3>
          <Wallet size={17} className="me-2" /> Employee salary
        </h3>
        <span className="panel__hint">{rows.length} employee(s)</span>
      </div>

      <div className="payroll-structure__filters">
        <div className="payroll-search">
          <Search size={15} />
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Search employee"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
        </div>
        <select
          className="form-select form-select-sm"
          value={filters.department}
          onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loading ? (
        <div className="dash-empty py-4">
          <span>Loading salary structures...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="dash-empty py-4">
          <span>No employees found</span>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table app-table align-middle mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th className="text-end">Monthly gross</th>
                <th className="text-end">Monthly net</th>
                <th className="text-end">Annual CTC</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ employee, structure, defaults }) => (
                <tr key={employee._id}>
                  <td>
                    <div className="payroll-table__employee">
                      <Avatar user={employee} size={34} />
                      <div>
                        <strong>
                          {employee.firstName} {employee.lastName}
                        </strong>
                        <small>{employee.employeeId || employee.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{employee.department || '—'}</td>
                  <td className="text-end">
                    {structure ? formatCurrency(computeGross(structure)) : <em>Default</em>}
                  </td>
                  <td className="text-end">
                    {structure ? formatCurrency(computeNet(structure)) : <em>Default</em>}
                  </td>
                  <td className="text-end">
                    {structure ? formatCurrency(computeGross(structure) * 12) : <em>Default</em>}
                  </td>
                  <td className="text-end">
                    {canManage && (
                      <button
                        type="button"
                        className="btn btn-sm btn-light"
                        onClick={() => setModal({ open: true, employee, structure })}
                        title={defaults ? 'Set salary structure' : 'Edit salary structure'}
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SalaryStructureModal
        open={modal.open}
        employee={modal.employee}
        structure={modal.structure}
        saving={saving}
        onClose={() => setModal({ open: false, employee: null, structure: null })}
        onSubmit={handleSave}
      />
    </section>
  );
}
