import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.resolve('uploads/documents');

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
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(
        ApiError.badRequest(
          'Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG, WEBP'
        )
      );
    }
    return cb(null, true);
  },
});

export default uploadDocument;
