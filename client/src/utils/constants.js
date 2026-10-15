export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
});

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_LABELS = Object.freeze({
  SUPER_ADMIN: 'Super Admin',
  HR_ADMIN: 'HR Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
});

export const roleLabel = (role) => ROLE_LABELS[role] || role || '';

export const DEPARTMENTS = Object.freeze([
  'Engineering',
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'Human Resources',
  'Customer Success',
  'Design',
]);

export const EMPLOYMENT_TYPES = Object.freeze([
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERN', label: 'Intern' },
]);

export const EMPLOYMENT_TYPE_LABELS = Object.freeze(
  EMPLOYMENT_TYPES.reduce((acc, t) => ({ ...acc, [t.value]: t.label }), {})
);

export const employmentTypeLabel = (value) => EMPLOYMENT_TYPE_LABELS[value] || value || '—';

export const GENDERS = Object.freeze([
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]);

export const genderLabel = (value) =>
  GENDERS.find((g) => g.value === value)?.label || '—';

export const BLOOD_GROUPS = Object.freeze([
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
]);

export const WORK_LOCATIONS = Object.freeze([
  'Head Office',
  'Branch Office',
  'Remote',
  'Hybrid',
]);

export const EMPLOYEE_STATUSES = Object.freeze([
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]);

const buildLabelMap = (list) =>
  Object.freeze(list.reduce((acc, item) => ({ ...acc, [item.value]: item.label }), {}));

const toneOf = (list, value, fallback = 'secondary') =>
  list.find((item) => item.value === value)?.tone || fallback;

export const ATTENDANCE_STATUSES = Object.freeze([
  { value: 'PRESENT', label: 'Present', tone: 'success' },
  { value: 'ABSENT', label: 'Absent', tone: 'danger' },
  { value: 'HALF_DAY', label: 'Half day', tone: 'warning' },
  { value: 'WFH', label: 'Work from home', tone: 'info' },
  { value: 'LATE', label: 'Late', tone: 'warning' },
  { value: 'LEAVE', label: 'On leave', tone: 'secondary' },
  { value: 'HOLIDAY', label: 'Holiday', tone: 'primary' },
  { value: 'NOT_CLOCKED_IN', label: 'Not clock in', tone: 'danger' },
]);
const ATTENDANCE_LABELS = buildLabelMap(ATTENDANCE_STATUSES);
export const attendanceStatusLabel = (value) => ATTENDANCE_LABELS[value] || value || '—';
export const attendanceStatusTone = (value) => toneOf(ATTENDANCE_STATUSES, value);

export const ATTENDANCE_MODES = Object.freeze([
  { value: 'OFFICE', label: 'Office' },
  { value: 'WFH', label: 'Work from home' },
]);

