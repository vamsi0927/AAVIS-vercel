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
    let linkType = 'signup';

    // 1. Create User in Supabase Auth (Unverified)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name, signupSource: source }
    });

    let userId;

    if (createError) {
      if (createError.message.toLowerCase().includes('already')) {
        // Check if the user has completed setup by seeing if they have an age in their profile
        const { data: existingProfile } = await supabaseAdmin.from('profiles').select('age').eq('email', email).single();
        
        if (existingProfile && existingProfile.age !== null) {
          return res.status(400).json({ error: 'Account is already registered. Please sign in.' });
        }
        
        linkType = 'magiclink';
      } else {
        return res.status(400).json({ error: createError.message });
      }
    } else {
      userId = userData.user.id;
    }

    // 3. Generate a magic link using Supabase Admin API
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host;
    
    const generateLinkOptions = {
      type: linkType,
      email: email,
      options: {
        data: { name },
        redirectTo: `${protocol}://${host}/verify`
      }
    };
    
    if (linkType === 'signup') {
      generateLinkOptions.password = password;
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink(generateLinkOptions);

    if (linkError) {
      console.error('Generate Link Error:', linkError);
      return res.status(500).json({ error: 'Failed to generate verification link.' });
    }

    let verificationLink = linkData.properties.action_link;
    
    try {
      const currentOrigin = `${protocol}://${host}`;
      verificationLink = `${currentOrigin}/verify?source=${source}&link=${encodeURIComponent(verificationLink)}`;
    } catch (e) {
      console.error('Failed to parse link URL', e);
    }

    // 4. Send Verification Email via Resend
    const { error: resendError } = await resend.emails.send({
      from: `AAVIS <${SENDER_EMAIL}>`,
      to: [email],
      subject: 'Verify your AAVIS Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to AAVIS, ${escapeHtml(name)}!</h2>
          <p>Please click the button below to verify your email address and activate your account.</p>
          <a href="${verificationLink}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Verify Email</a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error('Resend Error:', resendError);
      
      // CRITICAL: Delete the user if email fails so they aren't stuck in "already registered" state
      // Only delete if we just created them (userId is defined)
      if (userId) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      
      return res.status(500).json({ error: `Email failed: ${resendError.message || 'Please try again.'}` });
    }

    return res.status(200).json({ message: 'Registration successful. Verification email sent.' });

  } catch (error) {
    console.error('Registration API Error:', error);
    
    // Check if it's the "already registered" error
    if (error.message && error.message.toLowerCase().includes('already')) {
        return res.status(400).json({ error: 'Account is already registered. Please sign in.' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
