import mongoose from 'mongoose';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Payroll from '../models/Payroll.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Goal from '../models/Goal.js';
import Asset from '../models/Asset.js';
import EmployeeDocument from '../models/EmployeeDocument.js';
import EmployeeNote from '../models/EmployeeNote.js';
import ActivityLog from '../models/ActivityLog.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  ATTENDANCE_STATUSES,
  LEAVE_ENTITLEMENTS,
  LEAVE_TYPES,
} from '../utils/enums.js';
import { assetUrl } from '../utils/assetUrl.js';

const MANAGER_FIELDS = 'firstName lastName designation department avatar';
const ACTOR_FIELDS = 'firstName lastName avatar designation';
const REVIEWER_FIELDS = 'firstName lastName designation avatar';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const loadEmployee = async (id) => {
  const employee = await User.findById(id).populate('manager', MANAGER_FIELDS);
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
};

const logActivity = ({ employee, actor, action, description, type = 'profile', meta = {} }) =>
  ActivityLog.create({ employee, actor, action, description, type, meta });

const buildAttendanceSummary = async (employeeId) => {
  const rows = await Attendance.aggregate([
    { $match: { employee: toObjectId(employeeId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const counts = {};
  for (const status of ATTENDANCE_STATUSES) counts[status] = 0;
  rows.forEach((row) => {
    counts[row._id] = row.count;
  });

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const working = total - counts.HOLIDAY;
  const credited = counts.PRESENT + counts.WFH + counts.LATE + counts.HALF_DAY * 0.5;
  const percentage = working > 0 ? Math.round((credited / working) * 1000) / 10 : 0;

  return { counts, total, working, percentage };
};

const buildLeaveSummary = async (employeeId) => {
  const [rows, pending] = await Promise.all([
    LeaveRequest.aggregate([
      { $match: { employee: toObjectId(employeeId), status: 'APPROVED' } },
      { $group: { _id: '$type', used: { $sum: '$days' } } },
    ]),
    LeaveRequest.countDocuments({ employee: employeeId, status: 'PENDING' }),
  ]);

  const used = {};
  rows.forEach((row) => {
    used[row._id] = row.used;
  });

  const balances = LEAVE_TYPES.map((type) => {
    const entitlement = LEAVE_ENTITLEMENTS[type] ?? 0;
    const taken = used[type] || 0;
    return {
      type,
      entitlement,
      used: taken,
      balance: Math.max(entitlement - taken, 0),
    };
  });

  return { balances, pending };
};

const buildGoalSummary = async (employeeId) => {
  const rows = await Goal.aggregate([
    { $match: { employee: toObjectId(employeeId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        atRisk: { $sum: { $cond: [{ $eq: ['$status', 'AT_RISK'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        avgProgress: { $avg: '$progress' },
      },
    },
  ]);

  const data = rows[0] || { total: 0, completed: 0, atRisk: 0, inProgress: 0, avgProgress: 0 };
  return { ...data, avgProgress: Math.round((data.avgProgress || 0) * 10) / 10 };
};

const buildPerformanceSummary = async (employeeId) => {
  const rows = await PerformanceReview.aggregate([
    { $match: { employee: toObjectId(employeeId), rating: { $ne: null } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, reviews: { $sum: 1 } } },
  ]);
  const data = rows[0] || { avg: 0, reviews: 0 };
  return { avgRating: Math.round((data.avg || 0) * 10) / 10, reviews: data.reviews };
};

// GET /api/employees/:id/profile
export const getProfile = asyncHandler(async (req, res) => {
  const employee = await loadEmployee(req.params.id);

  const [
    attendance,
    leave,
    goals,
    performance,
    payrollLatest,
    assetsAssigned,
    documents,
    notes,
    recentActivity,
  ] = await Promise.all([
    buildAttendanceSummary(employee._id),
    buildLeaveSummary(employee._id),
    buildGoalSummary(employee._id),
    buildPerformanceSummary(employee._id),
    Payroll.findOne({ employee: employee._id }).sort({ month: -1 }),
    Asset.countDocuments({ employee: employee._id, status: 'ASSIGNED' }),
    EmployeeDocument.countDocuments({ employee: employee._id }),
    EmployeeNote.countDocuments({ employee: employee._id }),
    ActivityLog.find({ employee: employee._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('actor', ACTOR_FIELDS),
  ]);

  res.status(200).json({
    success: true,
    employee,
    summary: {
      attendance,
      leave,
      goals,
      performance,
      payroll: payrollLatest,
      assetsAssigned,
      documents,
      notes,
    },
    recentActivity,
  });
});

// GET /api/employees/:id/attendance
export const getAttendance = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const filter = { employee: req.params.id };

  const [total, records, summary] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    buildAttendanceSummary(req.params.id),
  ]);

  res.status(200).json({
    success: true,
    records,
    summary,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/employees/:id/leaves
export const getLeaves = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);

  const [records, summary] = await Promise.all([
    LeaveRequest.find({ employee: req.params.id })
      .sort({ fromDate: -1 })
      .populate('decidedBy', ACTOR_FIELDS),
    buildLeaveSummary(req.params.id),
  ]);

  res.status(200).json({ success: true, records, summary });
});

// GET /api/employees/:id/payroll
export const getPayroll = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);

  const records = await Payroll.find({ employee: req.params.id }).sort({ month: -1 });
  const paid = records.filter((r) => r.status === 'PAID');
  const totalNet = paid.reduce((sum, r) => sum + (r.netPay || 0), 0);
  const latest = records[0] || null;

  res.status(200).json({
    success: true,
    records,
    summary: {
      latest,
      totalPaidMonths: paid.length,
      totalNetPaid: totalNet,
      currency: latest?.currency || 'INR',
    },
  });
});

// GET /api/employees/:id/performance
export const getPerformance = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);

  const [records, summary] = await Promise.all([
    PerformanceReview.find({ employee: req.params.id })
      .sort({ reviewedAt: -1, createdAt: -1 })
      .populate('reviewer', REVIEWER_FIELDS),
    buildPerformanceSummary(req.params.id),
  ]);

  res.status(200).json({ success: true, records, summary });
});

// GET /api/employees/:id/goals
export const getGoals = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);

  const [records, summary] = await Promise.all([
    Goal.find({ employee: req.params.id }).sort({ dueDate: 1, createdAt: -1 }),
    buildGoalSummary(req.params.id),
  ]);

  res.status(200).json({ success: true, records, summary });
});

// GET /api/employees/:id/assets
export const getAssets = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);

  const records = await Asset.find({ employee: req.params.id }).sort({
    status: 1,
    assignedDate: -1,
  });

  res.status(200).json({
    success: true,
    records,
    summary: {
      total: records.length,
      assigned: records.filter((r) => r.status === 'ASSIGNED').length,
      returned: records.filter((r) => r.status === 'RETURNED').length,
      repair: records.filter((r) => r.status === 'REPAIR').length,
    },
  });
});

