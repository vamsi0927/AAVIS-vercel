import { resend, SENDER_EMAIL } from '../_lib/resendClient.js';
import { checkRateLimit } from '../_lib/rateLimiter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting Check (to prevent spamming contact form)
  const rateLimit = await checkRateLimit(req, 'contact');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const { error: resendError } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: 'aavis.support@gmail.com', // Sending to the support email
      reply_to: email, // Set reply-to to the user's email so support can reply directly
      subject: `[Support Request] ${subject}`,
      html: `
        <h2>New Contact Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    });

    if (resendError) {
      console.error('Resend Error:', resendError);
      return res.status(500).json({ error: 'Failed to send message.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
