import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@projectvault.edu";
const APP_URL = process.env.APP_URL || "http://localhost:8080";

// Ensure local debug folder for emails exists in development
const localEmailDir = path.join(__dirname, "../../../scratch/emails");
if (!SMTP_USER) {
  if (!fs.existsSync(localEmailDir)) {
    fs.mkdirSync(localEmailDir, { recursive: true });
  }
}

// Create Nodemailer Transporter if credentials exist, otherwise create a mock transporter
let transporter: nodemailer.Transporter | null = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log("EmailService: SMTP Transporter initialized successfully.");
} else {
  console.log(
    `EmailService: SMTP not configured. Emails will be logged to console and written to local folder: ${localEmailDir}`,
  );
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<boolean> {
  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject,
    html,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(
        `EmailService: Real email sent to ${to} | Subject: ${subject}`,
      );
      return true;
    } catch (error) {
      console.error(`EmailService: Failed to send real email to ${to}:`, error);
      return false;
    }
  } else {
    // Mock Mode
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${timestamp}_to_${to.replace(/[@.]/g, "_")}.html`;
      const filePath = path.join(localEmailDir, filename);

      const logContent = `
<!-- 
  TO: ${to}
  SUBJECT: ${subject}
  DATE: ${new Date().toLocaleString()}
-->
${html}
      `;

      fs.writeFileSync(filePath, logContent.trim());
      console.log("==================================================");
      console.log(`EmailService (MOCK): Email Sent!`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`HTML saved to: file:///${filePath.replace(/\\/g, "/")}`);
      console.log("==================================================");
      return true;
    } catch (error) {
      console.error("EmailService: Failed to write mock email to file:", error);
      return false;
    }
  }
}

// 1. Verification Email
export async function sendVerificationEmail(
  toEmail: string,
  name: string,
  token: string,
) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const subject = "Verify Your ProjectVault Account";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #6d28d9; margin-bottom: 20px;">Welcome to ProjectVault!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${verifyUrl}" style="background-color: #6d28d9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Account</a>
      </div>
      <p>Or copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #718096;"><a href="${verifyUrl}">${verifyUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a0aec0;">This link will expire in 24 hours. If you did not sign up for ProjectVault, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: toEmail, subject, html });
}

// 2. Submission Notification to Admin
export async function sendSubmissionNoticeToAdmins(
  adminEmails: string[],
  studentName: string,
  projectTitle: string,
) {
  const subject = `New Project Submitted: ${projectTitle}`;
  const dashboardUrl = `${APP_URL}/admin/dashboard`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #6d28d9;">New Project Submission</h2>
      <p>Dear Administrator,</p>
      <p>A new student project has been submitted and is currently pending review.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 120px;">Submitted By:</td>
          <td style="padding: 8px 0;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Project Title:</td>
          <td style="padding: 8px 0;">${projectTitle}</td>
        </tr>
      </table>
      <div style="margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #6d28d9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Approval Dashboard</a>
      </div>
    </div>
  `;

  // Send email to all admins
  const promises = adminEmails.map((email) =>
    sendEmail({ to: email, subject, html }),
  );
  await Promise.all(promises);
}

// 3. Status Notification to Student
export async function sendProjectStatusNotification(
  studentEmail: string,
  studentName: string,
  projectTitle: string,
  status: "approved" | "rejected",
  notes?: string,
) {
  const subject = `Project Submission ${status === "approved" ? "Approved" : "Reviewed"}: ${projectTitle}`;
  const statusColor = status === "approved" ? "#10b981" : "#ef4444";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: ${statusColor};">Project Submission ${status === "approved" ? "Approved!" : "Reviewed"}</h2>
      <p>Hello ${studentName},</p>
      <p>Your project submission <strong>"${projectTitle}"</strong> has been reviewed by the administrator.</p>
      <p>Status: <strong style="color: ${statusColor}; text-transform: uppercase;">${status}</strong></p>
      ${notes ? `<p><strong>Feedback:</strong> ${notes}</p>` : ""}
      <p>Thank you for contributing to collegiate innovation.</p>
      <div style="margin: 20px 0;">
        <a href="${APP_URL}/admin/dashboard" style="background-color: #6d28d9; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Dashboard</a>
      </div>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject, html });
}

// 4. Inquiry Alert to Student Owner
export async function sendInquiryNotification(
  studentEmail: string,
  studentName: string,
  projectTitle: string,
  visitorName: string,
  visitorEmail: string,
  inquirySubject: string,
  message: string,
) {
  const subject = `New Inquiry on your Project: ${inquirySubject}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #6d28d9;">New Project Inquiry</h2>
      <p>Hello ${studentName},</p>
      <p>A visitor has sent a query regarding your project <strong>"${projectTitle}"</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>From:</strong> ${visitorName} (<a href="mailto:${visitorEmail}">${visitorEmail}</a>)</p>
        <p><strong>Subject:</strong> ${inquirySubject}</p>
        <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
      </div>
      
      <p>You can respond directly to the inquirer by replying to this email or contacting them at <a href="mailto:${visitorEmail}">${visitorEmail}</a>.</p>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject, html });
}

// 5. Subscription Alert to Visitors
export async function sendProjectUpdateNotification(
  visitorEmail: string,
  visitorName: string,
  projectTitle: string,
  projectId: string,
) {
  const projectUrl = `${APP_URL}/projects/${projectId}`;
  const subject = `Update: Subscribed Project "${projectTitle}" has been edited`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #6d28d9;">Subscribed Project Update</h2>
      <p>Hello ${visitorName},</p>
      <p>A project you are subscribed to, <strong>"${projectTitle}"</strong>, has been updated by its authors.</p>
      <p>You can view the latest updates, technical specifications, and resources on the project details page:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${projectUrl}" style="background-color: #6d28d9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Project Details</a>
      </div>
    </div>
  `;
  return sendEmail({ to: visitorEmail, subject, html });
}
