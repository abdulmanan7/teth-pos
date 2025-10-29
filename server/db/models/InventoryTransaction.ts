import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryTransaction extends Document {
  product_id: string;
  warehouse_id: string;
  lot_id?: string;
  serial_id?: string;
  transaction_type: string;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  transaction_date: Date;
  description?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    product_id: { type: String, required: true },
    warehouse_id: { type: String, required: true },
    lot_id: { type: String },
    serial_id: { type: String },
    transaction_type: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_cost: { type: Number, default: 0 },
    reference_type: { type: String },
    reference_id: { type: String },
    from_warehouse_id: { type: String },
    to_warehouse_id: { type: String },
    transaction_date: { type: Date, required: true },
    description: { type: String },
    created_by: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
InventoryTransactionSchema.index({ product_id: 1, warehouse_id: 1 });
InventoryTransactionSchema.index({ transaction_date: 1 });
InventoryTransactionSchema.index({ lot_id: 1 });
InventoryTransactionSchema.index({ serial_id: 1 });
InventoryTransactionSchema.index({ reference_type: 1, reference_id: 1 });
InventoryTransactionSchema.index({ transaction_type: 1 });

export const InventoryTransaction =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>(
    "InventoryTransaction",
    InventoryTransactionSchema
  );
