import mongoose from 'mongoose';
import { JOB_STATUSES, JOB_TYPES } from '../utils/enums.js';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 120,
    },
    department: { type: String, trim: true, default: '', index: true },
    location: { type: String, trim: true, default: '', index: true },
    jobType: {
      type: String,
      enum: { values: JOB_TYPES, message: 'Invalid job type: {VALUE}' },
      default: 'FULL_TIME',
    },
    openings: { type: Number, default: 1, min: 0, max: 500 },
    status: {
      type: String,
      enum: { values: JOB_STATUSES, message: 'Invalid job status: {VALUE}' },
      default: 'OPEN',
      index: true,
    },
    minExperience: { type: Number, default: 0, min: 0, max: 60 },
    maxExperience: { type: Number, default: null, min: 0, max: 60 },
    salaryRange: { type: String, trim: true, default: '', maxlength: 80 },
    skills: { type: [String], default: [] },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    requirements: { type: String, trim: true, default: '', maxlength: 2000 },
    closesOn: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

jobSchema.index({ title: 1 }, { unique: true });
jobSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Job', jobSchema);