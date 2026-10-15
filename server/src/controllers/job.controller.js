import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const JOB_FIELDS = [
  'title',
  'department',
  'location',
  'jobType',
  'openings',
  'status',
  'minExperience',
  'maxExperience',
  'salaryRange',
  'description',
  'requirements',
  'closesOn',
  'isActive',
];

const sanitizeSkills = (skills) =>
  [...new Set((skills || []).map((skill) => String(skill).trim()).filter(Boolean))].slice(0, 30);

const buildPayload = (body) => {
  const payload = {};
  for (const field of JOB_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  if (body.skills !== undefined) payload.skills = sanitizeSkills(body.skills);
  return payload;
};

const buildFilter = (query) => {
  const conditions = [];
  if (query.includeInactive !== true) conditions.push({ isActive: true });
  if (query.status) conditions.push({ status: query.status });
  if (query.department) conditions.push({ department: query.department });
  if (query.jobType) conditions.push({ jobType: query.jobType });
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    conditions.push({ $or: [{ title: rx }, { department: rx }, { location: rx }, { skills: rx }] });
  }
  return conditions.length ? { $and: conditions } : {};
};

const isDuplicateKey = (err) => err && err.code === 11000;

// GET /api/jobs
export const listJobs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = buildFilter(req.query);

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ isActive: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit) || 1, jobs });
});

// GET /api/jobs/:id
export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('createdBy', 'firstName lastName');
  if (!job) throw ApiError.notFound('Job not found');
  const candidateCount = await Candidate.countDocuments({ job: job._id, isActive: true });
  res.status(200).json({ success: true, job, candidateCount });
});

// POST /api/jobs
export const createJob = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);
  try {
    const job = await Job.create({ ...payload, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Job created', job });
  } catch (err) {
    if (isDuplicateKey(err)) throw ApiError.conflict('A job with this title already exists');
    throw err;
  }
});

// PUT /api/jobs/:id
export const updateJob = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true, runValidators: true });
    if (!job) throw ApiError.notFound('Job not found');
    res.status(200).json({ success: true, message: 'Job updated', job });
  } catch (err) {
    if (isDuplicateKey(err)) throw ApiError.conflict('A job with this title already exists');
    throw err;
  }
});

// DELETE /api/jobs/:id
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: false, status: 'CLOSED' } },
    { new: true }
  );
  if (!job) throw ApiError.notFound('Job not found');
  res.status(200).json({ success: true, message: 'Job closed and archived', job });
});

// GET /api/jobs/meta
export const getJobMeta = asyncHandler(async (_req, res) => {
  const [departments, locations] = await Promise.all([
    Job.distinct('department', { isActive: true, department: { $ne: '' } }),
    Job.distinct('location', { isActive: true, location: { $ne: '' } }),
  ]);
  res.status(200).json({ success: true, departments: departments.sort(), locations: locations.sort() });
});