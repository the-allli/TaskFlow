import asyncHandler from "../utils/async_handler.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(authService.registerUser);
export const verifyEmail = asyncHandler(authService.verifyEmail);
export const forgotPassword = asyncHandler(authService.forgotPassword);
export const resetPassword = asyncHandler(authService.resetPassword);
export const login = asyncHandler(authService.loginUser);
export const logout = asyncHandler(authService.logoutUser);
export const updateProfile = asyncHandler(authService.updateProfile);
export const changePassword = asyncHandler(authService.changePassword);