export const ATTENDANCE_CORRECTION_STATUSES = Object.freeze([
  { value: 'PENDING', label: 'Pending', tone: 'warning' },
  { value: 'APPROVED', label: 'Approved', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
]);
const ATTENDANCE_CORRECTION_LABELS = buildLabelMap(ATTENDANCE_CORRECTION_STATUSES);
export const attendanceCorrectionStatusLabel = (value) =>
  ATTENDANCE_CORRECTION_LABELS[value] || value || '—';
export const attendanceCorrectionStatusTone = (value) =>
  toneOf(ATTENDANCE_CORRECTION_STATUSES, value);

export const LEAVE_TYPES = Object.freeze([
  { value: 'CASUAL', label: 'Casual Leave', tone: 'indigo' },
  { value: 'SICK', label: 'Sick Leave', tone: 'warning' },
  { value: 'EARNED', label: 'Earned Leave', tone: 'success' },
  { value: 'PAID', label: 'Paid Leave', tone: 'info' },
  { value: 'UNPAID', label: 'Unpaid Leave', tone: 'secondary' },
  { value: 'WFH', label: 'Work From Home', tone: 'purple' },
]);
const LEAVE_TYPE_LABELS = buildLabelMap(LEAVE_TYPES);
export const leaveTypeLabel = (value) => LEAVE_TYPE_LABELS[value] || value || '—';
export const leaveTypeTone = (value) => toneOf(LEAVE_TYPES, value, 'indigo');

export const LEAVE_APPLICABLE_SCOPES = Object.freeze([
  { value: 'ALL', label: 'All employees', tone: 'success' },
  { value: 'ROLES', label: 'Specific roles', tone: 'info' },
  { value: 'DEPARTMENTS', label: 'Specific departments', tone: 'warning' },
  { value: 'EMPLOYEES', label: 'Specific employees', tone: 'purple' },
]);
const LEAVE_SCOPE_LABELS = buildLabelMap(LEAVE_APPLICABLE_SCOPES);
export const leaveScopeLabel = (value) => LEAVE_SCOPE_LABELS[value] || value || '—';

export const LEAVE_STATUSES = Object.freeze([
  { value: 'PENDING', label: 'Pending', tone: 'warning' },
  { value: 'APPROVED', label: 'Approved', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'secondary' },
]);
const LEAVE_STATUS_LABELS = buildLabelMap(LEAVE_STATUSES);
export const leaveStatusLabel = (value) => LEAVE_STATUS_LABELS[value] || value || '—';
export const leaveStatusTone = (value) => toneOf(LEAVE_STATUSES, value);

export const PAYROLL_STATUSES = Object.freeze([
  { value: 'DRAFT', label: 'Draft', tone: 'secondary' },
  { value: 'PROCESSED', label: 'Processed', tone: 'info' },
  { value: 'IN_REVIEW', label: 'In review', tone: 'warning' },
  { value: 'APPROVED', label: 'Approved', tone: 'primary' },
  { value: 'PAID', label: 'Paid', tone: 'success' },
]);
const PAYROLL_LABELS = buildLabelMap(PAYROLL_STATUSES);
export const payrollStatusLabel = (value) => PAYROLL_LABELS[value] || value || '—';
export const payrollStatusTone = (value) => toneOf(PAYROLL_STATUSES, value);

export const PAYROLL_EARNINGS = Object.freeze([
  { key: 'basic', label: 'Basic Salary' },
  { key: 'hra', label: 'HRA' },
  { key: 'conveyance', label: 'Conveyance' },
  { key: 'specialAllowance', label: 'Special Allowance' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'incentives', label: 'Incentives' },
  { key: 'overtime', label: 'Overtime' },
]);

export const PAYROLL_DEDUCTIONS = Object.freeze([
  { key: 'pf', label: 'PF' },
  { key: 'esi', label: 'ESI' },
  { key: 'professionalTax', label: 'Professional Tax' },
  { key: 'tds', label: 'TDS' },
  { key: 'loanDeduction', label: 'Loan Deduction' },
  { key: 'otherDeduction', label: 'Other Deduction' },
]);

export const PAYROLL_WORKFLOW = Object.freeze(['DRAFT', 'PROCESSED', 'IN_REVIEW', 'APPROVED', 'PAID']);

export const NEXT_PAYROLL_ACTION = Object.freeze({
  DRAFT: { action: 'process', label: 'Process', tone: 'info' },
  PROCESSED: { action: 'review', label: 'Send to review', tone: 'warning' },
  IN_REVIEW: { action: 'approve', label: 'Approve', tone: 'primary' },
  APPROVED: { action: 'pay', label: 'Mark as paid', tone: 'success' },
});

export const payrollStepIndex = (status) => {
  const index = PAYROLL_WORKFLOW.indexOf(status);
  return index === -1 ? 0 : index;
};

export const PERFORMANCE_STATUSES = Object.freeze([
  { value: 'DRAFT', label: 'Draft', tone: 'secondary' },
  { value: 'IN_REVIEW', label: 'In review', tone: 'warning' },
  { value: 'COMPLETED', label: 'Completed', tone: 'success' },
]);
const PERFORMANCE_LABELS = buildLabelMap(PERFORMANCE_STATUSES);
export const performanceStatusLabel = (value) => PERFORMANCE_LABELS[value] || value || '—';
export const performanceStatusTone = (value) => toneOf(PERFORMANCE_STATUSES, value);

export const GOAL_CATEGORIES = Object.freeze(['BUSINESS', 'TECHNICAL', 'LEADERSHIP', 'PERSONAL']);

export const GOAL_STATUSES = Object.freeze([
  { value: 'NOT_STARTED', label: 'Not started', tone: 'secondary' },
  { value: 'IN_PROGRESS', label: 'In progress', tone: 'info' },
  { value: 'AT_RISK', label: 'At risk', tone: 'danger' },
  { value: 'COMPLETED', label: 'Completed', tone: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'secondary' },
]);
const GOAL_LABELS = buildLabelMap(GOAL_STATUSES);
export const goalStatusLabel = (value) => GOAL_LABELS[value] || value || '—';
export const goalStatusTone = (value) => toneOf(GOAL_STATUSES, value);

export const ASSET_TYPES = Object.freeze([
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'KEYBOARD', label: 'Keyboard' },
  { value: 'MOUSE', label: 'Mouse' },
  { value: 'HEADSET', label: 'Headset' },
  { value: 'ACCESSORY', label: 'Accessory' },
]);
const ASSET_TYPE_LABELS = buildLabelMap(ASSET_TYPES);
export const assetTypeLabel = (value) => ASSET_TYPE_LABELS[value] || value || '—';

