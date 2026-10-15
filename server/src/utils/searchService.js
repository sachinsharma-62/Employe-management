import User from '../models/User.js';
import Department from '../models/Department.js';
import EmployeeDocument from '../models/EmployeeDocument.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import {
  ATTENDANCE_STATUS_LABELS,
  CANDIDATE_STAGE_LABELS,
  JOB_STATUS_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  PAYROLL_STATUS_LABELS,
} from './enums.js';

const PRIVILEGED = new Set(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']);

const DOCUMENT_CATEGORY_LABELS = Object.freeze({
  IDENTITY: 'Identity',
  CONTRACT: 'Contract',
  CERTIFICATE: 'Certificate',
  PAYSLIP: 'Payslip',
  POLICY: 'Policy',
  OTHER: 'Other',
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pad2 = (n) => String(n).padStart(2, '0');

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

const fmtDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const inr = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fullName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(' ');
const joinDesc = (...parts) => parts.filter(Boolean).join(' · ');

const matchUserIds = (rx) =>
  User.find({
    $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }],
  }).distinct('_id');

export const searchAll = async ({ q, user, perType = 5 }) => {
  const term = String(q || '').trim();
  if (!term) return { results: [], total: 0 };

  const rx = new RegExp(escapeRegex(term), 'i');
  const limit = Math.min(Math.max(Number(perType) || 5, 1), 20);
  const privileged = PRIVILEGED.has(user.role);
  const selfLike =
    rx.test(user.firstName || '') ||
    rx.test(user.lastName || '') ||
    (user.employeeId && rx.test(user.employeeId)) ||
    rx.test(user.email || '');

  const groups = [];

  groups.push(async () => {
    if (!privileged) return [];
    const users = await User.find({
      isActive: true,
      $or: [
        { firstName: rx },
        { lastName: rx },
        { email: rx },
        { employeeId: rx },
        { designation: rx },
        { department: rx },
      ],
    })
      .select('firstName lastName email employeeId designation department role')
      .limit(limit)
      .lean();

    return users.map((row) => ({
      type: 'employee',
      id: String(row._id),
      name: fullName(row) || row.email,
      description: joinDesc(row.designation || 'Employee', row.department, row.employeeId, row.email),
      url: `/employees/${row._id}`,
      meta: { role: row.role, employeeId: row.employeeId },
    }));
  });

  groups.push(async () => {
    if (!privileged) return [];
    const departments = await Department.find({
      isActive: true,
      $or: [{ name: rx }, { code: rx }, { description: rx }],
    })
      .populate('head', 'firstName lastName')
      .limit(limit)
      .lean();

    return Promise.all(
      departments.map(async (dept) => {
        const members = await User.countDocuments({ isActive: true, department: dept.name });
        return {
          type: 'department',
          id: String(dept._id),
          name: dept.name,
          description: joinDesc(
            dept.code,
            dept.head ? `Head: ${fullName(dept.head)}` : null,
            `${members} member${members === 1 ? '' : 's'}`
          ),
          url: '/organization?tab=departments',
        };
      })
    );
  });

  groups.push(async () => {
    const filter = { $or: [{ title: rx }, { fileName: rx }, { category: rx }] };
    if (!privileged) filter.employee = user._id;
    const docs = await EmployeeDocument.find(filter)
      .populate('employee', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc) => ({
      type: 'document',
      id: String(doc._id),
      name: doc.title,
      description: joinDesc(
        DOCUMENT_CATEGORY_LABELS[doc.category] || doc.category,
        doc.employee ? fullName(doc.employee) : null
      ),
      url: '/documents',
    }));
  });

  groups.push(async () => {
    let filter;
    if (privileged) {
      const ids = await matchUserIds(rx);
      filter = { $or: [{ employee: { $in: ids } }, { status: rx }] };
    } else {
      filter = selfLike ? { employee: user._id } : { employee: user._id, status: rx };
    }
    const rows = await Attendance.find(filter)
      .populate('employee', 'firstName lastName')
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return rows.map((row) => ({
      type: 'attendance',
      id: String(row._id),
      name: joinDesc(fullName(row.employee) || 'Attendance', fmtDate(row.date)),
      description: joinDesc(
        ATTENDANCE_STATUS_LABELS[row.status] || row.status,
        row.workMode === 'WFH' ? 'Work from home' : 'In office',
        row.checkIn ? `in ${row.checkIn}` : null,
        row.checkOut ? `out ${row.checkOut}` : null
      ),
      url: `/attendance-hub?month=${monthKey(row.date)}`,
    }));
  });

  groups.push(async () => {
    let filter;
    if (privileged) {
      const ids = await matchUserIds(rx);
      filter = { $or: [{ employee: { $in: ids } }, { reason: rx }, { type: rx }] };
    } else {
      filter = { employee: user._id, $or: [{ reason: rx }, { type: rx }] };
    }
    const rows = await LeaveRequest.find(filter)
      .populate('employee', 'firstName lastName')
      .sort({ appliedAt: -1 })
      .limit(limit)
      .lean();

    return rows.map((row) => ({
      type: 'leave',
      id: String(row._id),
      name: joinDesc(fullName(row.employee) || 'Leave', LEAVE_TYPE_LABELS[row.type] || row.type),
      description: joinDesc(
        `${fmtDate(row.fromDate)} → ${fmtDate(row.toDate)}`,
        `${row.days} day${row.days === 1 ? '' : 's'}`,
        LEAVE_STATUS_LABELS[row.status] || row.status
      ),
      url: '/leaves',
    }));
  });

  groups.push(async () => {
    let filter;
    if (privileged) {
      const ids = await matchUserIds(rx);
      filter = { $or: [{ employee: { $in: ids } }, { month: rx }] };
    } else {
      if (!selfLike) return [];
      filter = { employee: user._id };
    }
    const rows = await Payroll.find(filter)
      .populate('employee', 'firstName lastName')
      .sort({ month: -1 })
      .limit(limit)
      .lean();

    return rows.map((row) => ({
      type: 'payroll',
      id: String(row._id),
      name: joinDesc(fullName(row.employee) || 'Payroll', row.month),
      description: joinDesc(
        `Net ${inr(row.netSalary)}`,
        PAYROLL_STATUS_LABELS[row.status] || row.status,
        row.department
      ),
      url: privileged ? `/payroll?month=${row.month}` : '/my-payslips',
    }));
  });

  groups.push(async () => {
    const jobs = await Job.find({
      isActive: true,
      $or: [{ title: rx }, { department: rx }, { location: rx }, { skills: rx }],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return jobs.map((job) => ({
      type: 'job',
      id: String(job._id),
      name: job.title,
      description: joinDesc(
        job.department,
        job.location,
        JOB_STATUS_LABELS[job.status] || job.status,
        job.openings ? `${job.openings} opening${job.openings === 1 ? '' : 's'}` : null
      ),
      url: `/jobs/${job._id}`,
    }));
  });

  groups.push(async () => {
    if (!privileged) return [];
    const rows = await Candidate.find({
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }],
    })
      .populate('job', 'title')
      .sort({ appliedAt: -1 })
      .limit(limit)
      .lean();

    return rows.map((row) => ({
      type: 'candidate',
      id: String(row._id),
      name: fullName(row),
      description: joinDesc(
        row.job ? `Applied for ${row.job.title}` : 'No job linked',
        CANDIDATE_STAGE_LABELS[row.stage] || row.stage,
        row.email
      ),
      url: `/candidates/${row._id}`,
    }));
  });

  const settled = await Promise.all(groups.map((run) => run()));
  const results = settled.flat();

  return { results, total: results.length };
};