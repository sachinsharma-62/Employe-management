import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

passwordResetSchema.methods.isValid = function () {
  return !this.usedAt && this.expiresAt > new Date();
};

export default mongoose.model('PasswordReset', passwordResetSchema);
