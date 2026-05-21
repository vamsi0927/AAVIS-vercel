const API_KEY = 'AIzaSyA4hKC3EGzDgzYlBd8NrTde0Qax5nYmXh0';

async function test(model) {
  console.log(`--- ${model} ---`);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hi' }] }] })
    });
    console.log('Status:', r.status);
    const d = await r.json();
    if (r.ok) {
      console.log('WORKS! Response:', d.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100));
    } else {
      // Extract the quota metric name
      const msg = d.error?.message || '';
      const metricMatch = msg.match(/metric: ([^,]+)/);
      console.log('Error:', metricMatch ? metricMatch[1] : msg.substring(0, 150));
    }
  } catch (e) {
    console.log('Network error:', e.message);
  }
}

(async () => {
  await test('gemini-2.5-flash-preview-05-20');
  await test('gemini-2.5-pro-preview-05-06');
  await test('gemini-2.0-flash');
  await test('gemini-2.0-flash-lite');
  await test('gemini-2.0-flash-thinking-exp');
})();
