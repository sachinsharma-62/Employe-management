import User from '../models/User.js';
import LeaveType from '../models/LeaveType.js';
import LeaveRequest from '../models/LeaveRequest.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assetUrl } from '../utils/assetUrl.js';
import {
  buildBalances,
  countDays,
  isTypeApplicable,
  parseISODate,
  resolveYear,
  serializeLeaveType,
  serializeRequest,
  summarizeBalances,
} from '../utils/leaveService.js';

const EMPLOYEE_FIELDS = 'firstName lastName employeeId email designation department avatar role manager';
const DECIDER_FIELDS = 'firstName lastName avatar designation';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const loadTypeByCode = async (code) => {
  const type = await LeaveType.findOne({ code: String(code || '').toUpperCase() });
  if (!type) throw ApiError.badRequest('Unknown leave type');
  return type;
};

const buildAttachment = (req) => {
  if (!req.file) return {};
  return {
    url: `/uploads/leaves/${req.file.filename}`,
    name: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  };
};

const serializeWithUrls = (request) => {
  const serialized = serializeRequest(request);
  if (serialized.attachment?.url) {
    serialized.attachment = { ...serialized.attachment, url: assetUrl(serialized.attachment.url) };
  }
  return serialized;
};

// GET /api/leaves/types
export const listLeaveTypes = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === 'true';
  const filter = includeInactive ? {} : { isActive: true };
  const types = await LeaveType.find(filter).sort({ code: 1 });
  res.status(200).json({ success: true, types: types.map(serializeLeaveType) });
});

// POST /api/leaves/types
export const createLeaveType = asyncHandler(async (req, res) => {
  const existing = await LeaveType.findOne({ code: req.body.code.toUpperCase() });
  if (existing) throw ApiError.conflict('A leave type with this code already exists');

  const type = await LeaveType.create({
    code: req.body.code,
    name: req.body.name,
    description: req.body.description || '',
    totalDays: req.body.totalDays || 0,
    carryForward: Boolean(req.body.carryForward),
    carryForwardLimit: req.body.carryForwardLimit || 0,
    encashable: Boolean(req.body.encashable),
    applicableScope: req.body.applicableScope || 'ALL',
    applicableRoles: req.body.applicableRoles || [],
    applicableDepartments: req.body.applicableDepartments || [],
    applicableEmployees: req.body.applicableEmployees || [],
    color: req.body.color || 'indigo',
    isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
  });

  res.status(201).json({ success: true, message: 'Leave type created', type: serializeLeaveType(type) });
});

// PUT /api/leaves/types/:id
export const updateLeaveType = asyncHandler(async (req, res) => {
  const type = await LeaveType.findById(req.params.id);
  if (!type) throw ApiError.notFound('Leave type not found');

  const fields = [
    'name',
    'description',
    'totalDays',
    'carryForward',
    'carryForwardLimit',
    'encashable',
    'applicableScope',
    'applicableRoles',
    'applicableDepartments',
    'applicableEmployees',
    'color',
    'isActive',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) type[field] = req.body[field];
  });

  await type.save();
  res.status(200).json({ success: true, message: 'Leave type updated', type: serializeLeaveType(type) });
});

// DELETE /api/leaves/types/:id
export const deleteLeaveType = asyncHandler(async (req, res) => {
  const type = await LeaveType.findById(req.params.id);
  if (!type) throw ApiError.notFound('Leave type not found');

  const inUse = await LeaveRequest.countDocuments({ type: type.code });
  if (inUse > 0) {
    type.isActive = false;
    await type.save();
    return res
      .status(200)
      .json({ success: true, message: 'Leave type deactivated (existing requests kept)', type: serializeLeaveType(type) });
  }

  await type.deleteOne();
  res.status(200).json({ success: true, message: 'Leave type deleted' });
});

// GET /api/leaves/me?year=
export const getMyLeaves = asyncHandler(async (req, res) => {
  const year = resolveYear(req.query.year);
  const [balances, requests, types] = await Promise.all([
    buildBalances(req.user, year),
    LeaveRequest.find({ employee: req.user._id, leaveYear: year })
      .sort({ fromDate: -1 })
      .populate('decidedBy', DECIDER_FIELDS),
    LeaveType.find({ isActive: true }).sort({ code: 1 }),
  ]);

  const applicable = types.filter((type) => isTypeApplicable(type, req.user));

  res.status(200).json({
    success: true,
    year,
    balances,
    totals: summarizeBalances(balances),
    requests: requests.map(serializeWithUrls),
    types: applicable.map(serializeLeaveType),
  });
});

// POST /api/leaves/me/apply
export const applyLeave = asyncHandler(async (req, res) => {
  const from = parseISODate(req.body.fromDate);
  const to = parseISODate(req.body.toDate);
  if (!from || !to) throw ApiError.badRequest('Valid start and end dates are required');
  if (to.getTime() < from.getTime()) {
    throw ApiError.badRequest('End date cannot be earlier than the start date');
  }

  const type = await loadTypeByCode(req.body.type);
  if (!isTypeApplicable(type, req.user)) {
    throw ApiError.badRequest('This leave type is not applicable to you');
  }

  const days = countDays(from, to);

  const overlap = await LeaveRequest.findOne({
    employee: req.user._id,
    status: { $in: ['PENDING', 'APPROVED'] },
    fromDate: { $lte: to },
    toDate: { $gte: from },
  });
  if (overlap) {
    throw ApiError.conflict('You already have a leave request overlapping these dates');
  }

  const year = from.getFullYear();
  const balances = await buildBalances(req.user, year);
  const balance = balances.find((b) => b.type === type.code);
  if (balance && !balance.unlimited && balance.available < days) {
    throw ApiError.badRequest(
      `Insufficient ${type.name} balance. Available: ${balance.available} day(s), requested: ${days}.`
    );
  }

  const request = await LeaveRequest.create({
    employee: req.user._id,
    type: type.code,
    fromDate: from,
    toDate: to,
    days,
    leaveYear: year,
    reason: req.body.reason?.trim() || '',
    attachment: buildAttachment(req),
    status: 'PENDING',
    appliedAt: new Date(),
  });

  res
    .status(201)
    .json({ success: true, message: 'Leave request submitted', request: serializeWithUrls(request) });
});

