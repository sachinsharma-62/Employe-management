import path from 'node:path';
import fs from 'node:fs';
import EmployeeDocument from '../models/EmployeeDocument.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assetUrl } from '../utils/assetUrl.js';
import { DOCUMENT_VERIFICATION_STATUSES } from '../utils/enums.js';

const VIEWER_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'];
const REVIEWER_ROLES = ['SUPER_ADMIN', 'HR_ADMIN'];

const ACTOR_FIELDS = 'firstName lastName avatar designation';
const EMPLOYEE_FIELDS =
  'firstName lastName employeeId designation department avatar email';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseISODate = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
};

const serializeDocument = (doc) => {
  const object = doc.toObject({ virtuals: true });
  return {
    ...object,
    uploadedAt: doc.createdAt,
    downloadUrl: assetUrl(doc.fileUrl),
  };
};

const populateDocument = (doc) =>
  doc.populate([
    { path: 'employee', select: EMPLOYEE_FIELDS },
    { path: 'uploadedBy', select: ACTOR_FIELDS },
    { path: 'verifiedBy', select: ACTOR_FIELDS },
  ]);

const isViewer = (user) => VIEWER_ROLES.includes(user.role);
const isReviewer = (user) => REVIEWER_ROLES.includes(user.role);

const isOwner = (user, doc) => String(doc.employee?._id || doc.employee) === String(user._id);

const assertAccess = (user, doc) => {
  if (isOwner(user, doc) || isViewer(user)) return;
  throw ApiError.forbidden('You do not have permission to access this document');
};

const buildFilter = (query) => {
  const now = new Date();
  const conditions = [];

  if (query.employee) conditions.push({ employee: query.employee });
  if (query.documentType) conditions.push({ documentType: query.documentType });
  if (query.verificationStatus) conditions.push({ verificationStatus: query.verificationStatus });

  if (query.status === 'ARCHIVED') {
    conditions.push({ status: 'ARCHIVED' });
  } else if (query.status === 'EXPIRED') {
    conditions.push({ status: { $ne: 'ARCHIVED' }, expiryDate: { $ne: null, $lt: now } });
  } else if (query.status === 'ACTIVE') {
    conditions.push({ status: { $ne: 'ARCHIVED' } });
    conditions.push({ $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] });
  }

  if (query.expiring === true) {
    conditions.push({
      status: { $ne: 'ARCHIVED' },
      expiryDate: { $ne: null, $gte: now, $lte: addDays(now, 30) },
    });
  }

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    conditions.push({ $or: [{ title: rx }, { fileName: rx }, { documentType: rx }] });
  }

  return conditions.length ? { $and: conditions } : {};
};

// GET /api/documents
export const listDocuments = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const [total, records] = await Promise.all([
    EmployeeDocument.countDocuments(filter),
    EmployeeDocument.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', EMPLOYEE_FIELDS)
      .populate('uploadedBy', ACTOR_FIELDS)
      .populate('verifiedBy', ACTOR_FIELDS),
  ]);

  res.status(200).json({
    success: true,
    records: records.map(serializeDocument),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/documents/me
export const getMyDocuments = asyncHandler(async (req, res) => {
  const records = await EmployeeDocument.find({ employee: req.user._id })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', ACTOR_FIELDS)
    .populate('verifiedBy', ACTOR_FIELDS);

  res.status(200).json({
    success: true,
    records: records.map(serializeDocument),
  });
});

// GET /api/documents/stats
export const getDocumentStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const soon = addDays(now, 30);

  const [total, pending, verified, rejected, expired, archived, expiringSoon] = await Promise.all([
    EmployeeDocument.countDocuments({}),
    EmployeeDocument.countDocuments({ verificationStatus: 'PENDING' }),
    EmployeeDocument.countDocuments({ verificationStatus: 'VERIFIED' }),
    EmployeeDocument.countDocuments({ verificationStatus: 'REJECTED' }),
    EmployeeDocument.countDocuments({ status: { $ne: 'ARCHIVED' }, expiryDate: { $ne: null, $lt: now } }),
    EmployeeDocument.countDocuments({ status: 'ARCHIVED' }),
    EmployeeDocument.countDocuments({
      status: { $ne: 'ARCHIVED' },
      expiryDate: { $ne: null, $gte: now, $lte: soon },
    }),
  ]);

  const records = await EmployeeDocument.find({}).select('documentType');
  const byType = {};
  records.forEach((record) => {
    byType[record.documentType] = (byType[record.documentType] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    stats: { total, pending, verified, rejected, expired, archived, expiringSoon, byType },
  });
});

// GET /api/documents/meta
export const getDocumentMeta = asyncHandler(async (_req, res) => {
  const employees = await User.find({ isActive: true })
    .select('firstName lastName employeeId designation department')
    .sort('firstName');
  res.status(200).json({ success: true, employees });
});

// GET /api/documents/:id
export const getDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findById(req.params.id)
    .populate('employee', EMPLOYEE_FIELDS)
    .populate('uploadedBy', ACTOR_FIELDS)
    .populate('verifiedBy', ACTOR_FIELDS);
  if (!document) throw ApiError.notFound('Document not found');
  assertAccess(req.user, document);
  res.status(200).json({ success: true, document: serializeDocument(document) });
});

