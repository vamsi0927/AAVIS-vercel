import { resend } from '../_lib/resendClient.js';
import { checkRateLimit } from '../_lib/rateLimiter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'contact');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { name, email, subject, category, message } = req.body;

  if (!name || !email || !subject || !category || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Enforce max lengths
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message cannot exceed 2000 characters.' });
  }

  try {
    const textBody = `New AAVIS Support Request

Category:
${category}

Name:
${name}

Email:
${email}

Subject:
${subject}

Message:

${message}`;

    const { error: resendError } = await resend.emails.send({
      from: 'AAVIS Support <onboarding@resend.dev>',
      to: 'aavis.support@gmail.com',
      reply_to: email,
      subject: `[AAVIS Support] ${category} - ${subject}`,
      text: textBody,
    });

    if (resendError) {
      console.error('Resend Error:', resendError);
      return res.status(500).json({ error: resendError.message || 'Failed to send message.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
