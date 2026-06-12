import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { resend, SENDER_EMAIL } from '../_lib/resendClient.js';
import { checkRateLimit } from '../_lib/rateLimiter.js';
import crypto from 'crypto';

// Basic HTML sanitizer
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  if (email.length > 255) {
    return res.status(400).json({ error: 'Payload size limit exceeded' });
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
    
    // For security reasons, don't reveal if user doesn't exist, just return success
    if (!user) {
      return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const userId = user.id;

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Token expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 3. Store hashed token in DB
    const { error: dbError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        hashed_token: hashedToken,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('DB Error saving reset token:', dbError);
      return res.status(500).json({ error: 'Failed to generate reset token' });
    }

    // 4. Send Password Reset Email via Resend
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host;
    // We send them to the frontend /reset-password page, passing the token and uid as URL params
    const resetLink = `${protocol}://${host}/reset-password?token=${token}&uid=${userId}`;

    const { error: resendError } = await resend.emails.send({
      from: `AAVIS Security <${SENDER_EMAIL}>`,
      to: [email],
      subject: 'Reset your AAVIS Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset the password for the AAVIS account associated with ${escapeHtml(email)}.</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Reset Password</a>
          <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">This link will expire in 10 minutes.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Resend Error:', resendError);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });

  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