// POST /api/documents
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please attach a file to upload');

  const requestedEmployee = req.body.employee;
  let targetEmployee = req.user;

  if (requestedEmployee && String(requestedEmployee) !== String(req.user._id)) {
    if (!isReviewer(req.user)) {
      throw ApiError.forbidden('You can only upload documents to your own profile');
    }
    targetEmployee = await User.findById(requestedEmployee);
    if (!targetEmployee) throw ApiError.badRequest('Employee not found');
  }

  const expiryDate = req.body.expiryDate ? parseISODate(req.body.expiryDate) : null;
  if (req.body.expiryDate && !expiryDate) {
    throw ApiError.badRequest('Expiry date must be in YYYY-MM-DD format');
  }

  const document = await EmployeeDocument.create({
    employee: targetEmployee._id,
    title: req.body.title.trim(),
    documentType: req.body.documentType || 'OTHER',
    category: req.body.category || 'OTHER',
    fileName: req.file.originalname,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    expiryDate,
    status: req.body.status || 'ACTIVE',
    verificationStatus: 'PENDING',
    uploadedBy: req.user._id,
  });

  await ActivityLog.create({
    employee: targetEmployee._id,
    actor: req.user._id,
    action: 'Document uploaded',
    description: `${req.user.fullName} uploaded "${document.title}"`,
    type: 'document',
    meta: { documentId: document._id, documentType: document.documentType },
  });

  const populated = await populateDocument(document);
  res
    .status(201)
    .json({ success: true, message: 'Document uploaded', document: serializeDocument(populated) });
});

// PATCH /api/documents/:id
export const updateDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');

  if (!isOwner(req.user, document) && !isReviewer(req.user)) {
    throw ApiError.forbidden('You do not have permission to edit this document');
  }

  if (req.body.title !== undefined) document.title = req.body.title.trim();
  if (req.body.documentType !== undefined) document.documentType = req.body.documentType;
  if (req.body.category !== undefined) document.category = req.body.category;
  if (req.body.status !== undefined) document.status = req.body.status;
  if (req.body.expiryDate !== undefined) {
    if (req.body.expiryDate === null || req.body.expiryDate === '') {
      document.expiryDate = null;
    } else {
      const expiryDate = parseISODate(req.body.expiryDate);
      if (!expiryDate) throw ApiError.badRequest('Expiry date must be in YYYY-MM-DD format');
      document.expiryDate = expiryDate;
    }
  }

  await document.save();
  const populated = await populateDocument(document);
  res
    .status(200)
    .json({ success: true, message: 'Document updated', document: serializeDocument(populated) });
});

// POST /api/documents/:id/verify
export const verifyDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');

  const { status } = req.body;
  if (!DOCUMENT_VERIFICATION_STATUSES.includes(status) || status === 'PENDING') {
    throw ApiError.badRequest('Verification status must be VERIFIED or REJECTED');
  }

  document.verificationStatus = status;
  document.verifiedBy = req.user._id;
  document.verifiedAt = new Date();
  document.rejectionReason = status === 'REJECTED' ? (req.body.rejectionReason?.trim() || '') : '';

  await document.save();

  await ActivityLog.create({
    employee: document.employee,
    actor: req.user._id,
    action: status === 'VERIFIED' ? 'Document verified' : 'Document rejected',
    description: `${req.user.fullName} ${status === 'VERIFIED' ? 'verified' : 'rejected'} "${document.title}"`,
    type: 'document',
    meta: { documentId: document._id, status },
  });

  const populated = await populateDocument(document);
  res.status(200).json({
    success: true,
    message: status === 'VERIFIED' ? 'Document verified' : 'Document rejected',
    document: serializeDocument(populated),
  });
});

// DELETE /api/documents/:id
export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');

  if (!isOwner(req.user, document) && !isReviewer(req.user)) {
    throw ApiError.forbidden('You do not have permission to delete this document');
  }

  const { employee, title, category } = document;
  await document.deleteOne();

  await ActivityLog.create({
    employee,
    actor: req.user._id,
    action: 'Document removed',
    description: `${req.user.fullName} removed "${title}"`,
    type: 'document',
    meta: { category },
  });

  res.status(200).json({ success: true, message: 'Document deleted' });
});

// GET /api/documents/:id/download
export const downloadDocument = asyncHandler(async (req, res) => {
  const document = await EmployeeDocument.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  assertAccess(req.user, document);

  const absolute = path.resolve(document.fileUrl.replace(/^\//, ''));
  if (!fs.existsSync(absolute)) {
    throw ApiError.notFound('The stored file could not be found');
  }

  const ext = path.extname(document.fileName) || path.extname(absolute);
  const base = (document.title || 'document').replace(/[^\w.-]+/g, '_');
  res.download(absolute, `${base}${ext}`);
});
