import { useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  PartyPopper,
  Settings as SettingsIcon,
  ShieldCheck,
  Tags,
  Wallet,
} from 'lucide-react';
import useSettings from '../../hooks/useSettings';
import PageLoader from '../../components/PageLoader';
import CompanySettingsPanel from '../../components/settings/CompanySettingsPanel';
import PayrollSettingsPanel from '../../components/settings/PayrollSettingsPanel';
import LeaveSettingsPanel from '../../components/settings/LeaveSettingsPanel';
import HolidaySettingsPanel from '../../components/settings/HolidaySettingsPanel';
import NotificationSettingsPanel from '../../components/settings/NotificationSettingsPanel';
import EmailSettingsPanel from '../../components/settings/EmailSettingsPanel';
import RolesSettingsPanel from '../../components/settings/RolesSettingsPanel';
import OrganizationTab from '../../components/settings/OrganizationTab';
import AttendanceSettingsPanel from '../../components/attendance/SettingsPanel';

const TABS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'departments', label: 'Departments', icon: Tags },
  { id: 'designations', label: 'Designations', icon: BadgeCheck },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'leave', label: 'Leave', icon: CalendarDays },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'payroll', label: 'Payroll', icon: Wallet },
  { id: 'holidays', label: 'Holidays', icon: PartyPopper },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'roles', label: 'Roles', icon: ShieldCheck },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('company');
  const {
    settings,
    loading,
    error,
    busy,
    canManage,
    saveCompany,
    savePayroll,
    saveLeave,
    saveHoliday,
    saveNotifications,
    saveEmail,
    testEmail,
  } = useSettings();

  if (loading) return <PageLoader label="Loading company settings..." />;

  return (
    <div className="stack-lg">
      {!canManage && (
        <div className="alert alert-info py-2 mb-0">Settings are shown in read-only mode.</div>
      )}
      <div className="panel">
        <div className="panel__header">
          <h3>
            <SettingsIcon size={17} className="me-2" /> Company Settings
          </h3>
          <span className="panel__hint d-none d-sm-inline">
            {settings?.company?.name || 'Organization'}
          </span>
        </div>

        <div className="profile-tabs settings-tabs">
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
          {tab === 'company' && (
            <CompanySettingsPanel company={settings?.company} busy={busy} onSave={saveCompany} />
          )}
          {tab === 'departments' && <OrganizationTab name="departments" canManage={canManage} />}
          {tab === 'designations' && <OrganizationTab name="designations" canManage={canManage} />}
          {tab === 'locations' && <OrganizationTab name="locations" canManage={canManage} />}
          {tab === 'leave' && (
            <LeaveSettingsPanel
              leave={settings?.leave}
              busy={busy}
              onSave={saveLeave}
              canManage={canManage}
            />
          )}
          {tab === 'attendance' && <AttendanceSettingsPanel />}
          {tab === 'payroll' && (
            <PayrollSettingsPanel payroll={settings?.payroll} busy={busy} onSave={savePayroll} />
          )}
          {tab === 'holidays' && (
            <HolidaySettingsPanel holiday={settings?.holiday} busy={busy} onSave={saveHoliday} />
          )}
          {tab === 'notifications' && (
            <NotificationSettingsPanel
              notifications={settings?.notifications}
              busy={busy}
              onSave={saveNotifications}
            />
          )}
          {tab === 'email' && (
            <EmailSettingsPanel
              email={settings?.email}
              busy={busy}
              onSave={saveEmail}
              onTest={testEmail}
            />
          )}
          {tab === 'roles' && <RolesSettingsPanel />}
        </div>
      </div>
    </div>
  );
}