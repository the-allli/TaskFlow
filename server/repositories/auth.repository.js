import User from "../db/models/User.modal.js";
import Role from "../db/models/Role.modal.js";

export const findRoleByName = async (name) => {
  return await Role.findOne({ name });
};

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).populate("role plan");
};

export const findUserByCode = async (code) => {
  return await User.findOne({ email_varification_token: code }).populate(
    "role plan",
  );
};

export const findUserBy_password_reset_token = async (token) => {
  return await User.findOne({ password_reset_token: token }).populate(
    "role plan",
  );
};

export const findUserById = async (id) => {
  return await User.findById(id).populate("role plan");
};
