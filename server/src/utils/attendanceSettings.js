import AttendanceSettings from '../models/AttendanceSettings.js';
import { SETTINGS_DEFAULTS } from './attendance.js';

export const getAttendanceSettings = async () => {
  const doc = await AttendanceSettings.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default', ...SETTINGS_DEFAULTS } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return { ...SETTINGS_DEFAULTS, ...doc };
};

export const updateAttendanceSettings = async (payload, userId) => {
  const doc = await AttendanceSettings.findOneAndUpdate(
    { key: 'default' },
    { $set: { ...payload, updatedBy: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return { ...SETTINGS_DEFAULTS, ...doc };
};
