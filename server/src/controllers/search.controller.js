import asyncHandler from '../utils/asyncHandler.js';
import { searchAll } from '../utils/searchService.js';

// GET /api/search?q=&limit=
export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const { results, total } = await searchAll({ q, user: req.user, perType: req.query.limit });
  res.status(200).json({ success: true, query: q, total, results });
});