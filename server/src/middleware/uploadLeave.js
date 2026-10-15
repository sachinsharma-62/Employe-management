import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.resolve('uploads/leaves');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${crypto.randomBytes(10).toString('hex')}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const ALLOWED = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const uploadLeave = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, WEBP'));
    }
    return cb(null, true);
  },
});

export default uploadLeave;
