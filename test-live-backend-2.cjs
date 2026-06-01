const fetch = require('node-fetch');

async function run() {
  const text = `Just say "APPLE". Do not output JSON.`;

  try {
    const res = await fetch('https://aavis-backend.onrender.com/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.text();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}

run();
