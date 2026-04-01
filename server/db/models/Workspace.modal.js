import mongoose from "mongoose";
import cloudinary from "../../config/cloudinary.config.js";

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    image_url: { type: String, default: null },
    invite_code: { type: String, default: null },
    cloudinary_id: { type: String, default: null },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkspaceMember",
      },
    ],
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  { timestamps: true },
);

workspaceSchema.pre("findOneAndDelete", async function () {
  const workspaceId = this.getQuery()._id;

  const workspace = await mongoose
    .model("Workspace")
    .findById(workspaceId)
    .lean();

  if (workspace?.cloudinary_id) {
    await cloudinary.uploader.destroy(workspace.cloudinary_id);
  }

  const projects = await mongoose
    .model("Project")
    .find({ workspaceId }, "_id")
    .lean();
  const projectIds = projects.map((p) => p._id);

  if (projectIds.length > 0) {
    const tasks = await mongoose
      .model("Task")
      .find({ projectId: { $in: projectIds } }, "_id")
      .lean();
    const taskIds = tasks.map((t) => t._id);

    if (taskIds.length > 0) {
      await mongoose.model("Comment").deleteMany({ taskId: { $in: taskIds } });
    }

    const files = await mongoose
      .model("File")
      .find({ projectId: { $in: projectIds } }, "cloudinary_id")
      .lean();

    if (files.length > 0) {
      const cloudinaryIds = files.map((f) => f.cloudinary_id).filter(Boolean);
      if (cloudinaryIds.length > 0) {
        await cloudinary.api.delete_resources(cloudinaryIds);
      }
      await mongoose
        .model("File")
        .deleteMany({ projectId: { $in: projectIds } });
    }

    await mongoose.model("Task").deleteMany({ projectId: { $in: projectIds } });

    await mongoose
      .model("ProjectMember")
      .deleteMany({ projectId: { $in: projectIds } });

    await mongoose.model("Project").deleteMany({ workspaceId });
  }

  await mongoose.model("WorkspaceMember").deleteMany({ workspaceId });
});

export default mongoose.model("Workspace", workspaceSchema);
