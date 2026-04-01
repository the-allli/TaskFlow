import { create } from "zustand";
import {
  fetchSubscriptionApi,
  fetchPaymentHistoryApi,
  checkoutApi,
  cancelSubscriptionApi,
  downgradeToFreeApi,
  getPlansApi,
} from "../api/payment.api";

const usePaymentStore = create((set) => ({
  subscription: null,
  history: [],
  subPlans: null,
  loading: false,

  getPlans: async () => {
    try {
      const { data } = await getPlansApi();
      set({ subPlans: data.data });
    } catch (error) {
      console.error(error.message);
    }
  },

  fetchSubscription: async (userId) => {
    try {
      const { data } = await fetchSubscriptionApi(userId);
      set({ subscription: data.data });
    } catch (error) {
      console.error(error.message);
    }
  },

  fetchHistory: async (userId) => {
    set({ loading: true });
    try {
      const { data } = await fetchPaymentHistoryApi(userId);
      set({ history: data.data || [] });
    } catch (error) {
      console.error(error.message);
    } finally {
      set({ loading: false });
    }
  },

  checkout: async (plan) => {
    try {
      const { data } = await checkoutApi(plan);
      const responseData = data.data;
      if (responseData.url) {
        return { success: true, url: responseData.url };
      }
      return { success: true, updated: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  cancelSubscription: async (userId) => {
    try {
      await cancelSubscriptionApi(userId);
      set((state) => ({
        subscription: { ...state.subscription, cancelAtPeriodEnd: true },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  downgradeToFree: async (userId) => {
    try {
      await downgradeToFreeApi(userId);
      set({ subscription: null });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },
}));

export default usePaymentStore;