// GET /api/employees/:id/documents
export const getDocuments = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);

  const records = await EmployeeDocument.find({ employee: req.params.id })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', ACTOR_FIELDS);

  res.status(200).json({
    success: true,
    records: records.map((doc) => ({
      ...doc.toObject(),
      downloadUrl: assetUrl(doc.fileUrl),
    })),
  });
});

// POST /api/employees/:id/documents
export const addDocument = asyncHandler(async (req, res) => {
  const employee = await loadEmployee(req.params.id);
  if (!req.file) throw ApiError.badRequest('Please attach a file to upload');

  const document = await EmployeeDocument.create({
    employee: employee._id,
    title: req.body.title,
    documentType: req.body.documentType || 'OTHER',
    category: req.body.category || 'OTHER',
    fileName: req.file.originalname,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    expiryDate: req.body.expiryDate || null,
    uploadedBy: req.user._id,
  });

  await logActivity({
    employee: employee._id,
    actor: req.user._id,
    action: 'Document uploaded',
    description: `${req.user.fullName} uploaded "${document.title}"`,
    type: 'document',
    meta: { documentId: document._id, category: document.category },
  });

  const populated = await document.populate('uploadedBy', ACTOR_FIELDS);
  res.status(201).json({ success: true, message: 'Document uploaded', document: populated });
});

// DELETE /api/employees/:id/documents/:documentId
export const deleteDocument = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);
  const document = await EmployeeDocument.findOne({
    _id: req.params.documentId,
    employee: req.params.id,
  });
  if (!document) throw ApiError.notFound('Document not found');

  await document.deleteOne();
  await logActivity({
    employee: req.params.id,
    actor: req.user._id,
    action: 'Document removed',
    description: `${req.user.fullName} removed "${document.title}"`,
    type: 'document',
  });

  res.status(200).json({ success: true, message: 'Document deleted' });
});

// GET /api/employees/:id/notes
export const getNotes = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);
  const records = await EmployeeNote.find({ employee: req.params.id })
    .sort({ createdAt: -1 })
    .populate('author', ACTOR_FIELDS);
  res.status(200).json({ success: true, records });
});

// POST /api/employees/:id/notes
export const addNote = asyncHandler(async (req, res) => {
  const employee = await loadEmployee(req.params.id);

  const note = await EmployeeNote.create({
    employee: employee._id,
    author: req.user._id,
    body: req.body.body,
    visibility: req.body.visibility || 'TEAM',
  });

  await logActivity({
    employee: employee._id,
    actor: req.user._id,
    action: 'Note added',
    description: `${req.user.fullName} added a note`,
    type: 'note',
    meta: { noteId: note._id, visibility: note.visibility },
  });

  const populated = await note.populate('author', ACTOR_FIELDS);
  res.status(201).json({ success: true, message: 'Note added', note: populated });
});

// DELETE /api/employees/:id/notes/:noteId
export const deleteNote = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);
  const note = await EmployeeNote.findOne({ _id: req.params.noteId, employee: req.params.id });
  if (!note) throw ApiError.notFound('Note not found');

  await note.deleteOne();
  res.status(200).json({ success: true, message: 'Note deleted' });
});

