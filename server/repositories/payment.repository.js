import Subscription from "../db/models/Subscription.modal.js";
import PaymentHistory from "../db/models/PaymentHistory.modal.js";

export const findSubscriptionByAdminId = async (adminId) => {
  return await Subscription.findOne({ adminId }).populate("planId");
};

export const findPaymentHistoryByAdminId = async (adminId) => {
  return await PaymentHistory.find({ adminId })
    .populate("planId")
    .sort({ invoiceDate: -1 });
};

export const upsertSubscription = async (adminId, data) => {
  return await Subscription.findOneAndUpdate({ adminId }, data, {
    upsert: true,
    returnDocument: "after",
  });
};

export const findSubscriptionByStripeId = async (stripeSubscriptionId) => {
  return await Subscription.findOne({ stripeSubscriptionId }).populate(
    "planId",
  );
};

export const findSubscriptionByCustomerId = async (stripeCustomerId) => {
  return await Subscription.findOne({ stripeCustomerId }).populate("planId");
};

export const updateSubscriptionByStripeId = async (
  stripeSubscriptionId,
  data,
) => {
  return await Subscription.findOneAndUpdate({ stripeSubscriptionId }, data);
};

export const updateSubscriptionByAdminId = async (adminId, data) => {
  return await Subscription.findOneAndUpdate({ adminId }, data);
};

export const createPaymentHistory = async (data) => {
  return await PaymentHistory.create(data);
};
