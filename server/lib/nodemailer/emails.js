import renderEmail from "./email_renderer.js";
import { transporter, sender } from "../../config/nodemailer.config.js";

export const sendVerificationEmail = async (email, name, verificationToken) => {
  const html = await renderEmail("VERIFICATION_EMAIL_TEMPLATE", {
    name,
    verificationToken,
  });
  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Verify your email",
      html,
    });
  } catch (error) {
    throw new Error(`Error sending verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const html = await renderEmail("WELCOME_EMAIL_TEMPLATE", {
    name,
    dashBoardUrl: process.env.CLIENT_URL,
  });
  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Welcome to our App! 🎉",
      html,
      category: "Wellcome Email",
    });
  } catch (error) {
    throw new Error(`Error sending welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, name, resetURL) => {
  const html = await renderEmail("PASSWORD_RESET_REQUEST_TEMPLATE", {
    name,
    resetURL,
  });
  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Reset your password",
      html,
      category: "Password Reset",
    });
  } catch (error) {
    throw new Error(`Error sending password reset email: ${error.message}`);
  }
};

export const sendResetSuccessEmail = async (email, name) => {
  const html = await renderEmail("PASSWORD_RESET_SUCCESS_TEMPLATE", {
    name,
  });
  try {
    const response = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Password Reset Successful",
      html,
      category: "Password Reset",
    });
  } catch (error) {
    throw new Error(
      `Error sending password reset success email: ${error.message}`,
    );
  }
};

export const sendInviteEmail = async ({
  to,
  workspaceName,
  inviteLink,
  invitedByName,
  role,
}) => {
  const linkWithRole = `${inviteLink}?role=${role}`;

  await transporter.sendMail({
    from: `"${invitedByName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `You're invited to join ${workspaceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>You've been invited!</h2>
        <p><strong>${invitedByName}</strong> invited you to join <strong>${workspaceName}</strong>.</p>
        <a href="${linkWithRole}" target="_blank"
           style="display:inline-block;margin-top:16px;padding:10px 24px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none;">
          Accept Invitation
        </a>
        <p style="margin-top:16px;color:#888;font-size:12px;">
          If you didn't expect this, you can ignore this email.
        </p>
      </div>
    `,
  });
};

export const sendProjectMemberAddedEmail = async ({
  email,
  name,
  projectName,
  workspaceName,
  description,
  dashboardUrl = process.env.CLIENT_URL,
}) => {
  const html = await renderEmail("PROJECT_MEMBER_ADDED_TEMPLATE", {
    name,
    projectName,
    workspaceName,
    description,
    dashboardUrl,
  });
  try {
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: `You've been added to project: ${projectName}`,
      html,
      category: "Project Member Added",
    });
  } catch (error) {
    throw new Error(
      `Error sending project member added email: ${error.message}`,
    );
  }
};

export const sendProjectMemberRemovedEmail = async ({
  email,
  name,
  projectName,
  workspaceName,
  removedBy,
  dashboardUrl = process.env.CLIENT_URL,
}) => {
  const html = await renderEmail("PROJECT_MEMBER_REMOVED_TEMPLATE", {
    name,
    projectName,
    workspaceName,
    removedBy,
    dashboardUrl,
  });
  try {
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: `You've been removed from project: ${projectName}`,
      html,
      category: "Project Member Removed",
    });
  } catch (error) {
    throw new Error(
      `Error sending project member removed email: ${error.message}`,
    );
  }
};

export const sendTaskAssignedEmail = async ({
  email,
  assigneeName,
  taskTitle,
  taskDescription,
  projectName,
  taskType,
  priority,
  dueDate,
  taskUrl = process.env.CLIENT_URL,
}) => {
  const priorityColorMap = {
    LOW: "#60a5fa",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    URGENT: "#7c3aed",
  };
  const priorityColor = priorityColorMap[priority] || "#60a5fa";

  const html = await renderEmail("TASK_ASSIGNED_TEMPLATE", {
    assigneeName,
    taskTitle,
    taskDescription,
    projectName,
    taskType,
    priority,
    priorityColor,
    dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : null,
    taskUrl,
  });
  try {
    await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: `New task assigned: ${taskTitle}`,
      html,
      category: "Task Assigned",
    });
  } catch (error) {
    throw new Error(`Error sending task assigned email: ${error.message}`);
  }
};
