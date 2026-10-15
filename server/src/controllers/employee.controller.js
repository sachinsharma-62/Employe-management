import crypto from 'node:crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ALL_ROLES } from '../utils/roles.js';
import {
  BLOOD_GROUPS,
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  GENDERS,
} from '../utils/enums.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MANAGER_FIELDS = 'firstName lastName designation department avatar';

const SORT_FIELDS = {
  name: 'firstName',
  employeeId: 'employeeId',
  email: 'email',
  department: 'department',
  designation: 'designation',
  joiningDate: 'joiningDate',
  employmentType: 'employmentType',
  status: 'isActive',
  createdAt: 'createdAt',
};

const TEXT_FIELDS = [
  'firstName',
  'lastName',
  'gender',
  'bloodGroup',
  'personalEmail',
  'phone',
  'alternatePhone',
  'address',
  'city',
  'state',
  'country',
  'pincode',
  'department',
  'designation',
  'employmentType',
  'workLocation',
];

const EMERGENCY_FIELDS = {
  name: 'emergencyContactName',
  relationship: 'emergencyContactRelationship',
  phone: 'emergencyContactPhone',
  email: 'emergencyContactEmail',
  address: 'emergencyContactAddress',
};

const buildFilter = (query) => {
  const filter = {};

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { employeeId: regex },
      { phone: regex },
      { designation: regex },
    ];
  }
  if (query.department) filter.department = query.department;
  if (query.role && ALL_ROLES.includes(query.role)) filter.role = query.role;
  if (query.employmentType && EMPLOYMENT_TYPES.includes(query.employmentType)) {
    filter.employmentType = query.employmentType;
  }
  if (query.gender && GENDERS.includes(query.gender)) filter.gender = query.gender;
  if (query.status === 'active') filter.isActive = true;
  if (query.status === 'inactive') filter.isActive = false;
  if (query.manager) filter.manager = query.manager;

  return filter;
};

const buildSort = (query) => {
  const field = SORT_FIELDS[query.sortBy] || 'createdAt';
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  return { [field]: direction, _id: -1 };
};

const generateEmployeeId = async () => {
  const count = await User.countDocuments({ employeeId: { $regex: /^EMP-/ } });
  let next = count + 1;
  let candidate = `EMP-${String(next).padStart(4, '0')}`;
  while (await User.exists({ employeeId: candidate })) {
    next += 1;
    candidate = `EMP-${String(next).padStart(4, '0')}`;
  }
  return candidate;
};

const generateTempPassword = () => `${crypto.randomBytes(4).toString('hex')}Aa1`;

const applyBody = (user, body, { allowRole }) => {
  for (const field of TEXT_FIELDS) {
    if (body[field] !== undefined) user[field] = body[field];
  }

  if (body.dateOfBirth !== undefined) {
    user.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if (body.joiningDate !== undefined) {
    user.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null;
  }
  if (body.manager !== undefined) {
    user.manager = body.manager ? body.manager : null;
  }
  if (body.isActive !== undefined) {
    user.isActive = body.isActive === true || body.isActive === 'true';
  }
  if (allowRole && body.role !== undefined && ALL_ROLES.includes(body.role)) {
    user.role = body.role;
  }

  const hasEmergency = Object.values(EMERGENCY_FIELDS).some(
    (key) => body[key] !== undefined
  );
  if (hasEmergency) {
    const current = user.emergencyContact ? user.emergencyContact.toObject?.() || user.emergencyContact : {};
    for (const [prop, key] of Object.entries(EMERGENCY_FIELDS)) {
      if (body[key] !== undefined) current[prop] = body[key];
    }
    user.emergencyContact = current;
  }
};

// GET /api/employees
export const listEmployees = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

  const filter = buildFilter(req.query);

  const [total, employees] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort(buildSort(req.query))
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('manager', MANAGER_FIELDS),
  ]);

  res.status(200).json({
    success: true,
    employees,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/employees/meta
export const getEmployeeMeta = asyncHandler(async (_req, res) => {
  const managers = await User.find({
    isActive: true,
    role: { $in: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] },
  })
    .select('firstName lastName designation department')
    .sort('firstName');

  res.status(200).json({
    success: true,
    meta: {
      departments: DEPARTMENTS,
      employmentTypes: EMPLOYMENT_TYPES,
      genders: GENDERS,
      bloodGroups: BLOOD_GROUPS,
      roles: ALL_ROLES,
      managers,
    },
  });
});

// GET /api/employees/export
export const exportEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find(buildFilter(req.query))
    .sort(buildSort(req.query))
    .populate('manager', MANAGER_FIELDS);

  const columns = [
    'Employee ID',
    'First Name',
    'Last Name',
    'Email',
    'Personal Email',
    'Phone',
    'Department',
    'Designation',
    'Manager',
    'Joining Date',
    'Employment Type',
    'Status',
    'Gender',
    'Date of Birth',
    'Blood Group',
    'City',
    'State',
    'Country',
    'Pincode',
  ];

  const escapeCell = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = employees.map((e) =>
    [
      e.employeeId,
      e.firstName,
      e.lastName,
      e.email,
      e.personalEmail,
      e.phone,
      e.department,
      e.designation,
      e.manager?.fullName || '',
      e.joiningDate ? new Date(e.joiningDate).toISOString().slice(0, 10) : '',
      e.employmentType,
      e.isActive ? 'Active' : 'Inactive',
      e.gender,
      e.dateOfBirth ? new Date(e.dateOfBirth).toISOString().slice(0, 10) : '',
      e.bloodGroup,
      e.city,
      e.state,
      e.country,
      e.pincode,
    ]
      .map(escapeCell)
      .join(',')
  );

  const csv = [columns.map(escapeCell).join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="employees-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.status(200).send(csv);
});