// GET /api/employees/:id/activity
export const getActivity = asyncHandler(async (req, res) => {
  await loadEmployee(req.params.id);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = { employee: req.params.id };

  const [total, records] = await Promise.all([
    ActivityLog.countDocuments(filter),
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('actor', ACTOR_FIELDS),
  ]);

  res.status(200).json({
    success: true,
    records,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10);
};

const row = (label, value) =>
  `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || '—')}</td></tr>`;

// GET /api/employees/:id/profile/download
export const downloadProfile = asyncHandler(async (req, res) => {
  const employee = await loadEmployee(req.params.id);
  const [attendance, leave, goals, performance, payroll, assets, documents] = await Promise.all([
    buildAttendanceSummary(employee._id),
    buildLeaveSummary(employee._id),
    buildGoalSummary(employee._id),
    buildPerformanceSummary(employee._id),
    Payroll.find({ employee: employee._id }).sort({ month: -1 }).limit(12),
    Asset.find({ employee: employee._id }).sort({ assignedDate: -1 }),
    EmployeeDocument.find({ employee: employee._id }).sort({ createdAt: -1 }),
  ]);

  const managerName = employee.manager
    ? `${employee.manager.firstName} ${employee.manager.lastName}`
    : '—';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(employee.fullName)} - Employee Profile</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2b2f3a; margin: 32px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .06em; color: #4f46e5; margin: 26px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .muted { color: #6b7280; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #eef0f4; vertical-align: top; }
  th { width: 220px; color: #6b7280; font-weight: 600; }
  .stats { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
  .stat { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; min-width: 130px; }
  .stat span { display: block; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .stat strong { font-size: 18px; }
</style>
</head>
<body>
  <h1>${escapeHtml(employee.fullName)}</h1>
  <p class="muted">${escapeHtml(employee.designation || 'No designation')} · ${escapeHtml(employee.department || 'No department')}</p>
  <p class="muted">${escapeHtml(employee.employeeId || '')} · ${escapeHtml(employee.email || '')}</p>

  <h2>Employment</h2>
  <table>
    ${row('Employee ID', employee.employeeId)}
    ${row('Joining date', formatDate(employee.joiningDate))}
    ${row('Department', employee.department)}
    ${row('Designation', employee.designation)}
    ${row('Manager', managerName)}
    ${row('Employment type', employee.employmentType)}
    ${row('Work location', employee.workLocation)}
    ${row('Status', employee.isActive ? 'Active' : 'Inactive')}
  </table>

  <h2>Personal Information</h2>
  <table>
    ${row('Gender', employee.gender)}
    ${row('Date of birth', formatDate(employee.dateOfBirth))}
    ${row('Blood group', employee.bloodGroup)}
    ${row('Personal email', employee.personalEmail)}
    ${row('Phone', employee.phone)}
    ${row('Alternate phone', employee.alternatePhone)}
    ${row('Address', [employee.address, employee.city, employee.state, employee.country, employee.pincode].filter(Boolean).join(', '))}
  </table>

  <h2>Summary</h2>
  <div class="stats">
    <div class="stat"><span>Attendance</span><strong>${attendance.percentage}%</strong></div>
    <div class="stat"><span>Goals completed</span><strong>${goals.completed}/${goals.total}</strong></div>
    <div class="stat"><span>Avg rating</span><strong>${performance.avgRating || '—'}</strong></div>
    <div class="stat"><span>Assets assigned</span><strong>${assets.filter((a) => a.status === 'ASSIGNED').length}</strong></div>
    <div class="stat"><span>Documents</span><strong>${documents.length}</strong></div>
    <div class="stat"><span>Leave pending</span><strong>${leave.pending}</strong></div>
  </div>

  <h2>Leave Balance</h2>
  <table>
    ${leave.balances
      .map(
        (b) =>
          `<tr><th>${escapeHtml(b.type)}</th><td>${b.used} used · ${b.balance} of ${b.entitlement} remaining</td></tr>`
      )
      .join('')}
  </table>

  <h2>Recent Payroll</h2>
  <table>
    ${
      payroll.length
        ? payroll
            .map(
              (p) =>
                `<tr><th>${escapeHtml(p.month)}</th><td>${escapeHtml(p.currency)} ${p.netPay} · ${escapeHtml(p.status)}</td></tr>`
            )
            .join('')
        : row('Payroll', 'No records')
    }
  </table>

  <h2>Assets</h2>
  <table>
    ${
      assets.length
        ? assets
            .map(
              (a) =>
                `<tr><th>${escapeHtml(a.name)} (${escapeHtml(a.type)})</th><td>${escapeHtml(a.status)}${a.serialNumber ? ` · ${escapeHtml(a.serialNumber)}` : ''}</td></tr>`
            )
            .join('')
        : row('Assets', 'No records')
    }
  </table>

  <p class="muted" style="margin-top:32px;font-size:12px;">Generated on ${new Date().toUTCString()} by Office EMS</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="profile-${employee.employeeId || employee._id}.html"`
  );
  res.status(200).send(html);
});
