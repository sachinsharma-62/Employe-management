import { useEffect, useRef, useState } from 'react';
import { Building2, Save, Upload, X } from 'lucide-react';
import { assetUrl } from '../../utils/constants';
import { SectionLoading } from '../employees/profile/ui';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_LOGO_MB = 2;

export default function CompanySettingsPanel({ company, busy, onSave }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeLogo, setRemoveLogo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        tagline: company.tagline || '',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        addressLine1: company.addressLine1 || '',
        addressLine2: company.addressLine2 || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        pincode: company.pincode || '',
        gstin: company.gstin || '',
        cin: company.cin || '',
        fiscalYearStart: company.fiscalYearStart ?? 0,
      });
      setRemoveLogo(false);
      setFile(null);
    }
  }, [company]);

  if (!form) return <SectionLoading label="Loading company information..." />;

  const change = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  };

  const handleFile = (selected) => {
    setError('');
    if (!selected) return;
    if (!ALLOWED_MIME.includes(selected.type)) {
      setError('Only PNG, JPG or WEBP images are allowed');
      return;
    }
    if (selected.size > MAX_LOGO_MB * 1024 * 1024) {
      setError(`Logo must be smaller than ${MAX_LOGO_MB} MB`);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setRemoveLogo(false);
  };

  const clearLogo = () => {
    setFile(null);
    setPreview('');
    setRemoveLogo(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Company name is required');
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([name, value]) => data.append(name, String(value ?? '')));
    if (file) data.append('logo', file);
    else if (removeLogo) data.append('logo', '');
    onSave(data);
  };

  const logoSrc = preview || assetUrl(company.logo);

  return (
    <form className="stack-md" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {error}
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>
            <Building2 size={17} className="me-2" /> Company information
          </h3>
          <span className="panel__hint">Shown on payslips and the organization chart</span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="logo-field">
              <div className="logo-field__preview">
                {logoSrc ? (
                  <img src={logoSrc} alt="Company logo" />
                ) : (
                  <Building2 size={26} />
                )}
              </div>
              <div className="logo-field__actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={14} className="me-1" /> Upload logo
                </button>
                {logoSrc && (
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={clearLogo}>
                    <X size={14} className="me-1" /> Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                className="d-none"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <small className="text-muted d-block">PNG, JPG or WEBP · max {MAX_LOGO_MB} MB</small>
            </div>
          </div>
          <div className="col-12 col-md-8">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="c-name">
                  Company name <span className="text-danger">*</span>
                </label>
                <input
                  id="c-name"
                  className="form-control"
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => change('name', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="c-tagline">
                  Tagline
                </label>
                <input
                  id="c-tagline"
                  className="form-control"
                  maxLength={200}
                  value={form.tagline}
                  onChange={(e) => change('tagline', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="c-email">
                  Support email
                </label>
                <input
                  id="c-email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => change('email', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="c-phone">
                  Phone
                </label>
                <input
                  id="c-phone"
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => change('phone', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="c-website">
                  Website
                </label>
                <input
                  id="c-website"
                  className="form-control"
                  value={form.website}
                  onChange={(e) => change('website', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="c-fiscal">
                  Fiscal year starts
                </label>
                <select
                  id="c-fiscal"
                  className="form-select"
                  value={form.fiscalYearStart}
                  onChange={(e) => change('fiscalYearStart', Number(e.target.value))}
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Registered address</h3>
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="c-addr1">
              Address line 1
            </label>
            <input
              id="c-addr1"
              className="form-control"
              value={form.addressLine1}
              onChange={(e) => change('addressLine1', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="c-addr2">
              Address line 2
            </label>
            <input
              id="c-addr2"
              className="form-control"
              value={form.addressLine2}
              onChange={(e) => change('addressLine2', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="c-city">
              City
            </label>
            <input
              id="c-city"
              className="form-control"
              value={form.city}
              onChange={(e) => change('city', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="c-state">
              State
            </label>
            <input
              id="c-state"
              className="form-control"
              value={form.state}
              onChange={(e) => change('state', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="c-country">
              Country
            </label>
            <input
              id="c-country"
              className="form-control"
              value={form.country}
              onChange={(e) => change('country', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="c-pincode">
              Pincode
            </label>
            <input
              id="c-pincode"
              className="form-control"
              value={form.pincode}
              onChange={(e) => change('pincode', e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="c-gstin">
              GSTIN
            </label>
            <input
              id="c-gstin"
              className="form-control"
              maxLength={20}
              value={form.gstin}
              onChange={(e) => change('gstin', e.target.value.toUpperCase())}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="c-cin">
              CIN
            </label>
            <input
              id="c-cin"
              className="form-control"
              maxLength={30}
              value={form.cin}
              onChange={(e) => change('cin', e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={busy === 'company'}>
            {busy === 'company' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            ) : (
              <Save size={15} className="me-1" />
            )}
            Save company information
          </button>
        </div>
      </div>
    </form>
  );
}