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
    return res.status(400).json({ error: 'Missing email or OTP code' });
  }

  // Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'auth');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    // 1. Get user by email using Admin API
    const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers();
    if (findError) {
      console.error('List Users Error:', findError);
      return res.status(500).json({ error: 'Failed to process request' });
    }

    const user = users.find(u => u.email === email.trim());
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const userId = user.id;

    // 2. Hash the incoming OTP
    const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    // 3. Find the OTP in the database
    const { data: tokens, error: fetchError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('hashed_token', hashedOtp)
      .single();

    if (fetchError || !tokens) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    // 4. Check expiration
    if (new Date(tokens.expires_at) < new Date()) {
      await supabaseAdmin.from('password_reset_tokens').delete().eq('id', tokens.id);
      return res.status(400).json({ error: 'This OTP has expired. Please request a new one.' });
    }

    // 5. Delete the OTP as it has been successfully used
    await supabaseAdmin.from('password_reset_tokens').delete().eq('id', tokens.id);

    // 6. Generate a secure token for the final password reset step
    const secureResetToken = crypto.randomBytes(32).toString('hex');
    const hashedSecureToken = crypto.createHash('sha256').update(secureResetToken).digest('hex');
    
    // Give them 15 minutes to finish setting their new password
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { error: dbError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        hashed_token: hashedSecureToken,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('DB Error saving final reset token:', dbError);
      return res.status(500).json({ error: 'Failed to generate secure reset session' });
    }

    // 7. Return the secure token to the frontend
    return res.status(200).json({ 
      success: true, 
      token: secureResetToken,
      uid: userId
    });

  } catch (error) {
    console.error('Verify Reset OTP API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
