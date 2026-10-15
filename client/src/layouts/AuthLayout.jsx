import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="auth-page">
      <div className="auth-page__brand d-none d-lg-flex">
        <div className="auth-brand__inner">
          <div className="auth-brand__logo">
            <ShieldCheck size={30} />
          </div>
          <h1>Office EMS</h1>
          <p>
            One place for employees, attendance, leave, payroll and everything that keeps
            your office running.
          </p>
          <ul className="auth-brand__points">
            <li>Role-based access for Super Admin, HR, Managers and Employees</li>
            <li>Secure JWT sessions with automatic token refresh</li>
            <li>Bcrypt encrypted passwords and account lockout protection</li>
          </ul>
        </div>
      </div>

      <div className="auth-page__form">
        <div className="auth-card">
          <div className="auth-card__mobile-brand d-lg-none">
            <span className="auth-card__mobile-logo">
              <ShieldCheck size={22} />
            </span>
            <strong>Office EMS</strong>
          </div>
          <Outlet />
        </div>
        <p className="auth-card__footer">
          © {new Date().getFullYear()} Office EMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
