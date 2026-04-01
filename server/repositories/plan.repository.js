import Plan from "../db/models/Plan.modal.js";

export const findPlanByName = async (key) => {
  return await Plan.findOne({ key });
};

export const findPlans = async () => {
  return await Plan.find();
};
