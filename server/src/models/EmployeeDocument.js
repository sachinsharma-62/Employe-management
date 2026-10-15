import mongoose from 'mongoose';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  DOCUMENT_VERIFICATION_STATUSES,
} from '../utils/enums.js';

const employeeDocumentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: [true, 'Document name is required'], trim: true, maxlength: 160 },
    documentType: {
      type: String,
      enum: {
        values: DOCUMENT_TYPES,
        message: 'Invalid document type: {VALUE}',
      },
      default: 'OTHER',
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: DOCUMENT_CATEGORIES,
        message: 'Invalid document category: {VALUE}',
      },
      default: 'OTHER',
    },
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
    expiryDate: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: { values: DOCUMENT_STATUSES, message: 'Invalid document status: {VALUE}' },
      default: 'ACTIVE',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: DOCUMENT_VERIFICATION_STATUSES,
        message: 'Invalid verification status: {VALUE}',
      },
      default: 'PENDING',
      index: true,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: '', maxlength: 300 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

employeeDocumentSchema.index({ employee: 1, createdAt: -1 });
employeeDocumentSchema.index({ verificationStatus: 1, createdAt: -1 });

// Effective status accounts for an expiry date that has passed.
employeeDocumentSchema
  .virtual('effectiveStatus')
  .get(function effectiveStatus() {
    if (this.status === 'ARCHIVED') return 'ARCHIVED';
    if (this.expiryDate && new Date(this.expiryDate).getTime() < Date.now()) return 'EXPIRED';
    return 'ACTIVE';
  });

employeeDocumentSchema.set('toJSON', { virtuals: true });
employeeDocumentSchema.set('toObject', { virtuals: true });

export default mongoose.model('EmployeeDocument', employeeDocumentSchema);
