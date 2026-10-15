// Shared, server-side enumerations. Kept as plain arrays/objects so they can be
// used both for Mongoose `enum` validation and express-validator `isIn` checks.

// ---------------- People ----------------

export const GENDERS = ['male', 'female', 'other'];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];

export const EMPLOYMENT_TYPE_LABELS = Object.freeze({
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
});

export const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'Human Resources',
  'Customer Success',
  'Design',
];

export const BULK_ACTIONS = ['activate', 'deactivate', 'delete'];

export const NOTE_VISIBILITIES = ['TEAM', 'HR', 'PRIVATE'];

// ---------------- Attendance ----------------

export const ATTENDANCE_STATUSES = [
  'PRESENT',
  'ABSENT',
  'HALF_DAY',
  'WFH',
  'LATE',
  'LEAVE',
  'HOLIDAY',
  'NOT_CLOCKED_IN',
];

export const ATTENDANCE_MODES = ['OFFICE', 'WFH'];

export const ATTENDANCE_CORRECTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

// ---------------- Leave ----------------

export const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'PAID', 'UNPAID', 'WFH'];

export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const LEAVE_STATUS_LABELS = Object.freeze({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
});

export const LEAVE_APPLICABLE_SCOPES = ['ALL', 'ROLES', 'DEPARTMENTS', 'EMPLOYEES'];

export const LEAVE_TYPE_LABELS = Object.freeze({
  CASUAL: 'Casual Leave',
  SICK: 'Sick Leave',
  EARNED: 'Earned Leave',
  PAID: 'Paid Leave',
  UNPAID: 'Unpaid Leave',
  WFH: 'Work From Home',
});

// Yearly entitlement per leave type used by the employee profile summary.
export const LEAVE_ENTITLEMENTS = Object.freeze({
  CASUAL: 12,
  SICK: 8,
  EARNED: 15,
  PAID: 6,
  UNPAID: 0,
  WFH: 0,
});

// ---------------- Holidays ----------------

export const HOLIDAY_TYPES = ['NATIONAL', 'COMPANY'];

export const HOLIDAY_TYPE_LABELS = Object.freeze({
  NATIONAL: 'National holiday',
  COMPANY: 'Company holiday',
});

export const HOLIDAY_SCOPES = ['ALL', 'LOCATIONS', 'DEPARTMENTS'];

export const HOLIDAY_SCOPE_LABELS = Object.freeze({
  ALL: 'All employees',
  LOCATIONS: 'Specific locations',
  DEPARTMENTS: 'Specific departments',
});

// ---------------- Events ----------------

export const EVENT_TYPES = [
  'TEAM_OUTING',
  'MEETING',
  'TRAINING',
  'WORKSHOP',
  'CELEBRATION',
  'BIRTHDAY',
  'ANNIVERSARY',
  'COMPANY_EVENT',
];

export const EVENT_TYPE_LABELS = Object.freeze({
  TEAM_OUTING: 'Team outing',
  MEETING: 'Meeting',
  TRAINING: 'Training',
  WORKSHOP: 'Workshop',
  CELEBRATION: 'Celebration',
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  COMPANY_EVENT: 'Company event',
});

// ---------------- Organization ----------------

export const LOCATION_TYPES = ['HEAD_OFFICE', 'BRANCH', 'REMOTE'];

// ---------------- Performance ----------------

export const GOAL_CATEGORIES = ['BUSINESS', 'TECHNICAL', 'LEADERSHIP', 'PERSONAL'];

export const GOAL_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'COMPLETED', 'CANCELLED'];

export const PERFORMANCE_STATUSES = ['DRAFT', 'IN_REVIEW', 'COMPLETED'];

// ---------------- Assets ----------------

export const ASSET_TYPES = [
  'LAPTOP',
  'MONITOR',
  'PHONE',
  'KEYBOARD',
  'MOUSE',
  'HEADSET',
  'ACCESSORY',
];

export const ASSET_STATUSES = ['ASSIGNED', 'RETURNED', 'REPAIR', 'LOST'];

