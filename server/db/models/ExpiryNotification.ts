import mongoose, { Schema, Document } from "mongoose";

export interface IExpiryNotification extends Document {
  lot_id?: string; // Optional: for lot-based tracking
  batch_id?: string; // Optional: for batch-based tracking (market purchases)
  product_id: string;
  warehouse_id?: string;
  notification_type: "expired" | "expiring_soon" | "upcoming";
  expiry_date: Date;
  days_until_expiry: number;
  quantity: number;
  status: "active" | "acknowledged" | "resolved";
  acknowledged_by?: string;
  acknowledged_date?: Date;
  resolved_date?: Date;
  resolution_type?: "used" | "disposed" | "transferred" | "other";
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const ExpiryNotificationSchema = new Schema<IExpiryNotification>(
  {
    lot_id: { type: String }, // Optional: for lot-based tracking
    batch_id: { type: String, index: true }, // Optional: for batch-based tracking
    product_id: { type: String, required: true },
    warehouse_id: { type: String },
    notification_type: {
      type: String,
      enum: ["expired", "expiring_soon", "upcoming"],
      required: true,
    },
    expiry_date: { type: Date, required: true },
    days_until_expiry: { type: Number, required: true },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
    },
    acknowledged_by: { type: String },
    acknowledged_date: { type: Date },
    resolved_date: { type: Date },
    resolution_type: {
      type: String,
      enum: ["used", "disposed", "transferred", "other"],
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
ExpiryNotificationSchema.index({ lot_id: 1 });
ExpiryNotificationSchema.index({ product_id: 1 });
ExpiryNotificationSchema.index({ warehouse_id: 1 });
ExpiryNotificationSchema.index({ status: 1 });
ExpiryNotificationSchema.index({ notification_type: 1 });
ExpiryNotificationSchema.index({ expiry_date: 1 });
ExpiryNotificationSchema.index({ created_at: -1 });

export const ExpiryNotification = (mongoose.models.ExpiryNotification ||
  mongoose.model<IExpiryNotification>(
    "ExpiryNotification",
    ExpiryNotificationSchema
  )) as mongoose.Model<IExpiryNotification>;
