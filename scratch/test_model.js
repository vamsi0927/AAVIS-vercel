import fetch from 'node-fetch';

async function run() {
  const body = {
    model: 'llama3.1:latest',
    messages: [{ role: 'user', content: 'Say hello and tell me your model name.' }],
    stream: false
  };

  console.log('Sending request to local Ollama on port 11434...');
  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Response from Ollama:', data.message?.content);
  } catch (e) {
    console.error('Failed to query local Ollama:', e.message);
  }
}

run();
