const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.method === 'POST' && req.url.includes('/session')) {
    // Start session
    res.end(JSON.stringify({
      value: {
        sessionId: 'mock-session-12345',
        capabilities: {
          platformName: 'Android',
          deviceName: 'Android Emulator'
        }
      }
    }));
  } else if (req.url.includes('/element')) {
    // Find element
    res.end(JSON.stringify({
      value: { 'element-6066-11e4-a52e-4f735466cecf': 'mock-element-id' }
    }));
  } else {
    // Click, Value, and other commands
    res.end(JSON.stringify({ value: null }));
  }
});

server.listen(4723, () => {
  console.log('Mock Appium Server listening on port 4723...');
});
