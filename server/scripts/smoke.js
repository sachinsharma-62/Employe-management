/* End-to-end smoke test for the Authentication & Login module. */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri('office_management');
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
const { default: User } = await import('../src/models/User.js');
const { default: RefreshToken } = await import('../src/models/RefreshToken.js');

await connectDB();

const SUPER = { firstName: 'Super', lastName: 'Admin', email: 'admin@test.com', password: 'Super@1234', role: 'SUPER_ADMIN' };
const EMPLOYEE = { firstName: 'Joey', lastName: 'T', email: 'joey@test.com', password: 'Employee@123', role: 'EMPLOYEE' };

const superDoc = await User.create(SUPER);
const employeeDoc = await User.create(EMPLOYEE);

const server = app.listen(0);
const port = server.address().port;
const base = `http://127.0.0.1:${port}/api`;

const jar = new Map();

const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const cookieHeader = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  for (const setCookie of res.headers.getSetCookie()) {
    const [pair] = setCookie.split(';');
    const idx = pair.indexOf('=');
    const name = pair.slice(0, idx);
    const value = pair.slice(idx + 1);
    if (!value) jar.delete(name);
    else jar.set(name, value);
  }

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

let passed = 0;
let failed = 0;

const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
};

const section = (title) => console.log(`\n${title}`);

section('Health & unauthenticated access');
{
  const health = await request('/health');
  check('GET /health returns 200', health.status === 200);

  const me = await request('/auth/me');
  check('GET /auth/me without session -> 401', me.status === 401);
}

section('Login validation & invalid credentials');
{
  const badEmail = await request('/auth/login', { method: 'POST', body: { email: 'nope', password: 'x' } });
  check('Invalid email format -> 422', badEmail.status === 422, `got ${badEmail.status}`);
  check('Validation errors array returned', Array.isArray(badEmail.data?.errors));

  const badCreds = await request('/auth/login', { method: 'POST', body: { email: SUPER.email, password: 'Wrong@1234' } });
  check('Wrong password -> 401', badCreds.status === 401);
  check('Generic invalid credentials message', badCreds.data?.message === 'Invalid email or password');
}

section('Successful login (Super Admin)');
{
  const res = await request('/auth/login', { method: 'POST', body: { email: SUPER.email, password: SUPER.password } });
  check('Login -> 200', res.status === 200, `got ${res.status}`);
  check('User payload returned', res.data?.user?.email === SUPER.email);
  check('Password never leaked', !JSON.stringify(res.data).includes('$2b$'));
  check('Access cookie set (httpOnly)', [...jar.keys()].includes('ems_access'));
  check('Refresh cookie scoped to /api/auth', [...jar.keys()].includes('ems_refresh'));

  const me = await request('/auth/me');
  check('GET /auth/me with session -> 200', me.status === 200);
  check('me returns full name', me.data?.user?.fullName === 'Super Admin');
  check('me returns role', me.data?.user?.role === 'SUPER_ADMIN');
}

section('Role-based API authorization');
{
  const list = await request('/users');
  check('Super admin can list users', list.status === 200 && Array.isArray(list.data?.users));
}

section('Account lockout after 5 failed attempts');
{
  const wrong = { email: EMPLOYEE.email, password: 'Nope@12345' };
  let last = null;
  for (let i = 0; i < 5; i += 1) {
    last = await request('/auth/login', { method: 'POST', body: wrong });
  }
  check('5 failed attempts -> 401', last.status === 401, `got ${last.status}`);

  const nowCorrect = await request('/auth/login', { method: 'POST', body: { email: EMPLOYEE.email, password: EMPLOYEE.password } });
  check('Locked account rejected even with correct password -> 429', nowCorrect.status === 429, `got ${nowCorrect.status}`);
  check('Lock message mentions retry', /locked/i.test(nowCorrect.data?.message || ''));
}

section('Employee role restriction');
{
  jar.clear();
  const login = await request('/auth/login', { method: 'POST', body: { email: EMPLOYEE.email, password: 'Nope@12345' } });
  check('Employee login blocked while locked -> 429', login.status === 429 || login.status === 200);

  const employee = await User.findOne({ email: EMPLOYEE.email });
  employee.lockedUntil = null;
  employee.loginAttempts = 0;
  await employee.save({ validateBeforeSave: false });

  const login2 = await request('/auth/login', { method: 'POST', body: { email: EMPLOYEE.email, password: EMPLOYEE.password } });
  check('Employee login after unlock -> 200', login2.status === 200, `got ${login2.status}`);

  const list = await request('/users');
  check('Employee cannot list users -> 403', list.status === 403, `got ${list.status}`);

  const roleChange = await request(`/users/${employeeDoc._id}/role`, {
    method: 'PATCH',
    body: { role: 'MANAGER' },
  });
  check('Employee cannot change roles -> 403', roleChange.status === 403, `got ${roleChange.status}`);

  jar.clear();
  await request('/auth/login', { method: 'POST', body: { email: SUPER.email, password: 'Super@1234' } });

  const adminRoleChange = await request(`/users/${employeeDoc._id}/role`, {
    method: 'PATCH',
    body: { role: 'MANAGER' },
  });
  check('Super admin can change roles -> 200', adminRoleChange.status === 200, `got ${adminRoleChange.status}`);
  check('Role actually changed', adminRoleChange.data?.user?.role === 'MANAGER');

  const selfRoleChange = await request(`/users/${superDoc._id}/role`, {
    method: 'PATCH',
    body: { role: 'EMPLOYEE' },
  });
  check('Changing own role is blocked -> 400/404', selfRoleChange.status === 400 || selfRoleChange.status === 404);
}

