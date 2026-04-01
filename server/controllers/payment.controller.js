import asyncHandler from "../utils/async_handler.js";
import * as paymentService from "../services/payment.service.js";

export const getSubscription = asyncHandler(paymentService.getSubscription);
export const getPaymentHistory = asyncHandler(paymentService.getPaymentHistory);
export const createCheckoutSession = asyncHandler(
  paymentService.createCheckoutSession,
);
export const cancelSubscription = asyncHandler(
  paymentService.cancelSubscription,
);
export const downgradeToFree = asyncHandler(paymentService.downgradeToFree);
export const getPlans = asyncHandler(paymentService.getPlans);
export const stripeWebhook = paymentService.stripeWebhook;
