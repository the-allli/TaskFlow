import jwt from "jsonwebtoken";
import UserDto from "../db/dtos/user.DTO.js";
import { findUserById } from "../repositories/auth.repository.js";
import ApiError from "../utils/api_error.js";
import generateAccessToken from "../lib/token.js";

const COOKIE_OPTIONS = { httpOnly: true, secure: true };

const auth = async (req, _, next) => {
  try {
    const token = req.cookies?.jwt_access_token;
    if (!token) {
      return next(new ApiError(401, "Authentication required. Please log in."));
    }

    try {
      const decodedToken = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET,
      );
      const user = await findUserById(decodedToken?.id);
      if (!user) {
        return next(new ApiError(404, "User no longer exists"));
      }
      req.user = new UserDto(user);
      next();
    } catch (jwtError) {
      if (jwtError.name !== "TokenExpiredError") {
        return next(new ApiError(401, "Invalid session."));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, {
        ignoreExpiration: true,
      });

      const user = await findUserById(decoded?.id);
      if (!user) {
        return next(new ApiError(404, "User no longer exists"));
      }

      const { accessToken } = generateAccessToken(user);
      req.res.cookie("jwt_access_token", accessToken, COOKIE_OPTIONS);

      req.user = new UserDto(user);
      next();
    }
  } catch (error) {
    next(error);
  }
};

export default auth;
