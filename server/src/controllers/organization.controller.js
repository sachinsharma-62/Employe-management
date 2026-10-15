import User from '../models/User.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import Team from '../models/Team.js';
import Location from '../models/Location.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getSetting } from '../utils/settingsStore.js';
import { EMPLOYMENT_TYPES } from '../utils/enums.js';
import { ROLES } from '../utils/roles.js';

const BASIC_USER_SELECT = 'firstName lastName employeeId designation department role avatar';
const BASIC_MANAGER_SELECT = 'firstName lastName designation department avatar';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const paginate = (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const fullNameOf = (user) => {
  if (!user || typeof user !== 'object') return null;
  const plain = user.toObject ? user.toObject() : { ...user };
  const fullName = `${plain.firstName || ''} ${plain.lastName || ''}`.trim();
  return { ...plain, fullName };
};

const teamResponse = (team) => {
  const payload = team.toJSON();
  payload.manager = payload.manager ? fullNameOf(payload.manager) : null;
  return payload;
};

// GET /api/organization/employees
export const listOrgEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { isActive: true };

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { employeeId: regex }];
  }

  const [total, employees] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).select(BASIC_USER_SELECT).sort('firstName').skip(skip).limit(limit),
  ]);

  res.status(200).json({
    success: true,
    employees,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/organization/departments
export const listDepartments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: regex }, { code: regex }];
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const [departments, totalByDept, activeByDept, teamAgg] = await Promise.all([
    Department.find(filter).sort('name').populate('head', BASIC_MANAGER_SELECT),
    User.aggregate([{ $group: { _id: '$department', total: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', active: { $sum: 1 } } },
    ]),
    Team.aggregate([{ $group: { _id: '$department', teams: { $sum: 1 } } }]),
  ]);

  const totalByName = new Map(totalByDept.map((c) => [c._id || '', c.total]));
  const activeByName = new Map(activeByDept.map((c) => [c._id || '', c.active]));
  const teamByDept = new Map(teamAgg.map((c) => [String(c._id), c.teams]));

  const list = departments.map((dept) => {
    const doc = dept.toObject();
    return {
      ...doc,
      head: doc.head ? fullNameOf(doc.head) : null,
      employeeCount: activeByName.get(doc.name) || 0,
      totalCount: totalByName.get(doc.name) || 0,
      teamCount: teamByDept.get(String(doc._id)) || 0,
    };
  });

  res.status(200).json({ success: true, departments: list });
});

// GET /api/organization/departments/:id
export const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('head', BASIC_MANAGER_SELECT);
  if (!department) throw ApiError.notFound('Department not found');

  const employees = await User.find({ department: department.name })
    .select(`${BASIC_USER_SELECT} email`)
    .populate('manager', BASIC_USER_SELECT)
    .sort('firstName');

  const totalCount = await User.countDocuments({ department: department.name });

  const payload = department.toJSON();
  payload.head = payload.head ? fullNameOf(payload.head) : null;

  res.status(200).json({
    success: true,
    department: payload,
    employees,
    totalCount,
  });
});

// POST /api/organization/departments
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, head, description } = req.body;

  if (await Department.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') })) {
    throw ApiError.conflict('A department with this name already exists');
  }
  if (code && (await Department.findOne({ code: String(code).toUpperCase() }))) {
    throw ApiError.conflict('That department code is already in use');
  }
  if (head && !(await User.exists({ _id: head }))) {
    throw ApiError.badRequest('Selected department head does not exist');
  }

  const department = await Department.create({
    name: name.trim(),
    code: code ? String(code).trim().toUpperCase() : null,
    head: head || null,
    description: description || '',
  });
  await department.populate('head', BASIC_MANAGER_SELECT);

  const payload = department.toJSON();
  payload.head = payload.head ? fullNameOf(payload.head) : null;

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    department: payload,
  });
});

