import https from 'https';
import http from 'http';
import { URL } from 'url';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { link } = req.body;

  if (!link) {
    return res.status(400).json({ error: 'Missing link' });
  }

  try {
    const parsedUrl = new URL(link);
    
    // Strict SSRF Protection: Protocol & Port
    if (parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Verification link must use HTTPS.' });
    }
    if (parsedUrl.port && parsedUrl.port !== '443') {
      return res.status(400).json({ error: 'Verification link must use standard HTTPS port.' });
    }

    // Strict SSRF Protection: Credentials
    if (parsedUrl.username || parsedUrl.password) {
      return res.status(400).json({ error: 'Verification link cannot contain credentials.' });
    }

    // Strict SSRF Protection: Hostname Allowlist
    const envUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    if (!envUrl) {
      console.error('SUPABASE_URL is not configured.');
      return res.status(500).json({ error: 'Internal server configuration error.' });
    }
    
    let expectedHost;
    try {
      expectedHost = new URL(envUrl).hostname;
    } catch (e) {
      return res.status(500).json({ error: 'Internal server configuration error.' });
    }

    if (parsedUrl.hostname !== expectedHost) {
      return res.status(400).json({ error: 'Verification failed: Untrusted domain.' });
    }

    const client = https;

    // Use core https module to guarantee we intercept the redirect
    const location = await new Promise((resolve, reject) => {
      const request = client.get(link, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400) {
          resolve(response.headers.location);
        } else {
          // SSRF Protection: Do NOT leak the response body in the error message
          response.resume(); // consume data to free memory
          response.on('end', () => {
             reject(new Error(`Verification failed with status: ${response.statusCode}. Please ensure the link is valid.`));
          });
        }
      });
      request.setTimeout(5000, () => {
         request.destroy();
         reject(new Error('Request timeout.'));
      });
      request.on('error', reject);
    });

    if (!location) {
      return res.status(400).json({ error: 'Verification failed: No redirect location found.' });
    }

    if (location.includes('error=')) {
      const errorUrl = new URL(location.startsWith('/') ? `http://localhost${location}` : location);
      const errorDesc = errorUrl.searchParams.get('error_description') || 'Verification link expired or invalid.';
      return res.status(400).json({ error: errorDesc });
    }

    const fragment = location.split('#')[1];
    if (!fragment) {
      return res.status(400).json({ error: 'Verification failed: No tokens found in redirect.' });
    }

    const params = new URLSearchParams(fragment);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: 'Verification failed: Missing session tokens.' });
    }

    return res.status(200).json({
      session: {
        access_token,
        refresh_token
      }
    });

  } catch (error) {
    console.error('Verify Link Error:', error);
    return res.status(400).json({ error: error.message || 'Internal server error during verification.' });
  }
}
