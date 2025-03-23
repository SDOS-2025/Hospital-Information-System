import sgMail from '@sendgrid/mail';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY || '';
sgMail.setApiKey(apiKey);

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

interface EmailTemplate {
  subject: string | ((data: any) => string);
  template: HandlebarsTemplateDelegate;
}

const templates: { [key: string]: EmailTemplate } = {};

// Load and compile email templates
const loadTemplates = () => {
  const templatesDir = path.join(__dirname, '../templates/email');
  const templateFiles = fs.readdirSync(templatesDir);
  
  templateFiles.forEach(file => {
    if (file.endsWith('.hbs')) {
      const name = path.basename(file, '.hbs');
      const templatePath = path.join(templatesDir, file);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const configPath = path.join(templatesDir, `${name}.json`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      
      templates[name] = {
        subject: config.subject,
        template: Handlebars.compile(templateContent)
      };
    }
  });
};

// Initialize templates
loadTemplates();

/**
 * Send email using SendGrid
 * @param options Email options
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Skip sending email if API key is not configured
  if (!apiKey || !apiKey.startsWith('SG.')) {
    console.log('SendGrid API key not configured. Skipping email send.');
    return;
  }

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
    // Don't throw error, just log it
    console.log('Continuing without sending email');
  }
};

/**
 * Send email using a template
 */
export const sendTemplatedEmail = async (
  templateName: string,
  to: string,
  data: any,
  attachments?: EmailOptions['attachments']
): Promise<void> => {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const html = template.template(data);
  const subject = typeof template.subject === 'function' 
    ? template.subject(data)
    : Handlebars.compile(template.subject)(data);

  await sendEmail({
    to,
    subject,
    html,
    attachments
  });
};

/**
 * Send welcome email to new users
 * @param name User's name
 * @param email User's email
 * @param role User's role
 */
export const sendWelcomeEmail = async (name: string, email: string, role: string): Promise<void> => {
  await sendTemplatedEmail('welcome', email, { name, role });
};

/**
 * Send password reset email
 * @param name User's name
 * @param email User's email
 * @param resetUrl Password reset URL
 */
export const sendPasswordResetEmail = async (name: string, email: string, resetUrl: string): Promise<void> => {
  await sendTemplatedEmail('password-reset', email, { name, resetUrl });
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
  await sendTemplatedEmail('thesis-status', email, { name, thesisTitle, status, comments });
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
  await sendTemplatedEmail('fee-payment', email, {
    name,
    amount: amount.toFixed(2),
    receiptNumber,
    paymentDate: paymentDate.toLocaleDateString()
  });
};

/**
 * Send admission status update
 * @param name User's name
 * @param email User's email
 * @param applicationNumber Application number
 * @param status New status
 * @param remarks Optional remarks
 */
export const sendAdmissionStatusUpdateEmail = async (
  name: string,
  email: string,
  applicationNumber: string,
  status: string,
  remarks?: string
): Promise<void> => {
  await sendTemplatedEmail('admission-status', email, {
    name,
    applicationNumber,
    status,
    remarks
  });
};

/**
 * Send exam schedule notification
 * @param name User's name
 * @param email User's email
 * @param examTitle Exam title
 * @param dateTime Exam date and time
 * @param venue Exam venue
 * @param instructions Optional instructions
 */
export const sendExamScheduleEmail = async (
  name: string,
  email: string,
  examTitle: string,
  dateTime: Date,
  venue: string,
  instructions?: string
): Promise<void> => {
  await sendTemplatedEmail('exam-schedule', email, {
    name,
    examTitle,
    dateTime: dateTime.toLocaleString(),
    venue,
    instructions
  });
};

/**
 * Send leave application status update
 * @param name User's name
 * @param email User's email
 * @param leaveId Leave ID
 * @param status New status
 * @param comments Optional comments
 */
export const sendLeaveStatusUpdateEmail = async (
  name: string,
  email: string,
  leaveId: string,
  status: string,
  comments?: string
): Promise<void> => {
  await sendTemplatedEmail('leave-status', email, {
    name,
    leaveId,
    status,
    comments
  });
};