// PATCH /api/organization/departments/:id
export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');

  const { name, code, head, description, isActive } = req.body;

  const nextName = name !== undefined ? String(name).trim() : department.name;
  if (nextName && nextName.toLowerCase() !== department.name.toLowerCase()) {
    if (await Department.findOne({ name: new RegExp(`^${escapeRegex(nextName)}$`, 'i') })) {
      throw ApiError.conflict('A department with this name already exists');
    }
  }

  const nextCode = code !== undefined ? (code ? String(code).trim().toUpperCase() : null) : department.code;
  if (nextCode !== department.code) {
    if (await Department.findOne({ code: nextCode })) {
      throw ApiError.conflict('That department code is already in use');
    }
  }

  if (head !== undefined && head && !(await User.exists({ _id: head }))) {
    throw ApiError.badRequest('Selected department head does not exist');
  }

  const oldName = department.name;
  if (name !== undefined) department.name = nextName;
  if (code !== undefined) department.code = nextCode;
  if (head !== undefined) department.head = head || null;
  if (description !== undefined) department.description = description;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();

  if (nextName !== oldName) {
    await User.updateMany({ department: oldName }, { $set: { department: nextName } });
  }

  await department.populate('head', BASIC_MANAGER_SELECT);

  const payload = department.toJSON();
  payload.head = payload.head ? fullNameOf(payload.head) : null;

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    department: payload,
  });
});

// DELETE /api/organization/departments/:id
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');

  await Promise.all([
    User.updateMany({ department: department.name }, { $set: { department: '' } }),
    Designation.updateMany({ department: department._id }, { $set: { department: null } }),
    Team.updateMany({ department: department._id }, { $set: { department: null } }),
  ]);
  await department.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Department deleted successfully',
  });
});

// POST /api/organization/departments/:id/employees
export const assignDepartmentEmployees = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');

  const ids = [...new Set(req.body.employeeIds.map((id) => id.toString()))];
  const result = await User.updateMany({ _id: { $in: ids } }, { $set: { department: department.name } });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} employee(s) assigned to ${department.name}`,
    affected: result.modifiedCount,
  });
});

// GET /api/organization/designations
export const listDesignations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) filter.title = new RegExp(escapeRegex(req.query.search.trim()), 'i');
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const [designations, counts] = await Promise.all([
    Designation.find(filter).sort('title').populate('department', 'name code'),
    User.aggregate([{ $group: { _id: '$designation', total: { $sum: 1 } } }]),
  ]);

  const totalByTitle = new Map(counts.map((c) => [c._id || '', c.total]));

  const list = designations.map((d) => {
    const doc = d.toObject();
    return { ...doc, employeeCount: totalByTitle.get(doc.title) || 0 };
  });

  res.status(200).json({ success: true, designations: list });
});

// GET /api/organization/designations/:id
export const getDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findById(req.params.id).populate('department', 'name code');
  if (!designation) throw ApiError.notFound('Designation not found');

  const employees = await User.find({ designation: designation.title })
    .select(`${BASIC_USER_SELECT} email`)
    .populate('manager', BASIC_USER_SELECT)
    .sort('firstName');

  res.status(200).json({ success: true, designation, employees });
});

// POST /api/organization/designations
export const createDesignation = asyncHandler(async (req, res) => {
  const { title, department, description } = req.body;

  if (await Designation.findOne({ title: new RegExp(`^${escapeRegex(title.trim())}$`, 'i') })) {
    throw ApiError.conflict('A designation with this title already exists');
  }
  if (department && !(await Department.exists({ _id: department }))) {
    throw ApiError.badRequest('Selected department does not exist');
  }

  const designation = await Designation.create({
    title: title.trim(),
    department: department || null,
    description: description || '',
  });
  await designation.populate('department', 'name code');

  res.status(201).json({
    success: true,
    message: 'Designation created successfully',
    designation,
  });
});

// PATCH /api/organization/designations/:id
export const updateDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findById(req.params.id);
  if (!designation) throw ApiError.notFound('Designation not found');

  const { title, department, description, isActive } = req.body;

  const nextTitle = title !== undefined ? String(title).trim() : designation.title;
  if (nextTitle && nextTitle.toLowerCase() !== designation.title.toLowerCase()) {
    if (await Designation.findOne({ title: new RegExp(`^${escapeRegex(nextTitle)}$`, 'i') })) {
      throw ApiError.conflict('A designation with this title already exists');
    }
  }

  if (department !== undefined && department && !(await Department.exists({ _id: department }))) {
    throw ApiError.badRequest('Selected department does not exist');
  }

  const oldTitle = designation.title;
  if (title !== undefined) designation.title = nextTitle;
  if (department !== undefined) designation.department = department || null;
  if (description !== undefined) designation.description = description;
  if (isActive !== undefined) designation.isActive = isActive;

  await designation.save();

  if (nextTitle !== oldTitle) {
    await User.updateMany({ designation: oldTitle }, { $set: { designation: nextTitle } });
  }

  await designation.populate('department', 'name code');

  res.status(200).json({
    success: true,
    message: 'Designation updated successfully',
    designation,
  });
});

// DELETE /api/organization/designations/:id
export const deleteDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findById(req.params.id);
  if (!designation) throw ApiError.notFound('Designation not found');

  await User.updateMany({ designation: designation.title }, { $set: { designation: '' } });
  await designation.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Designation deleted successfully',
  });
});

// POST /api/organization/designations/:id/employees
export const assignDesignationEmployees = asyncHandler(async (req, res) => {
  const designation = await Designation.findById(req.params.id);
  if (!designation) throw ApiError.notFound('Designation not found');

  const ids = [...new Set(req.body.employeeIds.map((id) => id.toString()))];
  const result = await User.updateMany(
    { _id: { $in: ids } },
    { $set: { designation: designation.title } }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} employee(s) assigned to ${designation.title}`,
    affected: result.modifiedCount,
  });
});

