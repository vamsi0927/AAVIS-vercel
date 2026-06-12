import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { checkRateLimit } from '../_lib/rateLimiter.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, uid, newPassword } = req.body;

  if (!token || !uid || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (token.length > 255 || uid.length > 255 || newPassword.length > 255) {
    return res.status(400).json({ error: 'Payload size limit exceeded' });
  }

  // Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'auth');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    // 1. Hash the incoming token to check against database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find the token in the database
    const { data: tokens, error: fetchError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('user_id', uid)
      .eq('hashed_token', hashedToken)
      .single();

    if (fetchError || !tokens) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    // 3. Check expiration
    if (new Date(tokens.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin.from('password_reset_tokens').delete().eq('id', tokens.id);
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    // 4. Update the user password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
      password: newPassword
    });

    if (updateError) {
      console.error('Update Password Error:', updateError);
      return res.status(500).json({ error: 'Failed to reset password.' });
    }

    // 5. Delete the token so it can't be reused
    await supabaseAdmin.from('password_reset_tokens').delete().eq('id', tokens.id);

    return res.status(200).json({ message: 'Password has been successfully reset.' });

  } catch (error) {
    console.error('Reset Password API Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
