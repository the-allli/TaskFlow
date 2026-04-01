import mongoose from "mongoose";

const workspaceMemberSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
  },
  { timestamps: true },
);

workspaceMemberSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export default mongoose.model("WorkspaceMember", workspaceMemberSchema);
