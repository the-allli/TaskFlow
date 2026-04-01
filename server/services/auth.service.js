import crypto from "crypto";
import cloudinary from "../config/cloudinary.config.js";
import * as userRepository from "../repositories/auth.repository.js";
import * as paymentRepository from "../repositories/payment.repository.js";
import * as planRepository from "../repositories/plan.repository.js";
import generateAccessToken from "../lib/token.js";
import UserDto from "../db/dtos/user.DTO.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../lib/nodemailer/emails.js";
import ApiResponse from "../utils/api_response.js";
import ApiError from "../utils/api_error.js";
import uploadToCloudinary from "../lib/cloudinary.js";

export const registerUser = async (req, res) => {
  const { userRole, name, email, password } = req.body;

  const role = await userRepository.findRoleByName(userRole);
  const randomAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${Date.now()}`;
  const emailVerificationToken = Math.floor(100000 + Math.random() * 900000);

  const user = await userRepository.createUser({
    name,
    email,
    password,
    dp: randomAvatar,
    role: role._id,
    email_varification_token: emailVerificationToken,
  });
  if (!user)
    throw new ApiError(500, "Something went wrong while registering the user");

  if (userRole.toLowerCase() === "admin") {
    const adminId = user._id.toString();
    const plan = await planRepository.findPlanByName("free");

    await paymentRepository.upsertSubscription(adminId, {
      adminId,
      planId: plan._id,
      status: "active",
    });

    user.plan = plan._id;
    user.save();

    await paymentRepository.createPaymentHistory({
      adminId,
      planId: plan._id,
      amount: plan.price,
      status: "paid",
      invoiceDate: new Date(),
    });
  }

  await sendVerificationEmail(user.email, user.name, emailVerificationToken);

  return res
    .status(201)
    .json(
      new ApiResponse(201, new UserDto(user), "User registered Successfully"),
    );
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  const user = await userRepository.findUserByCode(Number(code));
  if (!user) throw new ApiError(404, "Invalid or expired verification code");

  user.is_varified = true;
  user.email_varification_token = null;
  await user.save();

  await sendWelcomeEmail(user.email, user.name);

  return res
    .status(200)
    .json(
      new ApiResponse(200, new UserDto(user), "Email verified successfully"),
    );
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await userRepository.findUserByEmail(email);
  if (!user) throw new ApiError(404, "No account found with this email");

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.password_reset_token = resetToken;
  await user.save();

  await sendPasswordResetEmail(
    user.email,
    user.name,
    `${process.env.CLIENT_URL}/reset-password/${resetToken}`,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset link sent to your email"));
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  const user = await userRepository.findUserBy_password_reset_token(token);
  if (!user) throw new ApiError(400, "Invalid or expired reset token");

  user.password = password;
  user.password_reset_token = null;
  await user.save();

  await sendResetSuccessEmail(user.email, user.name);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successful"));
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await userRepository.findUserByEmail(email);
  if (!user) throw new ApiError(401, "Invalid email or password");

  const is_password = await user.comparePassword(password);
  if (!is_password) throw new ApiError(401, "Invalid email or password");

  const { accessToken } = generateAccessToken(user);

  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("jwt_access_token", accessToken, options)
    .json(
      new ApiResponse(200, new UserDto(user), "User logged In Successfully"),
    );
};

export const logoutUser = async (req, res) => {
  const options = { httpOnly: true, secure: true };

  return res
    .clearCookie("jwt_access_token", options)
    .status(200)
    .json({ user: null });
};

export const updateProfile = async (req, res) => {
  const { name } = req.body;

  const user = await userRepository.findUserById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;

  if (req.file) {
    if (user.cloudinary_id) {
      await cloudinary.uploader.destroy(user.cloudinary_id);
    }
    const result = await uploadToCloudinary(req.file.buffer);
    user.dp = result.secure_url;
    user.cloudinary_id = result.public_id;
  }

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, new UserDto(user), "Profile updated successfully"),
    );
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await userRepository.findUserById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
};
