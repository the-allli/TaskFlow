import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
      default: "TODO",
    },
    type: {
      type: String,
      enum: ["TASK", "BUG", "FEATURE", "IMPROVEMENT"],
      default: "TASK",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    due_date: { type: Date, required: true },
  },
  { timestamps: true },
);

taskSchema.pre("findOneAndDelete", async function () {
  const taskId = this.getQuery()._id;

  await mongoose.model("File").deleteMany({ taskId });

  await mongoose
    .model("Project")
    .updateOne({ tasks: taskId }, { $pull: { tasks: taskId } });
});

export default mongoose.model("Task", taskSchema);
