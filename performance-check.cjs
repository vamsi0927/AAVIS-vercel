const http = require('http');

console.log('Starting mock backend server for load testing...');
const serverProcess = require('child_process').spawn('node', ['server/index.cjs'], {
  stdio: 'inherit',
  detached: true
});

// Give the server 3 seconds to boot
setTimeout(async () => {
  console.log('Server started. Running API load tests (concurrency=10, requests=100)...');
  
  const totalRequests = 100;
  let completed = 0;
  let successCount = 0;
  const start = Date.now();

  const makeRequest = () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:5000/api/health', { timeout: 1000 }, (res) => {
        if (res.statusCode === 200) successCount++;
        resolve();
      });
      req.on('error', () => resolve());
      req.end();
    });
  };

  // Run in chunks of 10 concurrent requests
  for (let i = 0; i < totalRequests; i += 10) {
    const batch = Array.from({ length: 10 }, () => makeRequest());
    await Promise.all(batch);
  }

  const duration = Date.now() - start;
  const avgLatency = duration / totalRequests;

  console.log('--- LOAD TESTING METRICS ---');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful Requests: ${successCount}`);
  console.log(`Total Duration: ${duration}ms`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log('----------------------------');

  // Terminate server process
  process.kill(-serverProcess.pid);

  if (successCount > 90 && avgLatency < 150) {
    console.log('Performance test passed!');
    process.exit(0);
  } else {
    console.error('Performance criteria not met!');
    process.exit(1);
  }
}, 3000);
