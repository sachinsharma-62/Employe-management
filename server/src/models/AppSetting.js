import mongoose from 'mongoose';

// Singleton-style settings store: one document per settings category
// (key), with the payload kept as a Mixed `data` blob. Follows the same
// upsert-on-read pattern used for AttendanceSettings.
const appSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('AppSetting', appSettingSchema);