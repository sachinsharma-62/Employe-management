import nodemailer from 'nodemailer';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getAttendanceSettings } from '../utils/attendanceSettings.js';
import {
  getAllSettings,
  getSetting,
  updateSetting,
} from '../utils/settingsStore.js';

const NUMERIC_FIELDS = new Set(['fiscalYearStart', 'port']);

// GET /api/settings
export const getSettings = asyncHandler(async (_req, res) => {
  const [settings, attendance] = await Promise.all([getAllSettings(), getAttendanceSettings()]);
  res.status(200).json({ success: true, settings: { ...settings, attendance } });
});

// PUT /api/settings/company  (multer runs before this)
export const updateCompany = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  for (const field of NUMERIC_FIELDS) {
    if (field in payload) payload[field] = Number(payload[field]);
  }

  if (req.file) payload.logo = `uploads/logos/${req.file.filename}`;

  const company = await updateSetting('company', payload, req.user._id);
  res.status(200).json({ success: true, message: 'Company information updated', settings: company });
});

// PUT /api/settings/email  (keeps the stored password when the field is blank)
export const updateEmail = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.pass) delete payload.pass;
  const email = await updateSetting('email', payload, req.user._id);
  res.status(200).json({ success: true, message: 'Email settings updated', settings: email });
});

// POST /api/settings/email/test — verifies a SMTP connection with nodemailer.
export const testEmailSettings = asyncHandler(async (req, res) => {
  const submitted = req.body || {};
  const stored = await getSetting('email');
  const config = { ...stored, ...submitted };
  const auth = config.user && config.pass ? { user: config.user, pass: config.pass } : undefined;

  const transport = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port) || 587,
    secure: Boolean(config.secure),
    auth,
    connectionTimeout: 8000,
  });

  try {
    await transport.verify();
  } catch (err) {
    throw ApiError.badRequest(
      `Connection failed: ${err.message || 'Unable to reach the SMTP server'}`
    );
  } finally {
    transport.close();
  }

  res.status(200).json({ success: true, message: 'SMTP connection verified successfully' });
});

// Generic updater used by the remaining sections.
export const updateSection = (key) =>
  asyncHandler(async (req, res) => {
    const settings = await updateSetting(key, req.body, req.user._id);
    res.status(200).json({ success: true, message: 'Settings updated', settings });
  });

export const getSettingSection = (key) =>
  asyncHandler(async (req, res) => {
    const settings = await getSetting(key);
    res.status(200).json({ success: true, settings });
  });