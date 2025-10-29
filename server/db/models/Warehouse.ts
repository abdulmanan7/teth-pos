import mongoose, { Schema, Document } from "mongoose";

export interface IWarehouse extends Document {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zip_code: { type: String },
    phone: { type: String },
    email: { type: String },
    manager_id: { type: String },
    is_active: { type: Boolean, default: true },
    notes: { type: String },
    created_by: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
// Note: code has unique: true which creates an index automatically
WarehouseSchema.index({ is_active: 1 });

export const Warehouse =
  mongoose.models.Warehouse ||
  mongoose.model<IWarehouse>("Warehouse", WarehouseSchema);
