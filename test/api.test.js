const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('node:http');
const { app, students } = require('../server');

let server;
let baseUrl;

function api(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  }).then(async (response) => ({
    status: response.status,
    body: await response.json(),
  }));
}

test.before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test.beforeEach(() => {
  students.length = 0;
});

test('confirms the API is running at the root route', async () => {
  const response = await api('/');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { message: 'Student Management API is running' });
});

test('creates and lists students', async () => {
  const created = await api('/students', {
    method: 'POST',
    body: JSON.stringify({ name: 'Ada Lovelace', email: 'ada@example.com', course: 'Computing', age: 28 }),
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.id, 1);
  assert.deepEqual((await api('/students')).body, [created.body]);
});

test('gets, updates, searches, and deletes a student', async () => {
  const created = await api('/students', {
    method: 'POST',
    body: JSON.stringify({ name: 'Grace Hopper', email: 'grace@example.com', course: 'Computing', age: 37 }),
  });
  const id = created.body.id;

  assert.deepEqual((await api(`/students/${id}`)).body, created.body);

  const updated = await api(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Grace Hopper', email: 'grace@navy.example', course: 'Mathematics', age: 38 }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.course, 'Mathematics');
  assert.deepEqual((await api('/students/search?course=mathematics')).body, [updated.body]);

  const deleted = await api(`/students/${id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 200);
  assert.equal((await api(`/students/${id}`)).status, 404);
  assert.deepEqual((await api('/students/search?course=missing')).body, []);
});

test('rejects invalid input and missing records with JSON errors', async () => {
  const invalid = await api('/students', {
    method: 'POST',
    body: JSON.stringify({ name: '', email: 'invalid', course: '', age: 0 }),
  });
  assert.equal(invalid.status, 400);
  assert.equal(typeof invalid.body.error, 'string');

  const missing = await api('/students/999', { method: 'PUT', body: JSON.stringify({}) });
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.body, { error: 'Student not found' });
});

test('returns JSON for malformed request bodies', async () => {
  const response = await new Promise((resolve, reject) => {
    const requestOptions = new URL(`${baseUrl}/students`);
    const clientRequest = request.request(requestOptions, { method: 'POST', headers: { 'content-type': 'application/json' } }, resolve);
    clientRequest.on('error', reject);
    clientRequest.end('{invalid');
  });
  let body = '';
  for await (const chunk of response) body += chunk;
  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(body), { error: 'Request body must contain valid JSON' });
});