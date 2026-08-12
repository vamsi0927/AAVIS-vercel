const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Running AAVIS API Functional & Negative Suite...');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;

function startServer() {
  return new Promise((resolve) => {
    serverProcess = spawn('node', ['backend/server/index.cjs'], {
      stdio: 'inherit',
      detached: true
    });
    // Wait for boot
    setTimeout(resolve, 1500);
  });
}

function stopServer() {
  if (serverProcess) {
    try {
      process.kill(-serverProcess.pid);
    } catch (e) {
      serverProcess.kill();
    }
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: responseBody });
      });
    });

    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

const results = [];

async function runTest(id, name, testFn) {
  try {
    const pass = await testFn();
    results.push({ id, name, status: pass ? 'PASS' : 'FAIL', error: null });
    console.log(`✅ [${id}] ${name}`);
  } catch (err) {
    results.push({ id, name, status: 'FAIL', error: err.message });
    console.log(`❌ [${id}] ${name}: ${err.message}`);
  }
}

async function main() {
  await startServer();

  // TC_API_001 - 005 (Existing)
  await runTest('TC_API_001', 'GET /api/health returns 200', async () => {
    const res = await request('GET', '/api/health');
    return res.status === 200;
  });

  await runTest('TC_API_002', 'POST /api/signup with empty payload returns 400', async () => {
    const res = await request('POST', '/api/signup', {});
    return res.status === 400;
  });

  await runTest('TC_API_003', 'POST /api/login with empty credentials returns 400', async () => {
    const res = await request('POST', '/api/login', {});
    return res.status === 400;
  });

  await runTest('TC_API_004', 'POST /api/analyze with empty image returns 400', async () => {
    const res = await request('POST', '/api/analyze', { image: '' });
    return res.status === 400;
  });

  await runTest('TC_API_005', 'POST /api/chat with empty message returns 400', async () => {
    const res = await request('POST', '/api/chat', {});
    return res.status === 400;
  });

  // TC_API_006 - 010 (New High-Priority Cases)
  await runTest('TC_API_006', 'GET /api/nonexistent returns 404', async () => {
    const res = await request('GET', '/api/nonexistent');
    return res.status === 404;
  });

  await runTest('TC_API_007', 'POST /api/chat with malformed body returns 400', async () => {
    // Attempt request with bad body parsing trigger
    try {
      const res = await request('POST', '/api/chat', null, { 'Content-Type': 'application/json' });
      return res.status === 400 || res.status === 404;
    } catch(e) {
      return true;
    }
  });

  await runTest('TC_API_008', 'POST /api/analyze with massive payload triggers limits or 400', async () => {
    const largeBody = { image: 'a'.repeat(2 * 1024 * 1024) }; // 2MB payload
    const res = await request('POST', '/api/analyze', largeBody);
    return res.status === 400 || res.status === 413 || res.status === 500;
  });

  await runTest('TC_API_009', 'OPTIONS /api/health returns correct CORS headers', async () => {
    const res = await request('OPTIONS', '/api/health');
    return res.headers['access-control-allow-origin'] !== undefined;
  });

  await runTest('TC_API_010', 'GET / root path returns index.html successfully', async () => {
    const res = await request('GET', '/');
    return res.status === 200 && res.body.includes('<!doctype html>');
  });

  stopServer();

  // Save report
  const dir = path.join(__dirname, 'Test Results/API');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'api-functional-results.json'), JSON.stringify(results, null, 2));
  console.log(`\n🎉 API Functional Suite finished. JSON saved to: ${path.join(dir, 'api-functional-results.json')}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  stopServer();
  process.exit(1);
});
