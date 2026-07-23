import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { checkRateLimit } from '../_lib/rateLimiter.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Missing email or OTP' });
  }

  // Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'auth_verify');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many verification attempts. Please try again later.' });
  }

  try {
    const cleanEmail = email.trim();

    // 1. Get user by email using Admin API
    const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers();
    if (findError) {
      console.error('List Users Error:', findError);
      return res.status(500).json({ error: 'Failed to process request' });
    }

    const existingUser = users.find(u => u.email === cleanEmail);
    
    if (!existingUser) {
      return res.status(400).json({ error: 'Invalid verification attempt' });
    }

    const userId = existingUser.id;

    // 2. Hash incoming OTP
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // 3. Atomically validate and consume the OTP
    // Using a DELETE query with a RETURNING clause (.select() in Supabase JS)
    const { data: deletedTokens, error: deleteError } = await supabaseAdmin
      .from('verification_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('hashed_token', hashedOtp)
      .gte('expires_at', new Date().toISOString())
      .select();

    if (deleteError) {
      console.error('DB Error verifying OTP:', deleteError);
      return res.status(500).json({ error: 'Verification failed' });
    }

    // 4. Check if exactly 1 token was consumed
    if (!deletedTokens || deletedTokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // 5. Mark user email as confirmed
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (confirmError) {
      console.error('Confirm User Error:', confirmError);
      return res.status(500).json({ error: 'Failed to confirm account' });
    }

    return res.status(200).json({ message: 'Email verified successfully.' });

  } catch (error) {
    console.error('Verify OTP API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
