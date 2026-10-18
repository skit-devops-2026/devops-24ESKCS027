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

test('GET /health returns 200 with ok status, commit sha, and uptime', async () => {
  const res = await get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
  assert.strictEqual(res.body.service, 'eventhive');
  assert.ok(res.body.commit, 'Commit SHA must be present');
  assert.ok(typeof res.body.uptime === 'number', 'Uptime must be a number');
  assert.ok(res.body.timestamp, 'Timestamp must be present');
});

test('GET /api/health returns 200 with online status and platform diagnostics', async () => {
  const res = await get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'online');
  assert.strictEqual(res.body.service, 'EventHive One-College Event Management Platform');
  assert.ok(res.body.roles, 'Role mappings must be documented');
  assert.ok(res.body.counts, 'System counts must be present');
  assert.ok(typeof res.body.counts.events === 'number', 'Event count must be reported');
});