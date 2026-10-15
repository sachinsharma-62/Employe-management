import {
  Briefcase,
  Building2,
  CalendarDays,
  CalendarOff,
  FileText,
  UserPlus,
  UserRound,
  Wallet,
} from 'lucide-react';

// Shared presentation metadata for each search result type. Keeps the Topbar
// suggestions dropdown and the full search results page in sync.
export const SEARCH_TYPE_ORDER = Object.freeze([
  'employee',
  'department',
  'document',
  'attendance',
  'leave',
  'payroll',
  'job',
  'candidate',
]);

export const SEARCH_TYPE_META = Object.freeze({
  employee: { label: 'Employees', singular: 'Employee', group: 'People', icon: UserRound, tone: 'primary' },
  department: { label: 'Departments', singular: 'Department', group: 'People', icon: Building2, tone: 'indigo' },
  document: { label: 'Documents', singular: 'Document', group: 'Workspace', icon: FileText, tone: 'info' },
  attendance: { label: 'Attendance', singular: 'Attendance', group: 'Workspace', icon: CalendarDays, tone: 'success' },
  leave: { label: 'Leaves', singular: 'Leave', group: 'Workspace', icon: CalendarOff, tone: 'warning' },
  payroll: { label: 'Payroll', singular: 'Payroll', group: 'Workspace', icon: Wallet, tone: 'purple' },
  job: { label: 'Jobs', singular: 'Job', group: 'Recruiting', icon: Briefcase, tone: 'blue' },
  candidate: { label: 'Candidates', singular: 'Candidate', group: 'Recruiting', icon: UserPlus, tone: 'rose' },
});

export const searchTypeMeta = (type) =>
  SEARCH_TYPE_META[type] || { label: type, singular: type, group: 'Other', icon: FileText, tone: 'secondary' };