// GET /api/employees/:id
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id).populate('manager', MANAGER_FIELDS);
  if (!employee) throw ApiError.notFound('Employee not found');
  res.status(200).json({ success: true, employee });
});

// POST /api/employees
export const createEmployee = asyncHandler(async (req, res) => {
  const body = req.body;
  const email = String(body.email || '').toLowerCase().trim();

  if (await User.exists({ email })) {
    throw ApiError.conflict('An employee with this email already exists');
  }

  const employeeId = String(body.employeeId || '').trim() || (await generateEmployeeId());
  const generatedPassword = !body.password;
  const password = body.password ? String(body.password) : generateTempPassword();

  const user = new User({ email, password, employeeId });
  applyBody(user, body, { allowRole: req.user.role === 'SUPER_ADMIN' });
  user.employeeId = employeeId;
  user.email = email;
  if (req.file) user.avatar = `/uploads/avatars/${req.file.filename}`;

  await user.save();

  const created = await User.findById(user._id).populate('manager', MANAGER_FIELDS);

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    ...(generatedPassword ? { temporaryPassword: password } : {}),
    employee: created,
  });
});

// PATCH /api/employees/:id
export const updateEmployee = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Employee not found');

  const body = req.body;
  const isSelf = user._id.toString() === req.user._id.toString();

  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    if (email && email !== user.email) {
      const exists = await User.exists({ email, _id: { $ne: user._id } });
      if (exists) throw ApiError.conflict('That email is already in use by another employee');
      user.email = email;
    }
  }

  if (isSelf && body.isActive !== undefined && body.isActive !== true && body.isActive !== 'true') {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  const nextEmployeeId = String(body.employeeId || '').trim();
  if (nextEmployeeId && nextEmployeeId !== user.employeeId) {
    const exists = await User.exists({ employeeId: nextEmployeeId, _id: { $ne: user._id } });
    if (exists) throw ApiError.conflict('That employee ID is already in use');
    user.employeeId = nextEmployeeId;
  }

  applyBody(user, body, { allowRole: req.user.role === 'SUPER_ADMIN' });
  if (req.file) user.avatar = `/uploads/avatars/${req.file.filename}`;

  await user.save();

  if (body.isActive !== undefined && user.isActive === false) {
    await RefreshToken.deleteMany({ user: user._id });
  }

  const updated = await User.findById(user._id).populate('manager', MANAGER_FIELDS);

  res.status(200).json({ success: true, message: 'Employee updated successfully', employee: updated });
});

// DELETE /api/employees/:id
export const deleteEmployee = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Employee not found');

  if (user._id.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  await RefreshToken.deleteMany({ user: user._id });
  await user.deleteOne();

  res.status(200).json({ success: true, message: 'Employee deleted successfully' });
});

// POST /api/employees/bulk
export const bulkAction = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const ids = [...new Set(req.body.ids.map((id) => id.toString()))].filter(
    (id) => id !== req.user._id.toString()
  );

  if (ids.length === 0) throw ApiError.badRequest('No valid employees selected');

  if (action === 'delete') {
    await RefreshToken.deleteMany({ user: { $in: ids } });
    const result = await User.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} employee(s) deleted`,
      affected: result.deletedCount,
    });
  }

  const isActive = action === 'activate';
  await User.updateMany({ _id: { $in: ids } }, { $set: { isActive } });
  if (!isActive) await RefreshToken.deleteMany({ user: { $in: ids } });

  return res.status(200).json({
    success: true,
    message: `${ids.length} employee(s) ${isActive ? 'activated' : 'deactivated'}`,
    affected: ids.length,
  });
});
