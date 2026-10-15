import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './routes/PrivateRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import RoleRoute from './routes/RoleRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/account/ProfilePage';
import SecurityPage from './pages/account/SecurityPage';
import ChangePasswordPage from './pages/account/ChangePasswordPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeProfilePage from './pages/employees/EmployeeProfilePage';
import OrganizationPage from './pages/organization/OrganizationPage';
import AttendanceHubPage from './pages/attendance/AttendanceHubPage';
import LeavePage from './pages/leaves/LeavePage';
import HolidayPage from './pages/holidays/HolidayPage';
import EventPage from './pages/events/EventPage';
import PayrollPage from './pages/payroll/PayrollPage';
import MyPayslipsPage from './pages/payroll/MyPayslipsPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import SearchResultsPage from './pages/search/SearchResultsPage';
import JobsPage from './pages/jobs/JobsPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CandidatesPage from './pages/candidates/CandidatesPage';
import CandidateProfilePage from './pages/candidates/CandidateProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account/profile" element={<ProfilePage />} />
          <Route path="/account/security" element={<SecurityPage />} />
          <Route path="/account/change-password" element={<ChangePasswordPage />} />
          <Route path="/attendance" element={<Navigate to="/attendance-hub" replace />} />
          <Route path="/attendance-hub" element={<AttendanceHubPage />} />
          <Route path="/leaves" element={<LeavePage />} />
          <Route path="/holidays" element={<HolidayPage />} />
          <Route path="/events" element={<EventPage />} />
          <Route path="/my-payslips" element={<MyPayslipsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />

          <Route element={<RoleRoute roles={['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']} />}>
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeProfilePage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/organization" element={<OrganizationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/candidates/:id" element={<CandidateProfilePage />} />
            <Route path="/users" element={<Navigate to="/employees" replace />} />
          </Route>
        </Route>
      </Route>

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
