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
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, source = 'web' } = req.body;

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
    let userId;
    let isNewUser = true;
    const cleanEmail = email.trim();

    // 1. Create User in Supabase Auth (Unverified)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: false,
      user_metadata: { name, signupSource: source }
    });

    if (createError) {
      if (createError.message.toLowerCase().includes('already')) {
        isNewUser = false;
        // Fetch user from Admin API to get ID and status
        const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers();
        if (findError) {
          console.error('List Users Error:', findError);
          return res.status(500).json({ error: 'Failed to process request' });
        }
        
        const existingUser = users.find(u => u.email === cleanEmail);
        
        if (!existingUser) {
           return res.status(500).json({ error: 'Failed to locate account' });
        }
        
        userId = existingUser.id;

        // Check if they are already verified
        if (existingUser.email_confirmed_at != null) {
          // They are already verified. Do not throw an error (prevents enumeration).
          // Just return 200 and send an email telling them they already have an account.
          
          const { error: notifyError } = await resend.emails.send({
            from: `AAVIS Security <${SENDER_EMAIL}>`,
            to: [cleanEmail],
            subject: 'AAVIS Registration Attempt',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Registration Attempt</h2>
                <p>Hello,</p>
                <p>Someone (hopefully you) just attempted to sign up for an AAVIS account using this email address.</p>
                <p>However, <strong>you already have an active account</strong> with us.</p>
                <p>Please log in using your existing credentials. If you forgot your password, use the "Forgot Password" link on the login page.</p>
                <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't do this, you can safely ignore this email.</p>
              </div>
            `,
          });
          
          if (notifyError) {
             console.error('Failed to send already-registered notification:', notifyError);
          }
          
          return res.status(200).json({ message: 'Registration processed. Check your email.' });
        }

        // If here, user exists but is UNVERIFIED. 
        // We will NOT update their password (prevents account takeover).
        // We will just generate a new OTP for their existing unverified account.
        
      } else {
        return res.status(400).json({ error: createError.message });
      }
    } else {
      userId = userData.user.id;
    }

    // 2. Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    
    // OTP expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 3. Invalidate old OTPs for this user (atomic delete)
    await supabaseAdmin
      .from('verification_tokens')
      .delete()
      .eq('user_id', userId);

    // 4. Store hashed OTP in DB
    const { error: dbError } = await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: userId,
        hashed_token: hashedOtp,
        expires_at: expiresAt.toISOString()
      });

    if (dbError) {
      console.error('DB Error saving OTP:', dbError);
      // Rollback user creation if it was a new user
      if (isNewUser && userId) {
         await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      return res.status(500).json({ error: 'Failed to generate verification code' });
    }

    // 5. Send Verification Email via Gmail Nodemailer
    const { error: resendError } = await resend.emails.send({
      from: `AAVIS <${SENDER_EMAIL}>`,
      to: [cleanEmail],
      subject: 'Verify your AAVIS Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to AAVIS, ${escapeHtml(name)}!</h2>
          <p>Please enter the following 6-digit code to verify your email address and activate your account.</p>
          <div style="background-color: #f3f4f6; padding: 16px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 20px 0;">
            ${rawOtp}
          </div>
          <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">This code will expire in 10 minutes.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Email Send Error:', resendError);
      
      // Rollback user creation if it was a new user so they can try again easily
      if (isNewUser && userId) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    return res.status(200).json({ message: 'Registration successful. Verification code sent.' });

  } catch (error) {
    console.error('Registration API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
