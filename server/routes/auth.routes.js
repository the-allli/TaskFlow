import express from "express";
import {
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
  login,
  logout,
  changePassword,
  updateProfile,
} from "../controllers/auth.controller.js";
import {
  signUpValidationRules,
  varifyEmailValidationRule,
  forgotPasswordValidationRule,
  resetPasswordValidationRule,
  loginValidationRules,
} from "../lib/express_validator.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authLimiter } from "../middlewares/rate_limiter.middleware.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  signUpValidationRules,
  register,
);
router.post(
  "/varify-email",
  authLimiter,
  varifyEmailValidationRule,
  verifyEmail,
);
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidationRule,
  forgotPassword,
);
router.post(
  "/reset-password/:token",
  authLimiter,
  resetPasswordValidationRule,
  resetPassword,
);
router.post(
  "/log-in",
  authLimiter,
  loginValidationRules,
  login,
);
router.post("/log-out", auth, logout);
router.get("/profile", auth, (req, res) => res.status(200).json(req.user));
router.get("/check-auth", auth, (req, res) =>
  res.status(200).json({ user: req.user, auth: true }),
);
router.put(
  "/update-profile",
  auth,
  upload.single("profile_img"),
  updateProfile,
);
router.put("/change-password", auth, changePassword);

export default router;
