import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["Cashier", "Manager", "Supervisor", "Admin"],
      default: "Cashier",
    },
    pin: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 6,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    is_logged_in: {
      type: Boolean,
      default: false,
    },
    last_login: {
      type: Date,
      default: null,
    },
    last_logout: {
      type: Date,
      default: null,
    },
    login_session_id: {
      type: String,
      default: null,
    },
    total_sales: {
      type: Number,
      default: 0,
    },
    total_transactions: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for faster queries
staffSchema.index({ pin: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ is_logged_in: 1 });

export default mongoose.model("Staff", staffSchema);