export const ASSET_STATUSES = Object.freeze([
  { value: 'ASSIGNED', label: 'Assigned', tone: 'success' },
  { value: 'RETURNED', label: 'Returned', tone: 'secondary' },
  { value: 'REPAIR', label: 'In repair', tone: 'warning' },
  { value: 'LOST', label: 'Lost', tone: 'danger' },
]);
const ASSET_STATUS_LABELS = buildLabelMap(ASSET_STATUSES);
export const assetStatusLabel = (value) => ASSET_STATUS_LABELS[value] || value || '—';
export const assetStatusTone = (value) => toneOf(ASSET_STATUSES, value);

export const DOCUMENT_CATEGORIES = Object.freeze([
  { value: 'IDENTITY', label: 'Identity', tone: 'info' },
  { value: 'CONTRACT', label: 'Contract', tone: 'primary' },
  { value: 'CERTIFICATE', label: 'Certificate', tone: 'success' },
  { value: 'PAYSLIP', label: 'Payslip', tone: 'warning' },
  { value: 'POLICY', label: 'Policy', tone: 'secondary' },
  { value: 'OTHER', label: 'Other', tone: 'secondary' },
]);
const DOCUMENT_LABELS = buildLabelMap(DOCUMENT_CATEGORIES);
export const documentCategoryLabel = (value) => DOCUMENT_LABELS[value] || value || '—';
export const documentCategoryTone = (value) => toneOf(DOCUMENT_CATEGORIES, value);

export const DOCUMENT_TYPES = Object.freeze([
  { value: 'AADHAAR', label: 'Aadhaar', tone: 'info' },
  { value: 'PAN', label: 'PAN', tone: 'indigo' },
  { value: 'PASSPORT', label: 'Passport', tone: 'purple' },
  { value: 'DRIVING_LICENSE', label: 'Driving License', tone: 'info' },
  { value: 'RESUME', label: 'Resume', tone: 'secondary' },
  { value: 'EDUCATION_CERTIFICATE', label: 'Education Certificate', tone: 'success' },
  { value: 'EXPERIENCE_LETTER', label: 'Experience Letter', tone: 'primary' },
  { value: 'OFFER_LETTER', label: 'Offer Letter', tone: 'primary' },
  { value: 'JOINING_LETTER', label: 'Joining Letter', tone: 'success' },
  { value: 'OTHER', label: 'Other Documents', tone: 'secondary' },
]);
const DOCUMENT_TYPE_LABELS = buildLabelMap(DOCUMENT_TYPES);
export const documentTypeLabel = (value) => DOCUMENT_TYPE_LABELS[value] || value || '—';
export const documentTypeTone = (value) => toneOf(DOCUMENT_TYPES, value);

