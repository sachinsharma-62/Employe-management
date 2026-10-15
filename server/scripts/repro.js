import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri('office_management');
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: User } = await import('../src/models/User.js');

await connectDB();
await User.create({ firstName: 'Super', lastName: 'Admin', email: 'admin@test.com', password: 'Super@1234', role: 'SUPER_ADMIN' });

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;

const login = await fetch(`${base}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@test.com', password: 'Super@1234' }),
});
const jar = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

const formFields = {
  firstName: 'Priya', lastName: 'Nair', gender: 'female', dateOfBirth: '', bloodGroup: 'O+',
  email: 'priya@test.com', personalEmail: '', phone: '', alternatePhone: '', address: '',
  city: '', state: '', country: '', pincode: '', employeeId: '', joiningDate: '2024-01-01',
  department: '', designation: '', manager: '', employmentType: 'FULL_TIME', workLocation: '',
  role: 'EMPLOYEE', isActive: 'true', emergencyContactName: '', emergencyContactRelationship: '',
  emergencyContactPhone: '', emergencyContactEmail: '', emergencyContactAddress: '',
};

const attempt = async (label, { duplicateRole, email }) => {
  const form = new FormData();
  Object.entries({ ...formFields, email }).forEach(([k, v]) => form.append(k, v));
  if (duplicateRole) form.append('role', 'EMPLOYEE');
  const res = await fetch(`${base}/employees`, { method: 'POST', headers: { cookie: jar }, body: form });
  const data = await res.json().catch(() => null);
  console.log(`${label}: ${res.status}`, JSON.stringify(data?.errors || data?.message || data?.employee?.employeeId));
};

await attempt('single role (client normal)', { duplicateRole: false, email: 'one@test.com' });
await attempt('duplicate role (client super admin)', { duplicateRole: true, email: 'two@test.com' });

server.close();
await User.deleteMany({});
await mongod.stop();
process.exit(0);
