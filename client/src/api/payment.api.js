import { axiosInstance } from "../lib/axios";

export const fetchSubscriptionApi = (userId) =>
  axiosInstance.get(`/payment/${userId}/subscription`);

export const fetchPaymentHistoryApi = (userId) =>
  axiosInstance.get(`/payment/${userId}/history`);

export const checkoutApi = (plan) =>
  axiosInstance.post("/payment/checkout", { plan });

export const cancelSubscriptionApi = (userId) =>
  axiosInstance.delete(`/payment/${userId}/subscription`);

export const downgradeToFreeApi = (userId) =>
  axiosInstance.delete(`/payment/${userId}/downgrade`);

export const getPlansApi = () =>
  axiosInstance.get(`/payment/plans`);
