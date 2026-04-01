import ApiError from "../utils/api_error.js";

export const requireAdmin = (req, res, next) => {
  if (req.user?.role?.name !== "admin") {
    throw new ApiError(403, "Only admin can perform this action.");
  }
  next();
};
