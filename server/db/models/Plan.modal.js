import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    weight: { type: Number, default: 0 },
    price: { type: Number, required: true },
    period: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    limits: {
      maxWorkspaces: { type: Number, default: 1 },
      maxMembersInAWorkspace: { type: Number, default: 3 },
      maxProjectsInAWorkspace: { type: Number, default: 1 },
      maxTasksInAProject: { type: Number, default: 1 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Plan", planSchema);
