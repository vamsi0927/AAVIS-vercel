import { supabaseAdmin } from '../_lib/supabaseAdmin.js';
import { resend, SENDER_EMAIL } from '../_lib/resendClient.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, uid } = req.query;

  if (!token || !uid) {
    return res.status(400).send('Invalid verification link.');
  }

  try {
    // 1. Hash the incoming token to check against database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find the token in the database
    const { data: tokens, error: fetchError } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .eq('user_id', uid)
      .eq('hashed_token', hashedToken)
      .single();

    if (fetchError || !tokens) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    // 3. Check expiration
    if (new Date(tokens.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin.from('verification_tokens').delete().eq('id', tokens.id);
      return res.status(400).send('This verification link has expired. Please sign up again or request a new link.');
    }

    // 4. Update the user in Supabase Auth to confirm email
    const { data: userUpdate, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
      email_confirm: true
    });

    if (updateError) {
      console.error('Update User Error:', updateError);
      return res.status(500).send('Failed to verify user account.');
    }

    // 5. Delete the token so it can't be reused
    await supabaseAdmin.from('verification_tokens').delete().eq('id', tokens.id);

    // 6. Send Welcome Email via Resend
    const userEmail = userUpdate.user.email;
    const userName = userUpdate.user.user_metadata?.name || 'User';

    await resend.emails.send({
      from: `AAVIS <${SENDER_EMAIL}>`,
      to: [userEmail],
      subject: 'Welcome to AAVIS!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Account Verified!</h2>
          <p>Hi ${userName},</p>
          <p>Your email has been successfully verified. You can now log into your AAVIS account and start scanning food labels!</p>
          <p>Eat healthy, live healthy!</p>
        </div>
      `,
    });

    // 7. Redirect to login page on frontend with success message
    res.writeHead(302, {
      Location: '/login?verified=true'
    });
    res.end();

  } catch (error) {
    console.error('Verification API Error:', error);
    return res.status(500).send('Internal server error during verification.');
  }
}
