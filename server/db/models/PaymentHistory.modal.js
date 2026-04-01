import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripeInvoiceId: { type: String, required: false, default: null },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["paid", "failed", "pending"],
      default: "pending",
    },
    invoicePdfUrl: { type: String, default: null },
    invoiceDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("PaymentHistory", paymentHistorySchema);
