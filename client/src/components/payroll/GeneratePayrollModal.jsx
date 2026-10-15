import { useEffect, useState } from 'react';
import { CalendarPlus, Info } from 'lucide-react';
import Modal from '../Modal';
import { DEPARTMENTS, currentMonthKey } from '../../utils/constants';

export default function GeneratePayrollModal({ open, defaultMonth, saving, onClose, onSubmit }) {
  const [month, setMonth] = useState(defaultMonth || currentMonthKey());
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (open) {
      setMonth(defaultMonth || currentMonthKey());
      setDepartment('');
    }
  }, [open, defaultMonth]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate monthly payroll"
      subtitle="Create draft payslips from each employee's salary structure"
      icon={CalendarPlus}
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving || !month}
            onClick={() => onSubmit({ month, department: department || undefined })}
          >
            {saving ? 'Generating...' : 'Generate payslips'}
          </button>
        </div>
      }
    >
      <div className="mb-3">
        <label className="form-label" htmlFor="generate-month">
          Payroll month
        </label>
        <input
          id="generate-month"
          type="month"
          className="form-control"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="generate-department">
          Department (optional)
        </label>
        <select
          id="generate-department"
          className="form-select"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="generate-hint">
        <Info size={16} />
        <p>
          Draft payslips are created for every active employee who does not already have a payroll
          record for the selected month. Employees without a saved salary structure use the default
          structure.
        </p>
      </div>
    </Modal>
  );
}
