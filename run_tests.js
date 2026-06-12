// Mock env vars before importing handlers
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_key';

import analyzeHandler from './api/analyze.js';
import chatHandler from './api/chat.js';
import registerHandler from './api/auth/register.js';
import forgotPasswordHandler from './api/auth/forgot-password.js';
import resetPasswordHandler from './api/auth/reset-password.js';

// Simple mock for Express req/res
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  const results = [];

  const addResult = (testName, expected, actual, pass) => {
    results.push({ testName, expected, actual, pass });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${testName} - Expected: ${expected}, Actual: ${actual}`);
  };

  console.log('--- RUNNING SECURITY VERIFICATION TESTS ---\n');

  // 1. AI Endpoint Authentication
  let req = { method: 'POST', body: { text: 'test' }, headers: {} };
  let res = createMockRes();
  await analyzeHandler(req, res);
  addResult('analyze.js Missing Auth Header', 401, res.statusCode, res.statusCode === 401);

  req = { method: 'POST', body: { message: 'test' }, headers: { authorization: 'Bearer invalid_token' } };
  res = createMockRes();
  await chatHandler(req, res);
  // It should attempt to verify the token and fail
  addResult('chat.js Invalid Auth Token', 401, res.statusCode, res.statusCode === 401);

  // 3. Payload Limits
  // analyze.js > 5000 chars
  req = { method: 'POST', body: { text: 'a'.repeat(5001) }, headers: { authorization: 'Bearer test' } };
  res = createMockRes();
  await analyzeHandler(req, res);
  addResult('analyze.js text > 5000 chars', 400, res.statusCode, res.statusCode === 400);

  // chat.js > 2000 chars
  req = { method: 'POST', body: { message: 'a'.repeat(2001) }, headers: { authorization: 'Bearer test' } };
  res = createMockRes();
  await chatHandler(req, res);
  addResult('chat.js message > 2000 chars', 400, res.statusCode, res.statusCode === 400);

  // chat.js history > 20 messages
  req = { method: 'POST', body: { message: 'hi', history: new Array(21).fill({}) }, headers: { authorization: 'Bearer test' } };
  res = createMockRes();
  await chatHandler(req, res);
  addResult('chat.js history > 20', 400, res.statusCode, res.statusCode === 400);

  // register.js fields > 255
  req = { method: 'POST', body: { email: 'a'.repeat(256), password: 'pass', name: 'user' }, headers: {} };
  res = createMockRes();
  await registerHandler(req, res);
  addResult('register.js email > 255 chars', 400, res.statusCode, res.statusCode === 400);

  // forgot-password.js email > 255
  req = { method: 'POST', body: { email: 'a'.repeat(256) }, headers: {} };
  res = createMockRes();
  await forgotPasswordHandler(req, res);
  addResult('forgot-password.js email > 255 chars', 400, res.statusCode, res.statusCode === 400);

  // reset-password.js fields > 255
  req = { method: 'POST', body: { token: 'a'.repeat(256), uid: 'test', newPassword: 'pass' }, headers: {} };
  res = createMockRes();
  await resetPasswordHandler(req, res);
  addResult('reset-password.js token > 255 chars', 400, res.statusCode, res.statusCode === 400);

  console.log('\n--- TESTS COMPLETED ---');
}

runTests().catch(console.error);