// GET /api/organization/teams
export const listTeams = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) filter.name = new RegExp(escapeRegex(req.query.search.trim()), 'i');
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const [teams, counts] = await Promise.all([
    Team.find(filter)
      .sort('name')
      .populate('department', 'name code')
      .populate('manager', BASIC_MANAGER_SELECT),
    User.aggregate([
      { $match: { isActive: true, manager: { $exists: true, $ne: null } } },
      { $group: { _id: '$manager', count: { $sum: 1 } } },
    ]),
  ]);

  const countByManager = new Map(counts.map((c) => [String(c._id), c.count]));

  const list = teams.map((team) => {
    const doc = team.toObject();
    return {
      ...doc,
      manager: doc.manager ? fullNameOf(doc.manager) : null,
      memberCount: team.manager ? countByManager.get(String(team.manager._id)) || 0 : 0,
    };
  });

  res.status(200).json({ success: true, teams: list });
});

// GET /api/organization/teams/:id
export const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('department', 'name code')
    .populate('manager', BASIC_MANAGER_SELECT);
  if (!team) throw ApiError.notFound('Team not found');

  const employees = team.manager
    ? await User.find({ manager: team.manager._id })
        .select(`${BASIC_USER_SELECT} email`)
        .sort('firstName')
    : [];

  res.status(200).json({ success: true, team: teamResponse(team), employees });
});

// POST /api/organization/teams
export const createTeam = asyncHandler(async (req, res) => {
  const { name, department, manager, description } = req.body;

  if (await Team.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') })) {
    throw ApiError.conflict('A team with this name already exists');
  }
  if (department && !(await Department.exists({ _id: department }))) {
    throw ApiError.badRequest('Selected department does not exist');
  }
  if (manager && !(await User.exists({ _id: manager }))) {
    throw ApiError.badRequest('Selected manager does not exist');
  }

  const team = await Team.create({
    name: name.trim(),
    department: department || null,
    manager: manager || null,
    description: description || '',
  });
  await team.populate('department', 'name code');
  await team.populate('manager', BASIC_MANAGER_SELECT);

  res.status(201).json({ success: true, message: 'Team created successfully', team: teamResponse(team) });
});

