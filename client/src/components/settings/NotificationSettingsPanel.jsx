import { useEffect, useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { SectionLoading } from '../employees/profile/ui';

const TOGGLES = [
  { name: 'emailEnabled', label: 'Send email notifications', hint: 'Master switch for all outgoing email' },
  { name: 'leaveApprovalEmail', label: 'Leave approval / rejection', hint: 'Email employees when managers decide on their leave' },
  { name: 'leaveCancellationEmail', label: 'Leave cancellation', hint: 'Notify approvers when an employee cancels leave' },
  { name: 'payslipReadyEmail', label: 'Payslip ready', hint: 'Email employees when their monthly payslip is approved' },
  { name: 'timesheetReminderEmail', label: 'Timesheet reminders', hint: 'Remind employees to log attendance on time' },
  { name: 'birthdayReminderEmail', label: 'Birthdays & anniversaries', hint: 'Company-wide reminders for celebrations' },
  { name: 'goalReminderEmail', label: 'Goal & review reminders', hint: 'Nudge employees about upcoming check-ins' },
  { name: 'announcementEmail', label: 'Announcements', hint: 'Broadcast company announcements by email' },
];

export default function NotificationSettingsPanel({ notifications, busy, onSave }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (notifications) {
      const next = {};
      TOGGLES.forEach(({ name }) => {
        next[name] = Boolean(notifications[name]);
      });
      setForm(next);
    }
  }, [notifications]);

  if (!form) return <SectionLoading label="Loading notification settings..." />;

  const change = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form className="stack-md" onSubmit={handleSubmit} noValidate>
      <div className="panel">
        <div className="panel__header">
          <h3>
            <Bell size={17} className="me-2" /> Notification preferences
          </h3>
          <span className="panel__hint">Which email notifications the company sends</span>
        </div>

        <div className="row g-3">
          {TOGGLES.map(({ name, label, hint }) => (
            <div className="col-md-6" key={name}>
              <label className="form-check form-switch notif-row">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form[name]}
                  onChange={(e) => change(name, e.target.checked)}
                />
                <span className="form-check-label">
                  {label}
                  <small className="text-muted d-block">{hint}</small>
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={busy === 'notifications'}>
            {busy === 'notifications' ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            ) : (
              <Save size={15} className="me-1" />
            )}
            Save notification settings
          </button>
        </div>
      </div>
    </form>
  );
}