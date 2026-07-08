import nodemailer from 'nodemailer';

export const SENDER_EMAIL = 'aavis.support@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aavis.support@gmail.com',
    pass: 'buienjgnkksbvcbk' // App password without spaces
  }
});

// We keep the object named 'resend' so we don't have to rewrite all the other files.
// This mocks the Resend SDK interface but uses Nodemailer + Gmail behind the scenes.
export const resend = {
  emails: {
    send: async ({ from, to, subject, html, text }) => {
      try {
        const info = await transporter.sendMail({
          from: from || `AAVIS <${SENDER_EMAIL}>`,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          html,
          text
        });
        return { data: info, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  }
};