// POST /api/leaves/me/:id/cancel
export const cancelLeave = asyncHandler(async (req, res) => {
  const request = await LeaveRequest.findOne({ _id: req.params.id, employee: req.user._id });
  if (!request) throw ApiError.notFound('Leave request not found');
  if (request.status === 'CANCELLED') throw ApiError.conflict('This request is already cancelled');
  if (request.status === 'REJECTED') {
    throw ApiError.conflict('A rejected request cannot be cancelled');
  }

  request.status = 'CANCELLED';
  request.cancelledBy = req.user._id;
  request.cancelledAt = new Date();
  request.cancelReason = req.body.reason?.trim() || '';
  await request.save();

  res.status(200).json({ success: true, message: 'Leave request cancelled', request: serializeWithUrls(request) });
});

// GET /api/leaves/requests
export const listLeaveRequests = asyncHandler(async (req, res) => {
  const { status, type, search, department, from, to } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};

  if (status) filter.status = status;
  if (type) filter.type = type;

  if (search || department) {
    const userFilter = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      userFilter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }];
    }
    if (department) userFilter.department = department;
    const ids = await User.find(userFilter).select('_id');
    filter.employee = { $in: ids.map((u) => u._id) };
  }

  if (from || to) {
    const start = from ? parseISODate(from) : null;
    const end = to ? new Date(parseISODate(to).getFullYear(), parseISODate(to).getMonth(), parseISODate(to).getDate() + 1) : null;
    filter.fromDate = { ...(filter.fromDate || {}) };
    if (start) filter.fromDate.$gte = start;
    if (end) filter.fromDate.$lt = end;
  }

  const [total, records, summaryRows] = await Promise.all([
    LeaveRequest.countDocuments(filter),
    LeaveRequest.find(filter)
      .sort({ appliedAt: -1, fromDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', EMPLOYEE_FIELDS)
      .populate('decidedBy', DECIDER_FIELDS),
    LeaveRequest.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 }, days: { $sum: '$days' } } }]),
  ]);

  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
  let totalDays = 0;
  summaryRows.forEach((row) => {
    counts[row._id] = row.count;
    totalDays += row.days;
  });

  res.status(200).json({
    success: true,
    records: records.map(serializeWithUrls),
    summary: {
      counts,
      total: Object.values(counts).reduce((sum, value) => sum + value, 0),
      totalDays,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/leaves/requests/:id
export const getLeaveRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequest.findById(req.params.id)
    .populate('employee', EMPLOYEE_FIELDS)
    .populate('decidedBy', DECIDER_FIELDS)
    .populate('cancelledBy', DECIDER_FIELDS);
  if (!request) throw ApiError.notFound('Leave request not found');
  res.status(200).json({ success: true, request: serializeWithUrls(request) });
});

const decide = async (id, status, user, note) => {
  const request = await LeaveRequest.findById(id);
  if (!request) throw ApiError.notFound('Leave request not found');
  if (request.status !== 'PENDING') {
    throw ApiError.conflict('This request has already been decided');
  }

  request.status = status;
  request.decidedBy = user._id;
  request.decidedAt = new Date();
  request.decisionNote = note?.trim() || (status === 'APPROVED' ? 'Approved' : 'Rejected');
  await request.save();

  await request.populate('employee', EMPLOYEE_FIELDS);
  await request.populate('decidedBy', DECIDER_FIELDS);
  return request;
};

// POST /api/leaves/requests/:id/approve
export const approveLeave = asyncHandler(async (req, res) => {
  const request = await decide(req.params.id, 'APPROVED', req.user, req.body.note);
  res.status(200).json({ success: true, message: 'Leave approved', request: serializeWithUrls(request) });
});

// POST /api/leaves/requests/:id/reject
export const rejectLeave = asyncHandler(async (req, res) => {
  const request = await decide(req.params.id, 'REJECTED', req.user, req.body.note);
  res.status(200).json({ success: true, message: 'Leave rejected', request: serializeWithUrls(request) });
});

// GET /api/leaves/balances?year=&search=&department=
export const listBalances = asyncHandler(async (req, res) => {
  const year = resolveYear(req.query.year);
  const { search, department } = req.query;
  const filter = { isActive: true };
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { employeeId: rx }];
  }
  if (department) filter.department = department;

  const employees = await User.find(filter).select(EMPLOYEE_FIELDS).sort({ firstName: 1, lastName: 1 });
  const rows = [];
  for (const employee of employees) {
    const balances = await buildBalances(employee, year);
    rows.push({ employee, balances, totals: summarizeBalances(balances) });
  }

  res.status(200).json({ success: true, year, employees: rows });
});
