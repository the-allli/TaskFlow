import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../../config/cloudinary.config.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    dp: { type: String, default: null },
    cloudinary_id: {
      type: String,
      default: null,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: false,
    },
    email_varification_token: { type: Number, default: null },
    password_reset_token: { type: String, default: null },
    is_varified: { type: Boolean, default: false },
    lastEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// hooks
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre("findOneAndDelete", async function () {
  const userId = this.getQuery()._id;

  const user = await mongoose.model("User").findById(userId).lean();
  if (user?.cloudinary_id) {
    await cloudinary.uploader.destroy(user.cloudinary_id);
  }

  const ownedWorkspaces = await mongoose
    .model("Workspace")
    .find({ ownerId: userId }, "_id")
    .lean();

  for (const workspace of ownedWorkspaces) {
    await mongoose.model("Workspace").findOneAndDelete({ _id: workspace._id });
  }

  await mongoose.model("WorkspaceMember").deleteMany({ userId });

  await mongoose.model("Subscription").deleteMany({ adminId: userId });
  await mongoose.model("PaymentHistory").deleteMany({ adminId: userId });
});

// methods
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m",
    },
  );
};

export default mongoose.model("User", userSchema);
