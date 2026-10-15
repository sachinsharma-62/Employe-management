import mongoose from 'mongoose';
import { CANDIDATE_SOURCES, CANDIDATE_STAGES } from '../utils/enums.js';

const candidateSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    phone: { type: String, trim: true, default: '', maxlength: 30 },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null, index: true },
    stage: {
      type: String,
      enum: { values: CANDIDATE_STAGES, message: 'Invalid candidate stage: {VALUE}' },
      default: 'APPLIED',
      index: true,
    },
    source: {
      type: String,
      enum: { values: CANDIDATE_SOURCES, message: 'Invalid candidate source: {VALUE}' },
      default: 'OTHER',
    },
    resumeUrl: { type: String, trim: true, default: '' },
    resumeName: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '', maxlength: 2000 },
    appliedAt: { type: Date, default: Date.now },
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

candidateSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

candidateSchema.index({ email: 1, job: 1 }, { unique: true });
candidateSchema.index({ job: 1, stage: 1 });

export default mongoose.model('Candidate', candidateSchema);