export const DOCUMENT_VERIFICATION_STATUSES = Object.freeze([
  { value: 'PENDING', label: 'Pending', tone: 'warning' },
  { value: 'VERIFIED', label: 'Verified', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
]);
const DOCUMENT_VERIFICATION_LABELS = buildLabelMap(DOCUMENT_VERIFICATION_STATUSES);
export const documentVerificationLabel = (value) =>
  DOCUMENT_VERIFICATION_LABELS[value] || value || '—';
export const documentVerificationTone = (value) =>
  toneOf(DOCUMENT_VERIFICATION_STATUSES, value);

export const DOCUMENT_STATUSES = Object.freeze([
  { value: 'ACTIVE', label: 'Active', tone: 'success' },
  { value: 'EXPIRED', label: 'Expired', tone: 'danger' },
  { value: 'ARCHIVED', label: 'Archived', tone: 'secondary' },
]);
const DOCUMENT_STATUS_LABELS = buildLabelMap(DOCUMENT_STATUSES);
export const documentStatusLabel = (value) => DOCUMENT_STATUS_LABELS[value] || value || '—';
export const documentStatusTone = (value) => toneOf(DOCUMENT_STATUSES, value);

const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value, currency = 'INR') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  if (currency !== 'INR') return `${currency} ${Number(value).toLocaleString('en-IN')}`;
  return currencyFmt.format(Number(value));
};

const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });

export const formatMonth = (value) => {
  if (!value) return '—';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return monthFmt.format(new Date(year, month - 1, 1));
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const routePaths = Object.freeze({
  login: '/login',
  dashboard: '/dashboard',
  forgot: '/forgot-password',
  profile: '/account/profile',
  security: '/account/security',
  changePassword: '/account/change-password',
  users: '/users',
  forbidden: '/403',
});

export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:/i.test(path)) return path;
  const base = import.meta.env.VITE_API_URL || '/api';
  const origin = base.replace(/\/api\/?$/, '');
  return `${origin}${path}`;
};

export const LOCATION_TYPES = Object.freeze([
  { value: 'HEAD_OFFICE', label: 'Head office', tone: 'success' },
  { value: 'BRANCH', label: 'Branch office', tone: 'info' },
  { value: 'REMOTE', label: 'Remote', tone: 'secondary' },
]);

export const locationTypeLabel = (value) =>
  LOCATION_TYPES.find((t) => t.value === value)?.label || value || '—';

export const locationTypeTone = (value) =>
  LOCATION_TYPES.find((t) => t.value === value)?.tone || 'secondary';

export const HOLIDAY_TYPES = Object.freeze([
  { value: 'NATIONAL', label: 'National holiday', tone: 'info' },
  { value: 'COMPANY', label: 'Company holiday', tone: 'purple' },
]);
const HOLIDAY_TYPE_LABELS = buildLabelMap(HOLIDAY_TYPES);
export const holidayTypeLabel = (value) => HOLIDAY_TYPE_LABELS[value] || value || '—';
export const holidayTypeTone = (value) => toneOf(HOLIDAY_TYPES, value, 'info');

export const HOLIDAY_SCOPES = Object.freeze([
  { value: 'ALL', label: 'All employees', tone: 'success' },
  { value: 'LOCATIONS', label: 'Specific locations', tone: 'warning' },
  { value: 'DEPARTMENTS', label: 'Specific departments', tone: 'purple' },
]);
const HOLIDAY_SCOPE_LABELS = buildLabelMap(HOLIDAY_SCOPES);
export const holidayScopeLabel = (value) => HOLIDAY_SCOPE_LABELS[value] || value || '—';

export const EVENT_TYPES = Object.freeze([
  { value: 'TEAM_OUTING', label: 'Team outing', tone: 'success' },
  { value: 'MEETING', label: 'Meeting', tone: 'indigo' },
  { value: 'TRAINING', label: 'Training', tone: 'info' },
  { value: 'WORKSHOP', label: 'Workshop', tone: 'blue' },
  { value: 'CELEBRATION', label: 'Celebration', tone: 'purple' },
  { value: 'BIRTHDAY', label: 'Birthday', tone: 'warning' },
  { value: 'ANNIVERSARY', label: 'Anniversary', tone: 'rose' },
  { value: 'COMPANY_EVENT', label: 'Company event', tone: 'primary' },
]);
const EVENT_TYPE_LABELS = buildLabelMap(EVENT_TYPES);
export const eventTypeLabel = (value) => EVENT_TYPE_LABELS[value] || value || '—';
export const eventTypeTone = (value) => toneOf(EVENT_TYPES, value, 'indigo');

