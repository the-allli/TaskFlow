import cron from "node-cron";
import User from "../db/models/User.modal.js";
import { sendVerificationEmail } from "../lib/nodemailer/emails.js";

cron.schedule("0 0 * * *", async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const unverifiedUsers = await User.find({
      is_varified: false,
      email_varification_token: { $exists: true },
      createdAt: { $gte: threeDaysAgo },
      $or: [
        { lastEmailSentAt: { $exists: false } },
        { lastEmailSentAt: { $lte: oneDayAgo } },
      ],
    });

    if (unverifiedUsers.length === 0) return;

    for (const user of unverifiedUsers) {
      await sendVerificationEmail(
        user.email,
        user.name,
        user.email_varification_token,
      );
      user.lastEmailSentAt = new Date();
      await user.save();
    }
  } catch (error) {
    console.error("Email cron failed:", error.message);
  }
});

cron.schedule("0 12 * * *", async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await User.deleteMany({
      is_varified: false,
      createdAt: { $lte: threeDaysAgo },
    });
  } catch (error) {
    console.error("Cleanup cron failed:", error.message);
  }
});
