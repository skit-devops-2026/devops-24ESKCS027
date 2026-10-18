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

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    }).on('error', reject);
  });
}

test('GET /api/events returns event list', async () => {
  const res = await get('/api/events');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body), 'Response should be an array of events');
});

test('GET /api/hosts returns hosts list', async () => {
  const res = await get('/api/hosts');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.hosts), 'Hosts should be an array');
  assert.ok(res.body.count > 0, 'Hosts count should be greater than 0');
});

test('GET /api/notifications returns notifications array', async () => {
  const res = await get('/api/notifications');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body), 'Notifications should be an array');
});

test('GET /api/nonexistent-endpoint returns 404 JSON', async () => {
  const res = await get('/api/nonexistent-endpoint');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('API endpoint not found'));
});
