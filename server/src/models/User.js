import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ALL_ROLES, ROLES } from '../utils/roles.js';
import { BLOOD_GROUPS, EMPLOYMENT_TYPES, GENDERS } from '../utils/enums.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    relationship: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
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
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ALL_ROLES,
        message: 'Invalid role: {VALUE}',
      },
      default: ROLES.EMPLOYEE,
    },
    designation: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },

    employeeId: { type: String, trim: true, uppercase: true },

    gender: { type: String, enum: [...GENDERS, ''], default: '' },
    dateOfBirth: { type: Date, default: null },
    bloodGroup: { type: String, enum: [...BLOOD_GROUPS, ''], default: '' },

    personalEmail: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    alternatePhone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },

    department: { type: String, trim: true, default: '' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    joiningDate: { type: Date, default: Date.now },
    employmentType: {
      type: String,
      enum: [...EMPLOYMENT_TYPES, ''],
      default: EMPLOYMENT_TYPES[0],
    },
    workLocation: { type: String, trim: true, default: '' },

    emergencyContact: { type: emergencyContactSchema, default: () => ({}) },

    passwordChangedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.loginAttempts;
        delete ret.lockedUntil;
        return ret;
      },
    },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('avatarUrl').get(function () {
  return this.avatar || '';
});

userSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ department: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function () {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
};

userSchema.methods.recordFailedLogin = async function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockedUntil = new Date(Date.now() + LOCK_TIME);
  }
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts === 0 && !this.lockedUntil) return;
  this.loginAttempts = 0;
  this.lockedUntil = null;
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.changedPasswordAfter = function (jwtIatSeconds) {
  if (!this.passwordChangedAt) return false;
  const changedSeconds = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedSeconds > jwtIatSeconds;
};

export default mongoose.model('User', userSchema);
