import assert from 'assert';
import handler from './verifyLink.js';

describe('verifyLink API - SSRF Hardening', () => {
  let mockRes;
  
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://myproject.supabase.co';
    mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      end: function() {
        return this;
      }
    };
  });

  const runHandler = async (link) => {
    const req = { method: 'POST', body: { link } };
    await handler(req, mockRes);
    return mockRes;
  };

  it('rejects HTTP instead of HTTPS', async () => {
    const res = await runHandler('http://myproject.supabase.co/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /HTTPS/);
  });

  it('rejects invalid hostname', async () => {
    const res = await runHandler('https://evil.com/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Untrusted domain/);
  });

  it('rejects localhost', async () => {
    const res = await runHandler('https://localhost/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Untrusted domain/);
  });

  it('rejects 127.0.0.1', async () => {
    const res = await runHandler('https://127.0.0.1/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Untrusted domain/);
  });

  it('rejects private IP ranges (10.x.x.x)', async () => {
    const res = await runHandler('https://10.0.0.1/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Untrusted domain/);
  });

  it('rejects AWS metadata endpoint', async () => {
    const res = await runHandler('https://169.254.169.254/latest/meta-data/');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Untrusted domain/);
  });

  it('rejects DNS rebinding attempt (hostname spoofing)', async () => {
    const res = await runHandler('https://myproject.supabase.co.evil.com/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /Untrusted domain/);
  });

  it('rejects malformed URL', async () => {
    const res = await runHandler('not-a-url');
    assert.strictEqual(res.statusCode, 400);
  });

  it('rejects URL with username/password', async () => {
    const res = await runHandler('https://admin:password@myproject.supabase.co/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /credentials/);
  });

  it('rejects unexpected port', async () => {
    const res = await runHandler('https://myproject.supabase.co:8443/verify');
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /port/);
  });

  it('allows valid Supabase verification URL', async () => {
    // It will eventually time out or fail DNS resolution, 
    // but it MUST pass the synchronous SSRF validation block.
    const req = { method: 'POST', body: { link: 'https://myproject.supabase.co/auth/v1/verify?token=123' } };
    await handler(req, mockRes);
    
    const errorMsg = mockRes.body?.error || '';
    const isValidationFailure = errorMsg.includes('Untrusted domain') || 
                                errorMsg.includes('HTTPS') ||
                                errorMsg.includes('credentials') ||
                                errorMsg.includes('port');
                                
    assert.strictEqual(isValidationFailure, false, 'Should pass SSRF allowlist validation');
  });
});