// PATCH /api/organization/teams/:id
export const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');

  const { name, department, manager, description, isActive } = req.body;

  const nextName = name !== undefined ? String(name).trim() : team.name;
  if (nextName && nextName.toLowerCase() !== team.name.toLowerCase()) {
    if (await Team.findOne({ name: new RegExp(`^${escapeRegex(nextName)}$`, 'i') })) {
      throw ApiError.conflict('A team with this name already exists');
    }
  }
  if (department !== undefined && department && !(await Department.exists({ _id: department }))) {
    throw ApiError.badRequest('Selected department does not exist');
  }
  if (manager !== undefined && manager && !(await User.exists({ _id: manager }))) {
    throw ApiError.badRequest('Selected manager does not exist');
  }

  if (name !== undefined) team.name = nextName;
  if (department !== undefined) team.department = department || null;
  if (manager !== undefined) team.manager = manager || null;
  if (description !== undefined) team.description = description;
  if (isActive !== undefined) team.isActive = isActive;

  await team.save();
  await team.populate('department', 'name code');
  await team.populate('manager', BASIC_MANAGER_SELECT);

  res.status(200).json({ success: true, message: 'Team updated successfully', team: teamResponse(team) });
});

// DELETE /api/organization/teams/:id
export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');

  await team.deleteOne();

  res.status(200).json({ success: true, message: 'Team deleted successfully' });
});

// GET /api/organization/locations
export const listLocations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: regex }, { city: regex }, { country: regex }];
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const [locations, counts] = await Promise.all([
    Location.find(filter).sort('name'),
    User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$workLocation', count: { $sum: 1 } } },
    ]),
  ]);

  const countByName = new Map(counts.map((c) => [c._id || '', c.count]));

  const list = locations.map((location) => {
    const doc = location.toObject();
    return { ...doc, employeeCount: countByName.get(doc.name) || 0 };
  });

  res.status(200).json({ success: true, locations: list });
});

// GET /api/organization/locations/:id
export const getLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) throw ApiError.notFound('Location not found');

  const employees = await User.find({ workLocation: location.name })
    .select(`${BASIC_USER_SELECT} email`)
    .sort('firstName');

  res.status(200).json({ success: true, location, employees });
});

// POST /api/organization/locations
export const createLocation = asyncHandler(async (req, res) => {
  const { name, type, address, city, state, country, pincode } = req.body;

  if (await Location.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') })) {
    throw ApiError.conflict('A location with this name already exists');
  }

  const location = await Location.create({
    name: name.trim(),
    type,
    address: address || '',
    city: city || '',
    state: state || '',
    country: country || '',
    pincode: pincode || '',
  });

  res.status(201).json({ success: true, message: 'Location created successfully', location });
});

// PATCH /api/organization/locations/:id
export const updateLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) throw ApiError.notFound('Location not found');

  const { name, type, address, city, state, country, pincode, isActive } = req.body;

  const nextName = name !== undefined ? String(name).trim() : location.name;
  if (nextName && nextName.toLowerCase() !== location.name.toLowerCase()) {
    if (await Location.findOne({ name: new RegExp(`^${escapeRegex(nextName)}$`, 'i') })) {
      throw ApiError.conflict('A location with this name already exists');
    }
  }

  const oldName = location.name;
  if (name !== undefined) location.name = nextName;
  if (type !== undefined) location.type = type;
  if (address !== undefined) location.address = address;
  if (city !== undefined) location.city = city;
  if (state !== undefined) location.state = state;
  if (country !== undefined) location.country = country;
  if (pincode !== undefined) location.pincode = pincode;
  if (isActive !== undefined) location.isActive = isActive;

  await location.save();

  if (nextName !== oldName) {
    await User.updateMany({ workLocation: oldName }, { $set: { workLocation: nextName } });
  }

  res.status(200).json({ success: true, message: 'Location updated successfully', location });
});

