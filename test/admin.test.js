const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

test('GET / redirects to /admin/dashboard', async () => {
  const port = server.address().port;
  const res = await request({
    hostname: '127.0.0.1',
    port,
    path: '/',
    method: 'GET',
    headers: { Accept: 'text/html' },
  });
  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/admin/dashboard');
});

test('GET /admin/dashboard without auth redirects to /admin/login', async () => {
  const port = server.address().port;
  const res = await request({
    hostname: '127.0.0.1',
    port,
    path: '/admin/dashboard',
    method: 'GET',
  });
  assert.strictEqual(res.statusCode, 302);
  assert.ok(res.headers.location.includes('/admin/login'));
});

test('GET /admin/login returns 200 and renders login HTML page', async () => {
  const port = server.address().port;
  const res = await request({
    hostname: '127.0.0.1',
    port,
    path: '/admin/login',
    method: 'GET',
  });
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.includes('Sign in to your account') || res.body.includes('admin') || res.body.includes('Admin'));
});


test('POST /admin/login with correct credentials sets signed session cookie', async () => {
  const port = server.address().port;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  assert.ok(adminEmail, 'ADMIN_EMAIL must be configured in .env');
  assert.ok(adminPassword, 'ADMIN_PASSWORD must be configured in .env');
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be configured in .env');

  const postData = new URLSearchParams({
    email: adminEmail,
    password: adminPassword,
  }).toString();

  const res = await request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    },
    postData
  );

  assert.strictEqual(res.statusCode, 302);
  assert.strictEqual(res.headers.location, '/admin/dashboard');

  const cookieHeader = res.headers['set-cookie'];
  assert.ok(cookieHeader, 'Set-Cookie header must be present');

  const sessionCookie = cookieHeader.find((cookie) =>
    cookie.startsWith('eh_admin_session=')
  );

  assert.ok(sessionCookie, 'Admin session cookie must be set');
  assert.ok(
    !sessionCookie.includes('authenticated_admin_session_token'),
    'Session must not use the old fixed token'
  );
  assert.ok(
    sessionCookie.includes('HttpOnly'),
    'Session cookie must be HttpOnly'
  );
});

test('POST /admin/login with wrong password returns 401', async () => {
  const port = server.address().port;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) return; // Skip if not configured

  const postData = new URLSearchParams({
    email: adminEmail,
    password: 'wrong-password-that-does-not-match',
  }).toString();

  const res = await request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    },
    postData
  );

  assert.strictEqual(res.statusCode, 401);
  assert.ok(res.body.includes('Invalid'), 'Should indicate invalid credentials');
});

test('Old fixed session token is rejected by /admin/dashboard', async () => {
  const port = server.address().port;
  const res = await request({
    hostname: '127.0.0.1',
    port,
    path: '/admin/dashboard',
    method: 'GET',
    headers: {
      Cookie: 'eh_admin_session=authenticated_admin_session_token',
    },
  });

  // Should redirect to login (302) or return 503 if not configured
  assert.ok(
    res.statusCode === 302 || res.statusCode === 503,
    `Old fixed token must be rejected (got ${res.statusCode})`
  );

  if (res.statusCode === 302) {
    assert.ok(
      res.headers.location.includes('/admin/login'),
      'Must redirect to login page'
    );
  }
});

test('POST /admin/login with empty body returns 400', async () => {
  const port = server.address().port;
  const postData = '';

  const res = await request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    },
    postData
  );

  // Should return 400 or 503 depending on env configuration
  assert.ok(
    res.statusCode === 400 || res.statusCode === 503,
    `Empty body should be rejected (got ${res.statusCode})`
  );
});