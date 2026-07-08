export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { link } = req.body;

  if (!link) {
    return res.status(400).json({ error: 'Missing link' });
  }

  try {
    // We fetch the action_link manually with redirect: 'manual'
    // This allows us to intercept the redirect Location header from Supabase
    // Because the Location header contains the access_token in the URL fragment!
    const response = await fetch(link, {
      method: 'GET',
      redirect: 'manual'
    });

    // Supabase will respond with 302 Found if the link is valid (or even if it's invalid, it redirects with an error)
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      
      if (!location) {
        return res.status(400).json({ error: 'Verification failed: No redirect location found.' });
      }

      // Check if Supabase returned an error in the redirect URL
      if (location.includes('error=')) {
        const errorDesc = new URL(location).searchParams.get('error_description') || 'Verification link expired or invalid.';
        return res.status(400).json({ error: errorDesc });
      }

      // Extract the access_token and refresh_token from the fragment (#)
      // Example: http://localhost:3000/#access_token=xyz&refresh_token=abc&...
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

      // Success! Return the tokens to the frontend so it can establish the session
      return res.status(200).json({
        session: {
          access_token,
          refresh_token
        }
      });
    }

    return res.status(400).json({ error: 'Verification failed: Unexpected response from auth server.' });
  } catch (error) {
    console.error('Verify Link Error:', error);
    return res.status(500).json({ error: 'Internal server error during verification.' });
  }
}
