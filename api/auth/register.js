import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { resend, SENDER_EMAIL } from '../_lib/resendClient.js';
import { checkRateLimit } from '../_lib/rateLimiter.js';
import crypto from 'crypto';

// Basic HTML sanitizer to prevent injection in emails
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

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (email.length > 255 || password.length > 255 || name.length > 255) {
    return res.status(400).json({ error: 'Payload size limit exceeded' });
  }

  // Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'auth');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    // 1. Create User in Supabase Auth (Unverified)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name }
    });

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }

    const userId = userData.user.id;

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Token expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 3. Store hashed token in DB
    const { error: dbError } = await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: userId,
        hashed_token: hashedToken,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('DB Error saving token:', dbError);
      return res.status(500).json({ error: 'Failed to generate verification token' });
    }

    // 4. Send Verification Email via Resend
    // Construct the verification link containing the RAW token (not hashed)
    // We pass the email to identify the user later, or we could pass user_id. Let's pass user_id.
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host;
    const verifyLink = `${protocol}://${host}/api/auth/verify-email?token=${token}&uid=${userId}`;

    const { error: resendError } = await resend.emails.send({
      from: `AAVIS <${SENDER_EMAIL}>`,
      to: [email],
      subject: 'Verify your AAVIS Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to AAVIS, ${escapeHtml(name)}!</h2>
          <p>Please click the button below to verify your email address and activate your account.</p>
          <a href="${verifyLink}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Verify Email</a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Resend Error:', resendError);
      // Depending on strictness, we might want to delete the user if email failed, but for now we'll just return success 
      // and maybe log it. We'll return 500 to let frontend know.
      return res.status(500).json({ error: 'Account created, but failed to send verification email' });
    }

    return res.status(200).json({ message: 'Registration successful. Verification email sent.' });

  } catch (error) {
    console.error('Registration API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
