import nodemailer from "nodemailer";

export const sender = {
  email: process.env.NODEMAILER_EMAIL_FROM,
  name: "TaskFlow",
};
export const transporter =
  process.env.NODE_ENV === "test"
    ? {
        sendMail: async () => ({ messageId: "test-id" }),
      }
    : nodemailer.createTransport({
        service: process.env.NODEMAILER_EMAIL_SERVICE,
        auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      });
