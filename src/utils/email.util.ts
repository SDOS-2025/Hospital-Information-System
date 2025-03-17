import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: {
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }[];
}

/**
 * Send email using SendGrid
 * @param options Email options
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const msg = {
      to: options.to,
      from: options.from || process.env.EMAIL_FROM || 'noreply@hinduraohospital.org',
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send welcome email to new users
 * @param name User's name
 * @param email User's email
 * @param role User's role
 */
export const sendWelcomeEmail = async (name: string, email: string, role: string): Promise<void> => {
  const subject = 'Welcome to Hindu Rao Hospital Information System';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Hindu Rao Hospital Information System</h2>
      <p>Dear ${name},</p>
      <p>Welcome to the Hindu Rao Hospital Information System. Your account has been created successfully as a <strong>${role}</strong>.</p>
      <p>You can now log in to the system using your email and the provided password.</p>
      <p>Please change your password after your first login for security purposes.</p>
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <p>Best regards,<br>Hindu Rao Hospital Administration</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
};

/**
 * Send password reset email
 * @param name User's name
 * @param email User's email
 * @param resetUrl Password reset URL
 */
export const sendPasswordResetEmail = async (name: string, email: string, resetUrl: string): Promise<void> => {
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Dear ${name},</p>
      <p>You requested a password reset for your Hindu Rao Hospital Information System account.</p>
      <p>Please click the link below to reset your password:</p>
      <p><a href="${resetUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>Hindu Rao Hospital Administration</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
};

/**
 * Send notification for thesis status update
 * @param name User's name
 * @param email User's email
 * @param thesisTitle Thesis title
 * @param status New status
 * @param comments Optional comments
 */
export const sendThesisStatusUpdateEmail = async (
  name: string,
  email: string,
  thesisTitle: string,
  status: string,
  comments?: string
): Promise<void> => {
  const subject = `Thesis Status Update: ${status}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Thesis Status Update</h2>
      <p>Dear ${name},</p>
      <p>Your thesis titled <strong>${thesisTitle}</strong> has been updated to <strong>${status}</strong>.</p>
      ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
      <p>You can check more details by logging into your account.</p>
      <p>Best regards,<br>Hindu Rao Hospital Administration</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
};

/**
 * Send notification for fee payment
 * @param name User's name
 * @param email User's email
 * @param amount Amount paid
 * @param receiptNumber Receipt number
 * @param paymentDate Payment date
 */
export const sendFeePaymentConfirmationEmail = async (
  name: string,
  email: string,
  amount: number,
  receiptNumber: string,
  paymentDate: Date
): Promise<void> => {
  const subject = 'Fee Payment Confirmation';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Fee Payment Confirmation</h2>
      <p>Dear ${name},</p>
      <p>We have received your payment of <strong>₹${amount.toFixed(2)}</strong>.</p>
      <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
      <p><strong>Payment Date:</strong> ${paymentDate.toLocaleDateString()}</p>
      <p>You can view your payment details and download the receipt by logging into your account.</p>
      <p>Thank you for your payment.</p>
      <p>Best regards,<br>Hindu Rao Hospital Administration</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
};