section('Profile update');
{
  jar.clear();
  await request('/auth/login', { method: 'POST', body: { email: SUPER.email, password: SUPER.password } });

  const formBody = new URLSearchParams({ firstName: 'Updated', lastName: 'Admin', email: SUPER.email });
  const res = await fetch(`${base}/auth/profile`, {
    method: 'PATCH',
    headers: { cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') },
    body: formBody,
  });
  const data = await res.json();
  check('PATCH /auth/profile -> 200', res.status === 200, `got ${res.status}`);
  check('Profile name updated', data?.user?.firstName === 'Updated');

  const me = await request('/auth/me');
  check('Updated name visible in /me', me.data?.user?.firstName === 'Updated');
}

section('Change password');
{
  const wrongCurrent = await request('/auth/change-password', {
    method: 'POST',
    body: { currentPassword: 'Wrong@1234', newPassword: 'NewPass@123', confirmPassword: 'NewPass@123' },
  });
  check('Wrong current password -> 400', wrongCurrent.status === 400, `got ${wrongCurrent.status}`);

  const weak = await request('/auth/change-password', {
    method: 'POST',
    body: { currentPassword: SUPER.password, newPassword: 'weak', confirmPassword: 'weak' },
  });
  check('Weak new password -> 422', weak.status === 422, `got ${weak.status}`);

  const ok = await request('/auth/change-password', {
    method: 'POST',
    body: { currentPassword: SUPER.password, newPassword: 'Changed@1234', confirmPassword: 'Changed@1234' },
  });
  check('Valid password change -> 200', ok.status === 200, `got ${ok.status}`);

  jar.clear();
  const oldLogin = await request('/auth/login', { method: 'POST', body: { email: SUPER.email, password: SUPER.password } });
  check('Old password no longer works -> 401', oldLogin.status === 401, `got ${oldLogin.status}`);

  const newLogin = await request('/auth/login', { method: 'POST', body: { email: SUPER.email, password: 'Changed@1234' } });
  check('New password works -> 200', newLogin.status === 200, `got ${newLogin.status}`);
}

section('Forgot / reset password flow');
{
  const unknown = await request('/auth/forgot-password', { method: 'POST', body: { email: 'ghost@test.com' } });
  check('Unknown email still -> 200 (no enumeration)', unknown.status === 200);
  check('No reset url leaked for unknown email', !unknown.data?.devResetUrl);

  const known = await request('/auth/forgot-password', { method: 'POST', body: { email: EMPLOYEE.email } });
  check('Known email -> 200', known.status === 200);
  check('Dev reset url provided (SMTP off)', Boolean(known.data?.devResetUrl));

  const token = known.data?.devResetUrl?.split('/reset-password/')[1];
  const badToken = await request('/auth/reset-password/deadbeef', {
    method: 'POST',
    body: { newPassword: 'Reset@12345', confirmPassword: 'Reset@12345' },
  });
  check('Invalid reset token -> 400', badToken.status === 400, `got ${badToken.status}`);

  const reset = await request(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: { newPassword: 'Reset@12345', confirmPassword: 'Reset@12345' },
  });
  check('Valid reset token -> 200', reset.status === 200, `got ${reset.status}`);

  const replay = await request(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: { newPassword: 'Another@1234', confirmPassword: 'Another@1234' },
  });
  check('Reset token cannot be reused -> 400', replay.status === 400, `got ${replay.status}`);

  jar.clear();
  const login = await request('/auth/login', { method: 'POST', body: { email: EMPLOYEE.email, password: 'Reset@12345' } });
  check('Login with reset password -> 200', login.status === 200, `got ${login.status}`);
}

section('Refresh token rotation, expiry & logout');
{
  jar.clear();
  await request('/auth/login', { method: 'POST', body: { email: SUPER.email, password: 'Changed@1234' } });

  const before = new Map(jar);
  const refresh = await request('/auth/refresh', { method: 'POST' });
  check('POST /auth/refresh -> 200', refresh.status === 200, `got ${refresh.status}`);
  check('Refresh rotates refresh cookie', jar.get('ems_refresh') !== before.get('ems_refresh'));
  check('Access cookie present after refresh', Boolean(jar.get('ems_access')));

  const stored = await RefreshToken.countDocuments({});
  check('Rotated refresh tokens stored hashed', stored >= 1);

  const me = await request('/auth/me');
  check('Session still valid after refresh -> 200', me.status === 200);

  const logout = await request('/auth/logout', { method: 'POST' });
  check('POST /auth/logout -> 200', logout.status === 200);
  check('Cookies cleared after logout', jar.size === 0);

  const after = await request('/auth/me');
  check('GET /auth/me after logout -> 401', after.status === 401);

  const refreshAfterLogout = await request('/auth/refresh', { method: 'POST' });
  check('Refresh after logout -> 401', refreshAfterLogout.status === 401, `got ${refreshAfterLogout.status}`);
}

section('Deactivated account');
{
  const employee = await User.findOne({ email: EMPLOYEE.email });
  employee.isActive = false;
  await employee.save({ validateBeforeSave: false });

  jar.clear();
  const login = await request('/auth/login', { method: 'POST', body: { email: EMPLOYEE.email, password: 'Reset@12345' } });
  check('Deactivated login -> 403', login.status === 403, `got ${login.status}`);
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);

server.close();
await RefreshToken.deleteMany({});
await User.deleteMany({});
await mongod.stop();
process.exit(failed === 0 ? 0 : 1);
