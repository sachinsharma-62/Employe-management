import mongoose from 'mongoose';

const attendanceSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default', index: true },
    officeStart: { type: String, trim: true, default: '09:30' },
    officeEnd: { type: String, trim: true, default: '18:30' },
    graceMinutes: { type: Number, default: 15, min: 0, max: 180 },
    requiredWorkHours: { type: Number, default: 8, min: 1, max: 24 },
    breakMinutes: { type: Number, default: 60, min: 0, max: 240 },
    breakThresholdHours: { type: Number, default: 6, min: 1, max: 12 },
    weekendDays: {
      type: [Number],
      default: [0, 6],
      validate: {
        validator: (days) => Array.isArray(days) && days.every((d) => d >= 0 && d <= 6),
        message: 'Weekend days must be numbers between 0 (Sun) and 6 (Sat)',
      },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('AttendanceSettings', attendanceSettingsSchema);