export const ASSET_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'DAMAGED'];

// ---------------- Documents ----------------

export const DOCUMENT_CATEGORIES = [
  'IDENTITY',
  'CONTRACT',
  'CERTIFICATE',
  'PAYSLIP',
  'POLICY',
  'OTHER',
];

export const DOCUMENT_TYPES = [
  'AADHAAR',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENSE',
  'RESUME',
  'EDUCATION_CERTIFICATE',
  'EXPERIENCE_LETTER',
  'OFFER_LETTER',
  'JOINING_LETTER',
  'OTHER',
];

export const DOCUMENT_STATUSES = ['ACTIVE', 'EXPIRED', 'ARCHIVED'];

export const DOCUMENT_VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];

// ---------------- Payroll ----------------

export const PAYROLL_STATUSES = ['DRAFT', 'PROCESSED', 'IN_REVIEW', 'APPROVED', 'PAID'];

export const PAYROLL_STATUS_LABELS = Object.freeze({
  DRAFT: 'Draft',
  PROCESSED: 'Processed',
  IN_REVIEW: 'In review',
  APPROVED: 'Approved',
  PAID: 'Paid',
});

export const ATTENDANCE_STATUS_LABELS = Object.freeze({
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half day',
  WFH: 'Work from home',
  LATE: 'Late',
  LEAVE: 'On leave',
  HOLIDAY: 'Holiday',
  NOT_CLOCKED_IN: 'Not clocked in',
});

export const PAYROLL_EARNING_FIELDS = [
  'basic',
  'hra',
  'conveyance',
  'specialAllowance',
  'bonus',
  'incentives',
  'overtime',
];

export const PAYROLL_EARNING_LABELS = Object.freeze({
  basic: 'Basic Salary',
  hra: 'HRA',
  conveyance: 'Conveyance',
  specialAllowance: 'Special Allowance',
  bonus: 'Bonus',
  incentives: 'Incentives',
  overtime: 'Overtime',
});

export const PAYROLL_DEDUCTION_FIELDS = [
  'pf',
  'esi',
  'professionalTax',
  'tds',
  'loanDeduction',
  'otherDeduction',
];

export const PAYROLL_DEDUCTION_LABELS = Object.freeze({
  pf: 'PF',
  esi: 'ESI',
  professionalTax: 'Professional Tax',
  tds: 'TDS',
  loanDeduction: 'Loan Deduction',
  otherDeduction: 'Other Deduction',
});

// Fixed monthly earnings that make up the gross salary.
export const PAYROLL_GROSS_FIELDS = ['basic', 'hra', 'conveyance', 'specialAllowance'];

// ---------------- Recruiting ----------------

export const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'REMOTE'];

export const JOB_TYPE_LABELS = Object.freeze({
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
  REMOTE: 'Remote',
});

export const JOB_STATUSES = ['OPEN', 'INTERVIEWING', 'ON_HOLD', 'FILLED', 'CLOSED'];

export const JOB_STATUS_LABELS = Object.freeze({
  OPEN: 'Open',
  INTERVIEWING: 'Interviewing',
  ON_HOLD: 'On hold',
  FILLED: 'Filled',
  CLOSED: 'Closed',
});

export const CANDIDATE_SOURCES = ['LINKEDIN', 'REFERRAL', 'COMPANY_SITE', 'JOB_PORTAL', 'AGENCY', 'OTHER'];

export const CANDIDATE_SOURCE_LABELS = Object.freeze({
  LINKEDIN: 'LinkedIn',
  REFERRAL: 'Referral',
  COMPANY_SITE: 'Company site',
  JOB_PORTAL: 'Job portal',
  AGENCY: 'Agency',
  OTHER: 'Other',
});

export const CANDIDATE_STAGES = ['APPLIED', 'SCREENED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'];

export const CANDIDATE_STAGE_LABELS = Object.freeze({
  APPLIED: 'Applied',
  SCREENED: 'Screened',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
});
