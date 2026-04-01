import { body, param, validationResult } from "express-validator";

export const signUpValidationRules = [
  body("userRole")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["admin", "manager", "dev"])
    .withMessage("Role must be either admin, manager or dev"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long")
    .escape(),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("At least 6 characters")
    .matches(/[A-Z]/)
    .withMessage("Contains uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Contains lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Contains a number")
    .matches(/[!_@#$%^&*(),.?":{}|<>]/)
    .withMessage("Contains special character"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    next();
  },
];

export const varifyEmailValidationRule = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isNumeric()
    .withMessage("Code must only contain numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("Code must be exactly 6 digits"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }
    next();
  },
];

export const forgotPasswordValidationRule = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => err.msg),
      });
    }
    next();
  },
];

export const resetPasswordValidationRule = [
  param("token")
    .isHexadecimal()
    .withMessage("Invalid token format")
    .isLength({ min: 40, max: 40 })
    .withMessage("Token must be 40 characters long"),

  body("password")
    .isStrongPassword({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 6 characters and include: uppercase, lowercase, a number, and a special character",
    ),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => err.msg),
      });
    }
    next();
  },
];

export const loginValidationRules = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isStrongPassword({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 6 characters and include: uppercase, lowercase, a number, and a special character",
    ),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => err.msg),
      });
    }
    next();
  },
];
