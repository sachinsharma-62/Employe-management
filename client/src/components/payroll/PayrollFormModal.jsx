import { useEffect, useMemo, useState } from 'react';
import { Save, SlidersHorizontal } from 'lucide-react';
import Modal from '../Modal';
import {
  PAYROLL_DEDUCTIONS,
  PAYROLL_EARNINGS,
  formatCurrency,
  formatMonthLong,
} from '../../utils/constants';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const buildForm = (record) => {
  const form = {};
  [...PAYROLL_EARNINGS, ...PAYROLL_DEDUCTIONS].forEach(({ key }) => {
    form[key] = record?.[key] ?? 0;
  });
  form.workingDays = record?.workingDays ?? 0;
  form.paidDays = record?.paidDays ?? record?.workingDays ?? 0;
  return form;
};

export default function PayrollFormModal({ open, record, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildForm(record));

  useEffect(() => {
    if (open) setForm(buildForm(record));
  }, [open, record]);

  const totals = useMemo(() => {
    const gross = ['basic', 'hra', 'conveyance', 'specialAllowance'].reduce(
      (sum, key) => sum + toNumber(form[key]),
      0
    );
    const earnings = PAYROLL_EARNINGS.reduce((sum, { key }) => sum + toNumber(form[key]), 0);
    const deductions = PAYROLL_DEDUCTIONS.reduce((sum, { key }) => sum + toNumber(form[key]), 0);
    return { gross, earnings, deductions, net: earnings - deductions };
  }, [form]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const payload = {};
    [...PAYROLL_EARNINGS, ...PAYROLL_DEDUCTIONS].forEach(({ key }) => {
      payload[key] = toNumber(form[key]);
    });
    payload.workingDays = toNumber(form.workingDays);
    payload.paidDays = toNumber(form.paidDays);
    onSubmit(payload, record?._id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit salary components"
      subtitle={record ? `${record.employee?.firstName || ''} · ${formatMonthLong(record.month)}` : ''}
      icon={SlidersHorizontal}
      size="lg"
      footer={
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
            <Save size={14} className="me-1" /> {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      }
    >
      <div className="row g-3">
        <div className="col-md-6">
          <h4 className="payroll-form__title">Earnings</h4>
          {PAYROLL_EARNINGS.map(({ key, label }) => (
            <div className="payroll-form__row" key={key}>
              <label htmlFor={`earning-${key}`}>{label}</label>
              <input
                id={`earning-${key}`}
                type="number"
                min="0"
                className="form-control form-control-sm"
                value={form[key]}
                onChange={(event) => handleChange(key, event.target.value)}
              />
            </div>
          ))}
          <div className="payroll-form__subtotal">
            <span>Total earnings</span>
            <strong>{formatCurrency(totals.earnings)}</strong>
          </div>
        </div>

        <div className="col-md-6">
          <h4 className="payroll-form__title">Deductions</h4>
          {PAYROLL_DEDUCTIONS.map(({ key, label }) => (
            <div className="payroll-form__row" key={key}>
              <label htmlFor={`deduction-${key}`}>{label}</label>
              <input
                id={`deduction-${key}`}
                type="number"
                min="0"
                className="form-control form-control-sm"
                value={form[key]}
                onChange={(event) => handleChange(key, event.target.value)}
              />
            </div>
          ))}
          <div className="payroll-form__subtotal">
            <span>Total deductions</span>
            <strong className="text-danger">{formatCurrency(totals.deductions)}</strong>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <div className="payroll-form__row">
            <label htmlFor="payroll-working-days">Working days</label>
            <input
              id="payroll-working-days"
              type="number"
              min="0"
              className="form-control form-control-sm"
              value={form.workingDays}
              onChange={(event) => handleChange('workingDays', event.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="payroll-form__row">
            <label htmlFor="payroll-paid-days">Paid days</label>
            <input
              id="payroll-paid-days"
              type="number"
              min="0"
              className="form-control form-control-sm"
              value={form.paidDays}
              onChange={(event) => handleChange('paidDays', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="payroll-form__summary">
        <div>
          <span>Gross salary</span>
          <strong>{formatCurrency(totals.gross)}</strong>
        </div>
        <div>
          <span>Total deductions</span>
          <strong className="text-danger">{formatCurrency(totals.deductions)}</strong>
        </div>
        <div>
          <span>Net salary</span>
          <strong>{formatCurrency(totals.net)}</strong>
        </div>
      </div>
    </Modal>
  );
}
