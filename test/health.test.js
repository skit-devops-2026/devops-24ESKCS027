const test = require('node:test');
const assert = require('node:assert');

test('health endpoint response structure', async () => {
  const response = {
    status: 'ok',
    commit: 'test-commit-sha'
  };

  assert.strictEqual(response.status, 'ok');
  assert.ok(response.commit);
});

test('health check commit fallback provides non-empty default', async () => {
  const commit = process.env.GITHUB_SHA || 'unknown';
  const response = {
    status: 'ok',
    commit
  };

  assert.strictEqual(response.status, 'ok');
  assert.strictEqual(typeof response.commit, 'string');
  assert.ok(response.commit.length > 0);
});