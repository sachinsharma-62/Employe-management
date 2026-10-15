import fetch from 'node-fetch';

const base = 'http://localhost:5000/api';

async function run() {
  console.log('Testing Multiple Clock In / Clock Out against running server...');

  // 1. Login as employee or admin
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'employee@office.com', password: 'Employee@123' }),
  });
  
  const cookieHeader = loginRes.headers.get('set-cookie') || '';
  console.log('Login status:', loginRes.status);

  const headers = {
    'Content-Type': 'application/json',
    cookie: cookieHeader,
  };

  // 2. Fetch current status
  let meRes = await fetch(`${base}/attendance/me`, { headers });
  let meData = await meRes.json();
  console.log('Initial today info:', {
    canCheckIn: meData.today?.canCheckIn,
    canCheckOut: meData.today?.canCheckOut,
    sessionCount: meData.today?.record?.sessionCount,
    workedMinutes: meData.today?.record?.workedMinutes,
  });

  // If currently checked in, clock out first
  if (meData.today?.canCheckOut) {
    console.log('Clocking out active session...');
    await fetch(`${base}/attendance/check-out`, { method: 'POST', headers, body: JSON.stringify({ note: 'cleanup' }) });
  }

  // 3. First Clock-in
  console.log('\n--- Cycle 1: Clock In ---');
  let in1 = await fetch(`${base}/attendance/check-in`, { method: 'POST', headers, body: JSON.stringify({ mode: 'OFFICE' }) });
  let in1Data = await in1.json();
  console.log('Clock In 1 status:', in1.status, in1Data.message || in1Data);

  // 4. First Clock-out
  console.log('\n--- Cycle 1: Clock Out ---');
  let out1 = await fetch(`${base}/attendance/check-out`, { method: 'POST', headers, body: JSON.stringify({ note: 'Lunch break' }) });
  let out1Data = await out1.json();
  console.log('Clock Out 1 status:', out1.status, out1Data.message || out1Data);

  // 5. Second Clock-in (Multi clock in!)
  console.log('\n--- Cycle 2: Return from break & Clock In again ---');
  let in2 = await fetch(`${base}/attendance/check-in`, { method: 'POST', headers, body: JSON.stringify({ mode: 'OFFICE' }) });
  let in2Data = await in2.json();
  console.log('Clock In 2 status:', in2.status, in2Data.message || in2Data);

  // 6. Second Clock-out
  console.log('\n--- Cycle 2: Clock Out ---');
  let out2 = await fetch(`${base}/attendance/check-out`, { method: 'POST', headers, body: JSON.stringify({ note: 'End of session 2' }) });
  let out2Data = await out2.json();
  console.log('Clock Out 2 status:', out2.status, out2Data.message || out2Data);

  // 7. Verify final daily totals
  meRes = await fetch(`${base}/attendance/me`, { headers });
  meData = await meRes.json();
  console.log('\n--- Final Today Record ---');
  console.log({
    canCheckIn: meData.today?.canCheckIn,
    canCheckOut: meData.today?.canCheckOut,
    sessions: meData.today?.record?.sessions,
    sessionCount: meData.today?.record?.sessionCount,
    workedMinutes: meData.today?.record?.workedMinutes,
    hoursWorked: meData.today?.record?.hoursWorked,
  });

  if (in2.status === 201 && out2.status === 200) {
    console.log('\nSUCCESS: Multiple Clock In / Clock Out works perfectly!');
  } else {
    console.error('\nFAILED: Multi clock in check failed');
  }
}

run().catch((err) => console.error(err));
