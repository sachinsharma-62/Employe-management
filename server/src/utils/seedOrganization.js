import User from '../models/User.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import Team from '../models/Team.js';
import Location from '../models/Location.js';

const DEPARTMENT_CODES = {
  Engineering: 'ENG',
  Sales: 'SAL',
  Marketing: 'MKT',
  Operations: 'OPS',
  Finance: 'FIN',
  'Human Resources': 'HR',
  'Customer Success': 'CS',
  Design: 'DES',
};

const DESIGNATION_EXTRAS = [
  { title: 'Chief Executive Officer', department: 'Engineering' },
  { title: 'Chief Financial Officer', department: 'Finance' },
  { title: 'Product Manager', department: 'Engineering' },
];

const LOCATION_DATA = [
  {
    name: 'Head Office',
    type: 'HEAD_OFFICE',
    address: '42 Tech Park Avenue',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
  },
  {
    name: 'Branch Office',
    type: 'BRANCH',
    address: '8 Central Mall Road',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
  },
  {
    name: 'Remote',
    type: 'REMOTE',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  },
];

const seedOrganization = async () => {
  const users = await User.find({}).sort('createdAt');
  if (users.length === 0) return { departments: 0, designations: 0, teams: 0, locations: 0 };

  await Promise.all([
    Department.deleteMany({}),
    Designation.deleteMany({}),
    Team.deleteMany({}),
    Location.deleteMany({}),
  ]);

  const departments = [];
  for (const [name, code] of Object.entries(DEPARTMENT_CODES)) {
    const head =
      users.find(
        (u) => u.department === name && ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(u.role)
      ) || users.find((u) => u.department === name);
    departments.push(
      await Department.create({
        name,
        code,
        head: head?._id || null,
        description: `${name} department`,
      })
    );
  }

  const deptByName = new Map(departments.map((d) => [d.name, d]));
  const usedPairs = new Set();

  for (const user of users) {
    if (!user.department || !user.designation) continue;
    const key = `${user.department}|${user.designation}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    const mappedId = deptByName.get(user.department)?._id || null;
    await Designation.create({
      title: user.designation,
      department: mappedId,
      description: `${user.designation} role in ${user.department}`,
    });
  }

  for (const extra of DESIGNATION_EXTRAS) {
    const mappedId = deptByName.get(extra.department)?._id || null;
    if (!(await Designation.exists({ title: extra.title }))) {
      await Designation.create({
        title: extra.title,
        department: mappedId,
        description: `${extra.title} role`,
      });
    }
  }

  const managers = users.filter((u) => u.role === 'MANAGER');
  for (let i = 0; i < managers.length; i += 1) {
    const manager = managers[i];
    const dept = deptByName.get(manager.department);
    const suffix = managers.length > 1 ? ` ${i + 1}` : '';
    await Team.create({
      name: `${manager.department || 'Core'} Team${suffix}`,
      department: dept?._id || null,
      manager: manager._id,
      description: `Team led by ${manager.fullName}`,
    });
  }

  const locations = await Location.insertMany(
    LOCATION_DATA.map((l) => ({ ...l, isActive: true }))
  );

  const designationCount = await Designation.countDocuments({});
  const teamCount = await Team.countDocuments({});

  return {
    departments: departments.length,
    designations: designationCount,
    teams: teamCount,
    locations: locations.length,
  };
};

export default seedOrganization;