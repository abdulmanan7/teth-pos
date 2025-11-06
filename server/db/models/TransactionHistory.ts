import mongoose, { Schema, Document } from "mongoose";

export interface ITransactionHistory extends Document {
  transaction_id: string;
  transaction_type: "stock_in" | "stock_out" | "adjustment" | "transfer" | "return" | "damage" | "expiry_disposal";
  product_id: string;
  warehouse_id?: string;
  from_warehouse?: string;
  to_warehouse?: string;
  quantity: number;
  unit_price?: number;
  total_value?: number;
  reference_type?: "purchase_order" | "sales_order" | "adjustment" | "transfer" | "return" | "other";
  reference_id?: string;
  lot_id?: string;
  serial_numbers?: string[];
  user_id?: string;
  user_name?: string;
  reason?: string;
  notes?: string;
  status: "completed" | "pending" | "cancelled";
  approval_required: boolean;
  approved_by?: string;
  approved_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const TransactionHistorySchema = new Schema<ITransactionHistory>(
  {
    transaction_id: { type: String, required: true, unique: true, index: true },
    transaction_type: {
      type: String,
      enum: ["stock_in", "stock_out", "adjustment", "transfer", "return", "damage", "expiry_disposal"],
      required: true,
      index: true,
    },
    product_id: { type: String, required: true, index: true },
    warehouse_id: { type: String, index: true },
    from_warehouse: { type: String },
    to_warehouse: { type: String },
    quantity: { type: Number, required: true },
    unit_price: { type: Number },
    total_value: { type: Number },
    reference_type: {
      type: String,
      enum: ["purchase_order", "sales_order", "adjustment", "transfer", "return", "other"],
    },
    reference_id: { type: String },
    lot_id: { type: String },
    serial_numbers: [String],
    user_id: { type: String },
    user_name: { type: String },
    reason: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ["completed", "pending", "cancelled"],
      default: "completed",
      index: true,
    },
    approval_required: { type: Boolean, default: false },
    approved_by: { type: String },
    approved_date: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance
TransactionHistorySchema.index({ created_at: -1 });
TransactionHistorySchema.index({ product_id: 1, created_at: -1 });
TransactionHistorySchema.index({ warehouse_id: 1, created_at: -1 });
TransactionHistorySchema.index({ transaction_type: 1, created_at: -1 });
TransactionHistorySchema.index({ status: 1, created_at: -1 });
TransactionHistorySchema.index({ user_id: 1, created_at: -1 });

export const TransactionHistory = (mongoose.models.TransactionHistory ||
  mongoose.model<ITransactionHistory>(
    "TransactionHistory",
    TransactionHistorySchema
  )) as mongoose.Model<ITransactionHistory>;
