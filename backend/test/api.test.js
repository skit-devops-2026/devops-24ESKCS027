const assert = require('assert');
const http = require('http');
const app = require('../server');

const PORT = 5097;
let server;
let alexToken;
let sarahToken;
let newRegisteredToken;
let testEventId;

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: body, jsonError: e.message });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function runRegistrationAndFullSuite() {
  console.log('================================================================');
  console.log('🧪 EVENTHIVE ORGANIZER MODULE & REGISTRATION DEEP TEST SUITE');
  console.log('================================================================\n');
  process.env.NODE_ENV = 'test';

  server = app.listen(PORT);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED');
      console.error('   Error:', err.message);
      failed++;
    }
  }

  try {
    // 1. Health check
    await test('Server Health Check (GET /api/health)', async () => {
      const res = await request('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'online');
    });

    // 2. Registration - Successful new organizer
    await test('Registration: Successful New Organizer (POST /api/auth/register-organizer)', async () => {
      const uniqueEmail = `test.organizer.${Date.now()}@eventhive.com`;
      const res = await request('POST', '/api/auth/register-organizer', {
        name: 'Jordan Miller',
        email: uniqueEmail,
        password: 'password123',
        organization: 'Robotics & AI Chapter',
        phone: '+1 (555) 345-6789',
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.name, 'Jordan Miller');
      assert.strictEqual(res.body.user.email, uniqueEmail);
      assert.strictEqual(res.body.user.role, 'organizer');
      newRegisteredToken = res.body.token;
    });

    // 3. Registration - Duplicate email rejection
    await test('Registration: Duplicate Email Rejection (400 Bad Request)', async () => {
      const res = await request('POST', '/api/auth/register-organizer', {
        name: 'Alex Rivera Duplicate',
        email: 'alex.organizer@eventhive.com',
        password: 'password123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('already exists'));
    });

    // 4. Registration - Missing name rejection
    await test('Registration: Missing Name Rejection (400 Bad Request)', async () => {
      const res = await request('POST', '/api/auth/register-organizer', {
        name: '',
        email: 'noname@eventhive.com',
        password: 'password123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('name is required'));
    });

    // 5. Registration - Missing email rejection
    await test('Registration: Missing Email Rejection (400 Bad Request)', async () => {
      const res = await request('POST', '/api/auth/register-organizer', {
        name: 'No Email Host',
        email: '',
        password: 'password123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    // 6. Registration - Invalid email format rejection
    await test('Registration: Invalid Email Format (400 Bad Request)', async () => {
      const res = await request('POST', '/api/auth/register-organizer', {
        name: 'Invalid Email Host',
        email: 'notanemailaddress',
        password: 'password123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('valid email'));
    });

    // 7. Registration - Password too short (<6 chars)
    await test('Registration: Short Password (<6 chars) Rejection (400 Bad Request)', async () => {
      const res = await request('POST', '/api/auth/register-organizer', {
        name: 'Short Pass Host',
        email: 'shortpass@eventhive.com',
        password: '123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('at least 6 characters'));
    });

    // 8. Standard Login
    await test('Organizer Standard Login (POST /api/auth/login)', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'alex.organizer@eventhive.com',
        password: 'organizer123',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'organizer');
      alexToken = res.body.token;
    });

    // 9. Login: Invalid Password Rejection
    await test('Login: Invalid Password Rejection (401 Unauthorized)', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'alex.organizer@eventhive.com',
        password: 'incorrectpassword',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    // 10. Demo Login Switcher
    await test('Demo Login Switcher (POST /api/auth/demo-organizer)', async () => {
      const res = await request('POST', '/api/auth/demo-organizer', {
        email: 'sarah.organizer@eventhive.com',
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.name, 'Sarah Chen');
      sarahToken = res.body.token;
    });

    // 11. Auth Protection: Missing Token
    await test('Auth Protection: Missing Token Rejection (401 Unauthorized)', async () => {
      const res = await request('GET', '/api/organizer/dashboard/stats');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    // 12. Dashboard Statistics
    await test('Organizer Dashboard Statistics (GET /api/organizer/dashboard/stats)', async () => {
      const res = await request('GET', '/api/organizer/dashboard/stats', null, alexToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(typeof res.body.data.totalEvents === 'number');
      assert.ok(typeof res.body.data.totalRegistrations === 'number');
    });

    // 13. Create Event
    await test('Create Event (POST /api/organizer/events)', async () => {
      const payload = {
        title: 'Quantum & AI Distributed Summit 2026',
        description: 'Comprehensive summit on quantum algorithms and distributed systems.',
        category: 'Tech & Coding',
        date: '2026-11-20',
        startTime: '10:00',
        endTime: '17:00',
        venue: 'Grand Tech Auditorium',
        locationType: 'In-Person',
        maxCapacity: 300,
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop',
        registrationDeadline: '2026-11-15T23:59',
        contactEmail: 'alex.organizer@eventhive.com',
        contactPhone: '+1 (555) 234-5678',
        status: 'Published',
        tags: ['Quantum', 'AI', 'Distributed'],
        price: 0,
      };

      const res = await request('POST', '/api/organizer/events', payload, alexToken);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      testEventId = res.body.data._id;
    });

    // 14. List Events
    await test('List Organizer Events (GET /api/organizer/events)', async () => {
      const res = await request('GET', '/api/organizer/events?status=All', null, alexToken);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });

    // 15. View Event Details
    await test('View Event Details (GET /api/organizer/events/:id)', async () => {
      const res = await request('GET', `/api/organizer/events/${testEventId}`, null, alexToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data._id, testEventId);
    });

    // 16. Edit Event
    await test('Edit Event (PUT /api/organizer/events/:id)', async () => {
      const res = await request(
        'PUT',
        `/api/organizer/events/${testEventId}`,
        { title: 'Quantum & AI Distributed Summit 2026 - Extended' },
        alexToken
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.title, 'Quantum & AI Distributed Summit 2026 - Extended');
    });

    // 17. Change Status
    await test('Change Event Status (PATCH /api/organizer/events/:id/status)', async () => {
      const res = await request(
        'PATCH',
        `/api/organizer/events/${testEventId}/status`,
        { status: 'Ongoing' },
        alexToken
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'Ongoing');
    });

    // 18. Registrations Roster
    await test('Event Registrations Roster (GET /api/organizer/events/evt_101/registrations)', async () => {
      const res = await request('GET', '/api/organizer/events/evt_101/registrations', null, alexToken);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.length > 0);
    });

    // 19. Mark Attendee Status
    await test('Mark Attendee Status (PATCH /api/organizer/events/evt_101/registrations/reg_001)', async () => {
      const res = await request(
        'PATCH',
        '/api/organizer/events/evt_101/registrations/reg_001',
        { status: 'Attended' },
        alexToken
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'Attended');
    });

    // 20. Profile View & Update
    await test('Profile View & Update (GET & PUT /api/organizer/profile)', async () => {
      const res = await request(
        'PUT',
        '/api/organizer/profile',
        { organization: 'Global Innovation Leaders' },
        alexToken
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.organization, 'Global Innovation Leaders');
    });

    // 21. Ownership Boundary Protection
    await test('Ownership Isolation (403 Forbidden)', async () => {
      const res = await request('GET', `/api/organizer/events/${testEventId}`, null, sarahToken);
      assert.strictEqual(res.status, 403);
    });

    // 22. Delete Event
    await test('Delete Event (DELETE /api/organizer/events/:id)', async () => {
      const res = await request('DELETE', `/api/organizer/events/${testEventId}`, null, alexToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    console.log('\n================================================================');
    console.log(`📊 FINAL TEST RESULTS: ${passed} Passed, ${failed} Failed out of ${passed + failed} tests`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (globalErr) {
    console.error('Fatal Test Error:', globalErr);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runRegistrationAndFullSuite();
