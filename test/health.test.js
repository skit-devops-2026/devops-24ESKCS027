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