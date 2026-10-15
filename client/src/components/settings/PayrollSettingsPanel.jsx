import { useEffect, useState } from 'react';
import { Save, Wallet } from 'lucide-react';
import { SectionLoading } from '../employees/profile/ui';

const toPercent = (value) => (Number(value ?? 0) * 100).toFixed(2);

export default function PayrollSettingsPanel({ payroll, busy, onSave }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (payroll) {
      setForm({
        basic: payroll.basic ?? 40000,
        hraRatio: toPercent(payroll.hraRatio),
        conveyance: payroll.conveyance ?? 1600,
        specialAllowance: payroll.specialAllowance ?? 6000,
        pfRatio: toPercent(payroll.pfRatio),
        esiRatio: toPercent(payroll.esiRatio),
        professionalTax: payroll.professionalTax ?? 200,
        tdsRatio: toPercent(payroll.tdsRatio),
      });
    }
  }, [payroll]);

  if (!form) return <SectionLoading label="Loading payroll settings..." />;

  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      basic: Number(form.basic) || 0,
      hraRatio: Number(form.hraRatio) / 100,
      conveyance: Number(form.conveyance) || 0,
      specialAllowance: Number(form.specialAllowance) || 0,
      pfRatio: Number(form.pfRatio) / 100,
      esiRatio: Number(form.esiRatio) / 100,
      professionalTax: Number(form.professionalTax) || 0,
      tdsRatio: Number(form.tdsRatio) / 100,
    });
  };

  const money = (name, label, hint) => (
    <div className="col-md-6 col-lg-3" key={name}>
      <label className="form-label" htmlFor={`pay-${name}`}>
        {label}
      </label>
      <div className="input-group">
        <span className="input-group-text">₹</span>
        <input
          id={`pay-${name}`}
          type="number"
          min="0"
          step="100"
          className="form-control"
          value={form[name]}
          onChange={(e) => change(name, e.target.value)}
        />
      </div>
      {hint && <small className="text-muted d-block">{hint}</small>}
    </div>
  );

  const percent = (name, label, hint, step) => (
    <div className="col-md-6 col-lg-3" key={name}>
      <label className="form-label" htmlFor={`pay-${name}`}>
        {label}
      </label>
      <div className="input-group">
        <input
          id={`pay-${name}`}
          type="number"
          min="0"
          max="100"
          step={step || '0.25'}
          className="form-control"
          value={form[name]}
          onChange={(e) => change(name, e.target.value)}
        />
        <span className="input-group-text">%</span>
      </div>
      {hint && <small className="text-muted d-block">{hint}</small>}
    </div>
  );

  return (
    <form className="stack-md" onSubmit={handleSubmit} noValidate>
      <div className="panel">
        <div className="panel__header">
          <h3>
            <Wallet size={17} className="me-2" /> Default payroll structure
          </h3>
          <span className="panel__hint">Used when no custom salary structure exists</span>
        </div>

        <p className="form-section__title">Earnings</p>
        <div className="row g-3">
          {money('basic', 'Basic salary', 'Monthly basic pay')}
          {percent('hraRatio', 'HRA (% of basic)')}
          {money('conveyance', 'Conveyance')}
          {money('specialAllowance', 'Special allowance')}
        </div>

        <div className="form-section mt-4">
          <p className="form-section__title">Statutory deductions</p>
        </div>
        <div className="row g-3">
          {percent('pfRatio', 'Provident fund', 'Employee + employer share')}
          {percent('esiRatio', 'ESI contribution')}
          {money('professionalTax', 'Professional tax', 'Set 0 if not applicable')}
          {percent('tdsRatio', 'TDS')}
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={busy === 'payroll'}>
            {busy === 'payroll' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            ) : (
              <Save size={15} className="me-1" />
            )}
            Save payroll settings
          </button>
        </div>
      </div>
    </form>
  );
}