// DELETE /api/organization/locations/:id
export const deleteLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) throw ApiError.notFound('Location not found');

  await User.updateMany({ workLocation: location.name }, { $set: { workLocation: '' } });
  await location.deleteOne();

  res.status(200).json({ success: true, message: 'Location deleted successfully' });
});

const employeeNode = (employee) => ({
  id: `emp-${employee._id}`,
  type: 'employee',
  label: employee.fullName,
  subtitle: employee.designation || employee.employeeId || 'Employee',
  meta: {
    employeeId: employee.employeeId,
    designation: employee.designation,
    department: employee.department,
  },
  count: 0,
  children: [],
});

const managerNode = (manager, reports) => ({
  id: `mgr-${manager._id}`,
  type: 'manager',
  label: manager.fullName,
  subtitle: manager.designation || 'Manager',
  meta: { employeeId: manager.employeeId, designation: manager.designation },
  count: reports.length,
  children: reports.map(employeeNode),
});

// GET /api/organization/tree
export const getOrgTree = asyncHandler(async (_req, res) => {
  const company = await getSetting('company');
  const companyName = company.name || 'Office EMS';
  const BASIC = 'firstName lastName employeeId designation department role avatar';
  const [departments, teams, employees] = await Promise.all([
    Department.find({ isActive: true }).sort('name'),
    Team.find({ isActive: true }).populate('manager', BASIC).sort('name'),
    User.find({ isActive: true }).select(BASIC).sort('firstName'),
  ]);

  const managerIds = new Set();
  for (const employee of employees) {
    if (employee.manager) managerIds.add(String(employee.manager));
  }
  for (const department of departments) {
    if (department.head) managerIds.add(String(department.head));
  }

  const managerUsers = await User.find({ _id: { $in: [...managerIds] } }).select(BASIC);
  const managerMap = new Map(managerUsers.map((m) => [String(m._id), m]));

  const employeesByDept = new Map();
  for (const e of employees) {
    const key = e.department || '';
    if (!employeesByDept.has(key)) employeesByDept.set(key, []);
    employeesByDept.get(key).push(e);
  }

  const employeesByManager = new Map();
  for (const e of employees) {
    if (!e.manager) continue;
    const key = String(e.manager);
    if (!employeesByManager.has(key)) employeesByManager.set(key, []);
    employeesByManager.get(key).push(e);
  }

  const teamsByDept = new Map();
  for (const team of teams) {
    const key = team.department ? String(team.department) : 'none';
    if (!teamsByDept.has(key)) teamsByDept.set(key, []);
    teamsByDept.get(key).push(team);
  }

  const departmentNames = new Set(departments.map((d) => d.name));
  const rootChildren = [];

  for (const department of departments) {
    const deptChildren = [];
    const placedManagerIds = new Set();
    const deptEmployees = employeesByDept.get(department.name) || [];

    const deptTeams = teamsByDept.get(String(department._id)) || [];
    if (deptTeams.length > 0) {
      for (const team of deptTeams) {
        const teamChildren = [];
        if (team.manager) {
          placedManagerIds.add(String(team.manager._id));
          const reports = employeesByManager.get(String(team.manager._id)) || [];
          teamChildren.push(managerNode(team.manager, reports));
        } else {
          for (const e of deptEmployees) {
            if (!e.manager) teamChildren.push(employeeNode(e));
          }
        }
        deptChildren.push({
          id: `team-${team._id}`,
          type: 'team',
          label: team.name,
          subtitle: team.manager ? `Led by ${team.manager.fullName}` : 'No manager assigned',
          meta: { department: department.name },
          count: teamChildren.length,
          children: teamChildren,
        });
      }
    }

    const reportingManagerIds = deptEmployees
      .map((e) => e.manager)
      .filter(Boolean)
      .map((id) => String(id));
    const managerCandidates = new Set([
      ...reportingManagerIds,
      ...(department.head ? [String(department.head)] : []),
    ]);

    for (const managerId of managerCandidates) {
      if (placedManagerIds.has(managerId)) continue;
      const manager = managerMap.get(managerId);
      if (!manager) continue;
      placedManagerIds.add(managerId);
      const reports = employeesByManager.get(managerId) || [];
      deptChildren.push(managerNode(manager, reports));
    }

    for (const e of deptEmployees) {
      if (!e.manager) deptChildren.push(employeeNode(e));
    }

    const head = department.head ? managerMap.get(String(department.head)) : undefined;
    rootChildren.push({
      id: `dept-${department._id}`,
      type: 'department',
      label: department.name,
      subtitle: head ? `Head: ${head.fullName}` : 'No head assigned',
      meta: { code: department.code || '' },
      count: deptEmployees.length,
      children: deptChildren,
    });
  }

  const unassigned = employees.filter((e) => e.department && !departmentNames.has(e.department));
  if (unassigned.length > 0) {
    const unassignedChildren = [];
    const unassignManagerIds = new Set(unassigned.map((e) => e.manager).filter(Boolean));
    for (const e of unassigned) {
      if (!e.manager) unassignedChildren.push(employeeNode(e));
    }
    for (const managerId of unassignManagerIds) {
      const manager = managerMap.get(String(managerId));
      if (!manager) continue;
      const reports = unassigned.filter((e) => String(e.manager) === String(managerId));
      unassignedChildren.push(managerNode(manager, reports));
    }
    rootChildren.push({
      id: 'dept-unassigned',
      type: 'department',
      label: 'Unassigned',
      subtitle: 'Employees without a mapped department',
      meta: { code: '' },
      count: unassigned.length,
      children: unassignedChildren,
    });
  }

  res.status(200).json({
    success: true,
    tree: [
      {
        id: 'company',
        type: 'company',
        label: companyName,
        subtitle: 'Organization',
        meta: { employeeCount: employees.length },
        count: employees.length,
        children: rootChildren,
      },
    ],
  });
});

