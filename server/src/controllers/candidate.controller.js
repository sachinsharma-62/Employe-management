import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CANDIDATE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'job',
  'stage',
  'source',
  'resumeUrl',
  'resumeName',
  'notes',
  'appliedAt',
  'isActive',
];

const buildPayload = (body) => {
  const payload = {};
  for (const field of CANDIDATE_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  if (payload.job === '') payload.job = null;
  return payload;
};

const buildFilter = (query) => {
  const conditions = [];
  if (query.includeInactive !== true) conditions.push({ isActive: true });
  if (query.job) conditions.push({ job: query.job });
  if (query.stage) conditions.push({ stage: query.stage });
  if (query.source) conditions.push({ source: query.source });
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    conditions.push({ $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }] });
  }
  return conditions.length ? { $and: conditions } : {};
};

const isDuplicateKey = (err) => err && err.code === 11000;

// GET /api/candidates
export const listCandidates = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = buildFilter(req.query);

  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .populate('job', 'title department status')
      .sort({ appliedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Candidate.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit) || 1, candidates });
});

// GET /api/candidates/:id
export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('job', 'title department location status');
  if (!candidate) throw ApiError.notFound('Candidate not found');
  res.status(200).json({ success: true, candidate });
});

// POST /api/candidates
export const createCandidate = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);
  try {
    const candidate = await Candidate.create(payload);
    const populated = await candidate.populate('job', 'title department status');
    res.status(201).json({ success: true, message: 'Candidate added', candidate: populated });
  } catch (err) {
    if (isDuplicateKey(err)) {
      throw ApiError.conflict('This candidate has already applied to the selected job');
    }
    throw err;
  }
});

// PUT /api/candidates/:id
export const updateCandidate = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    ).populate('job', 'title department status');
    if (!candidate) throw ApiError.notFound('Candidate not found');
    res.status(200).json({ success: true, message: 'Candidate updated', candidate });
  } catch (err) {
    if (isDuplicateKey(err)) {
      throw ApiError.conflict('This candidate has already applied to the selected job');
    }
    throw err;
  }
});

// DELETE /api/candidates/:id
export const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findByIdAndDelete(req.params.id);
  if (!candidate) throw ApiError.notFound('Candidate not found');
  res.status(200).json({ success: true, message: 'Candidate removed' });
});

// GET /api/candidates/meta
export const getCandidateMeta = asyncHandler(async (_req, res) => {
  const jobs = await Job.find({ isActive: true }).select('title department').sort('title');
  res.status(200).json({ success: true, jobs });
});