import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: {
        values: ["admin", "manager", "dev"],
        message: "{VALUE} is not a supported role",
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Role", roleSchema);