const EVENT_COLORS = Object.freeze({
  TEAM_OUTING: '#16a34a',
  MEETING: '#4f46e5',
  TRAINING: '#0891b2',
  WORKSHOP: '#2563eb',
  CELEBRATION: '#7c3aed',
  BIRTHDAY: '#f59e0b',
  ANNIVERSARY: '#e11d48',
  COMPANY_EVENT: '#0d9488',
});
export const eventTypeColor = (value) => EVENT_COLORS[value] || '#4f46e5';

export const MONTHS_SHORT = Object.freeze([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]);

export const DAY_NAMES = Object.freeze([
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]);

const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date);
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFmt.format(date);
};

export const formatRelativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return 'just now';
  if (Math.abs(mins) < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return `${days}d ago`;
  return dateFmt.format(date);
};

export const initials = (user) => {
  if (!user) return '?';
  return `${(user.firstName || ' ').charAt(0)}${(user.lastName || ' ').charAt(0)}`.toUpperCase();
};

export const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const monthLongFmt = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

export const formatMonthLong = (value) => {
  if (!value) return '—';
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return value;
  return monthLongFmt.format(new Date(year, month - 1, 1));
};

export const toISODate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const fromISODate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const todayISODate = () => toISODate(new Date());

export const currentMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const addMonths = (monthKey, delta) => {
  const [year, month] = String(monthKey).split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return currentMonthKey(date);
};

export const JOB_TYPES = Object.freeze([
  { value: 'FULL_TIME', label: 'Full-time', tone: 'success' },
  { value: 'PART_TIME', label: 'Part-time', tone: 'info' },
  { value: 'CONTRACT', label: 'Contract', tone: 'warning' },
  { value: 'INTERN', label: 'Intern', tone: 'purple' },
  { value: 'REMOTE', label: 'Remote', tone: 'blue' },
]);
const JOB_TYPE_LABELS = buildLabelMap(JOB_TYPES);
export const jobTypeLabel = (value) => JOB_TYPE_LABELS[value] || value || '—';
export const jobTypeTone = (value) => toneOf(JOB_TYPES, value, 'secondary');

export const JOB_STATUSES = Object.freeze([
  { value: 'OPEN', label: 'Open', tone: 'success' },
  { value: 'INTERVIEWING', label: 'Interviewing', tone: 'info' },
  { value: 'ON_HOLD', label: 'On hold', tone: 'warning' },
  { value: 'FILLED', label: 'Filled', tone: 'primary' },
  { value: 'CLOSED', label: 'Closed', tone: 'secondary' },
]);
const JOB_STATUS_LABELS = buildLabelMap(JOB_STATUSES);
export const jobStatusLabel = (value) => JOB_STATUS_LABELS[value] || value || '—';
export const jobStatusTone = (value) => toneOf(JOB_STATUSES, value, 'secondary');

export const CANDIDATE_SOURCES = Object.freeze([
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'COMPANY_SITE', label: 'Company site' },
  { value: 'JOB_PORTAL', label: 'Job portal' },
  { value: 'AGENCY', label: 'Agency' },
  { value: 'OTHER', label: 'Other' },
]);
const CANDIDATE_SOURCE_LABELS = buildLabelMap(CANDIDATE_SOURCES);
export const candidateSourceLabel = (value) => CANDIDATE_SOURCE_LABELS[value] || value || '—';

export const CANDIDATE_STAGES = Object.freeze([
  { value: 'APPLIED', label: 'Applied', tone: 'secondary' },
  { value: 'SCREENED', label: 'Screened', tone: 'info' },
  { value: 'INTERVIEW', label: 'Interview', tone: 'blue' },
  { value: 'OFFER', label: 'Offer', tone: 'warning' },
  { value: 'HIRED', label: 'Hired', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
  { value: 'WITHDRAWN', label: 'Withdrawn', tone: 'secondary' },
]);
const CANDIDATE_STAGE_LABELS = buildLabelMap(CANDIDATE_STAGES);
export const candidateStageLabel = (value) => CANDIDATE_STAGE_LABELS[value] || value || '—';
export const candidateStageTone = (value) => toneOf(CANDIDATE_STAGES, value, 'secondary');
