export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, history = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key missing in Vercel Environment Variables.' });
  }

  try {
    const geminiContents = history.map((msg) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content || msg.parts?.[0]?.text || '' }],
    })).filter(msg => msg.parts[0].text !== '');
    
    geminiContents.push({ role: 'user', parts: [{ text: message }] });

    const requestBody = {
      systemInstruction: {
        parts: [{ text: 'You are Aavis, a helpful and slightly humorous AI nutrition assistant for an Indian health app.' }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Gemini API error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('[Vercel Chat API] Error:', error);
    return res.status(500).json({ error: error.message || 'Chat analysis failed' });
  }
}