// GET /api/organization/managers
export const listOrgManagers = asyncHandler(async (_req, res) => {
  const grouped = await User.aggregate([
    { $match: { isActive: true, manager: { $exists: true, $ne: null } } },
    { $group: { _id: '$manager', count: { $sum: 1 } } },
  ]);

  const managerIds = grouped.map((g) => g._id);
  const users = await User.find({
    $or: [{ _id: { $in: managerIds } }, { role: ROLES.MANAGER }],
    isActive: true,
  })
    .select(BASIC_USER_SELECT)
    .sort('firstName');

  const countById = new Map(grouped.map((g) => [String(g._id), g.count]));

  const managers = users
    .map((u) => {
      const doc = u.toJSON();
      return { ...doc, reportCount: countById.get(String(u._id)) || 0 };
    })
    .sort((a, b) => b.reportCount - a.reportCount || a.firstName.localeCompare(b.firstName));

  const totalReports = grouped.reduce((sum, g) => sum + g.count, 0);

  res.status(200).json({ success: true, managers, totalReports });
});

// GET /api/organization/employment-types
export const getEmploymentTypes = asyncHandler(async (_req, res) => {
  const grouped = await User.aggregate([
    { $match: { isActive: true, employmentType: { $exists: true, $ne: '' } } },
    { $group: { _id: '$employmentType', count: { $sum: 1 } } },
  ]);

  const countByType = new Map(grouped.map((g) => [g._id, g.count]));
  const total = await User.countDocuments({ isActive: true });

  const types = EMPLOYMENT_TYPES.map((type) => ({ type, count: countByType.get(type) || 0 }));

  res.status(200).json({ success: true, types, total });
});