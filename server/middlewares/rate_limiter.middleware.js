import rateLimit from "express-rate-limit";

export const authLimiter =
  process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next, options) => {
          const retryAfter = Math.ceil(options.windowMs / 1000 / 60);
          res.status(429).json({
            message: `Too many attempts. Please try again after ${retryAfter} minutes.`,
            retryAfter: options.windowMs / 1000,
          });
        },
      });

export const paymentLimiter =
  process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next, options) => {
          const retryAfter = Math.ceil(options.windowMs / 1000 / 60);
          res.status(429).json({
            message: `Too many attempts. Please try again after ${retryAfter} minutes.`,
            retryAfter: options.windowMs / 1000,
          });
        },
      });

export const generalLimiter =
  process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next, options) => {
          const retryAfter = Math.ceil(options.windowMs / 1000 / 60);
          res.status(429).json({
            message: `Too many attempts. Please try again after ${retryAfter} minutes.`,
            retryAfter: options.windowMs / 1000,
          });
        },
      });

export const adminLimiter =
  process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next, options) => {
          const retryAfter = Math.ceil(options.windowMs / 1000 / 60);
          res.status(429).json({
            message: `Too many admin requests. Please try again after ${retryAfter} minutes.`,
            retryAfter: options.windowMs / 1000,
          });
        },
      });
