import { useRef, useState } from 'react';
import { Camera, Mail, Save } from 'lucide-react';
import authApi from '../../api/auth.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import { formatDate } from '../../utils/constants';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setFormError('');
  };

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      setFormError('Only PNG, JPG or WEBP images are allowed');
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      setFormError('Image must be smaller than 2 MB');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    const data = new FormData();
    data.append('firstName', form.firstName.trim());
    data.append('lastName', form.lastName.trim());
    data.append('email', form.email.trim());
    if (file) data.append('avatar', file);

    setSaving(true);
    try {
      const res = await authApi.updateProfile(data);
      updateUser(res.data.user);
      setFile(null);
      setPreview('');
      toast.success(res.data.message || 'Profile updated');
    } catch (err) {
      if (err.status === 422 && err.errors) {
        const mapped = {};
        err.errors.forEach((item) => {
          mapped[item.field] = item.message;
        });
        setErrors(mapped);
        setFormError('Please correct the highlighted fields.');
      } else {
        setFormError(err.message || 'Update failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const displayUser = preview
    ? { ...user, avatar: '' }
    : user;

  return (
    <div className="stack-lg">
      <div className="panel">
        <div className="panel__header">
          <h3>Profile details</h3>
          <span className="panel__hint">Member since {formatDate(user?.createdAt)}</span>
        </div>

        {formError && (
          <div className="alert alert-danger py-2" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="profile-photo">
                {preview ? (
                  <img src={preview} alt="Preview" className="avatar avatar--lg" />
                ) : (
                  <Avatar user={displayUser} size={96} className="avatar--lg" />
                )}
                <button
                  type="button"
                  className="profile-photo__btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={15} /> Change photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={handleFile}
                />
                <small className="text-muted">JPG, PNG or WEBP. Max 2 MB.</small>
              </div>
            </div>

            <div className="col-12 col-md-8">
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                    value={form.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && (
                    <div className="invalid-feedback">{errors.firstName}</div>
                  )}
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                    value={form.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && (
                    <div className="invalid-feedback">{errors.lastName}</div>
                  )}
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="profileEmail">
                    Email
                  </label>
                  <input
                    id="profileEmail"
                    name="email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Role</label>
                  <input
                    className="form-control"
                    value={user?.role?.replace('_', ' ') || ''}
                    disabled
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label">Designation</label>
                  <input
                    className="form-control"
                    value={user?.designation || 'Not assigned'}
                    disabled
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="me-1" /> Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>Linked account</h3>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="stat-card__icon stat-card__icon--indigo">
            <Mail size={18} />
          </span>
          <div>
            <strong className="d-block">{user?.email}</strong>
            <small className="text-muted">Login email for Office EMS</small>
          </div>
        </div>
      </div>
    </div>
  );
}
