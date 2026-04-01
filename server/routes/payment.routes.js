import express from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  getSubscription,
  getPaymentHistory,
  createCheckoutSession,
  cancelSubscription,
  downgradeToFree,
  stripeWebhook,
  getPlans,
} from "../controllers/payment.controller.js";
import { paymentLimiter } from "../middlewares/rate_limiter.middleware.js";
import { requireAdmin } from "../middlewares/require_admin.middleware.js";

const router = express.Router();

router.post("/webhook", stripeWebhook);
router.get("/plans", auth, requireAdmin, getPlans);
router.get(
  "/:userId/subscription",
  auth,
  requireAdmin,
  paymentLimiter,
  getSubscription,
);
router.get(
  "/:userId/history",
  auth,
  requireAdmin,
  paymentLimiter,
  getPaymentHistory,
);
router.post(
  "/checkout",
  auth,
  requireAdmin,
  paymentLimiter,
  createCheckoutSession,
);
router.delete(
  "/:userId/subscription",
  auth,
  requireAdmin,
  paymentLimiter,
  cancelSubscription,
);
router.delete(
  "/:userId/downgrade",
  auth,
  requireAdmin,
  paymentLimiter,
  downgradeToFree,
);

export default router;
