import { create } from "zustand";
import {
  signupApi,
  verifyEmailApi,
  forgotPasswordApi,
  resetPasswordApi,
  loginApi,
  logoutApi,
  checkAuthApi,
  updateProfileApi,
  changePasswordApi,
} from "../api/auth.api";

const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  message: null,

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      await signupApi(userData);
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response.data.message || "Error signing up",
      });
      throw error;
    }
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null });
    try {
      await verifyEmailApi(code);
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response.data.message || "Error verifying email",
      });
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await forgotPasswordApi(email);
      set({ message: res.data.message, isLoading: false });
    } catch (error) {
      set({
        error:
          error.response.data.message || "Error sending reset password email",
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await resetPasswordApi(token, password);
      set({ message: res.data.message, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response.data.message || "Error resetting password",
      });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await loginApi(email, password);
      set({
        authUser: res.data.data,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Error logging in",
        isAuthenticated: false,
        authUser: null,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutApi();
    } catch (error) {
      console.error(
        "Logout request failed, but clearing local state anyway.",
        error.message,
      );
    } finally {
      set({
        authUser: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });

    try {
      const res = await checkAuthApi();
      if (res.data?.auth && res.data?.user) {
        set({
          authUser: res.data.user,
          isAuthenticated: true,
          isCheckingAuth: false,
        });
        return;
      }
    } catch (error) {
      console.log("check-auth failed:", error.message);
    }

    set({ authUser: null, isAuthenticated: false, isCheckingAuth: false });
  },

  updateProfile: async (name, file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (file) formData.append("profile_img", file);
      const res = await updateProfileApi(formData);
      set({ authUser: res.data.data, isLoading: false });
      return res.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Error updating profile",
      });
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const res = await changePasswordApi(currentPassword, newPassword);
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || "Error changing password",
      });
      throw error;
    }
  },
}));

export default useAuthStore;
