import { axiosInstance } from "../lib/axios";

export const signupApi = (userData) =>
  axiosInstance.post("/auth/register", userData);

export const verifyEmailApi = (code) =>
  axiosInstance.post("/auth/varify-email", { code });

export const forgotPasswordApi = (email) =>
  axiosInstance.post("/auth/forgot-password", { email });

export const resetPasswordApi = (token, password) =>
  axiosInstance.post(`/auth/reset-password/${token}`, { password });

export const loginApi = (email, password) =>
  axiosInstance.post("/auth/log-in", { email, password });

export const logoutApi = () => axiosInstance.post("/auth/log-out");

export const checkAuthApi = () => axiosInstance.get("/auth/check-auth");

export const updateProfileApi = (formData) =>
  axiosInstance.put("/auth/update-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const changePasswordApi = (currentPassword, newPassword) =>
  axiosInstance.put("/auth/change-password", { currentPassword, newPassword });
