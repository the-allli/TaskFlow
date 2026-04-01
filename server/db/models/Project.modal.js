import mongoose from "mongoose";
import cloudinary from "../../config/cloudinary.config.js";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    team_lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProjectMember" }],
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true },
);

projectSchema.pre("findOneAndDelete", async function () {
  const projectId = this.getQuery()._id;

  const tasks = await mongoose.model("Task").find({ projectId });
  const taskIds = tasks.map((t) => t._id);
  await mongoose.model("Comment").deleteMany({ taskId: { $in: taskIds } });

  const files = await mongoose.model("File").find({ projectId });

  if (files.length > 0) {
    const cloudinaryIds = files.map((f) => f.cloudinary_id).filter((id) => id);

    if (cloudinaryIds.length > 0) {
      await cloudinary.api.delete_resources(cloudinaryIds);
    }
  }

  await mongoose.model("File").deleteMany({ projectId });
  await mongoose.model("Task").deleteMany({ projectId });
  await mongoose.model("ProjectMember").deleteMany({ projectId });

  await mongoose
    .model("Workspace")
    .updateOne({ projects: projectId }, { $pull: { projects: projectId } });
});

export default mongoose.model("Project", projectSchema);
