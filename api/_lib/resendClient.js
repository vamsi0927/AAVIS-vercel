import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error('Missing RESEND_API_KEY environment variable.');
}

export const resend = new Resend(resendApiKey);

// Domain verified in Resend (e.g. noreply@aavis.app). 
// For testing without a verified domain, Resend requires you to use 'onboarding@resend.dev'
// and you can ONLY send emails to the email address registered with your Resend account.
export const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
