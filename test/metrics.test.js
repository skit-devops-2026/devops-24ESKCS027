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
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

test('GET /metrics returns 200 with Prometheus text format', async () => {
  const res = await get('/metrics');
  assert.strictEqual(res.status, 200);
  assert.ok(
    res.headers['content-type'].includes('text/plain'),
    'Content-Type should be text/plain'
  );
  assert.ok(res.body.includes('eventhive_http_requests_total'), 'Must expose http requests total metric');
  assert.ok(res.body.includes('eventhive_events_count'), 'Must expose custom events count metric');
  assert.ok(res.body.includes('process_cpu_seconds_total') || res.body.includes('nodejs_heap_size_total_bytes') || res.body.includes('process_start_time_seconds'), 'Must expose standard process metrics');
});
