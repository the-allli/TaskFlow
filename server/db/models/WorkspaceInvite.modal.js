import mongoose from "mongoose";

const workspaceInviteSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate invites for same email in same workspace
workspaceInviteSchema.index({ workspaceId: 1, email: 1 }, { unique: true });

export default mongoose.model("WorkspaceInvite", workspaceInviteSchema);
