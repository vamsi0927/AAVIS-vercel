import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { checkRateLimit } from '../_lib/rateLimiter.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'auth');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify token and get user securely
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const userId = user.id;

    // 2. Delete the user from Supabase Auth (which cascades to public.users if properly configured)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Delete User Error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
    }

    return res.status(200).json({ success: true, message: 'Account successfully deleted.' });

  } catch (error) {
    console.error('Delete Account API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
