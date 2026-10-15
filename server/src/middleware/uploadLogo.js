import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.resolve('uploads/logos');

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

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];

const uploadLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only PNG, JPG or WEBP images are allowed'));
    }
    return cb(null, true);
  },
});

export default uploadLogo;