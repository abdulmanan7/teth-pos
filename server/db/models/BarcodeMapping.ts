import mongoose, { Schema, Document } from "mongoose";

export interface IBarcodeMapping extends Document {
  barcode: string;
  barcode_type: "sku" | "lot" | "serial" | "custom";
  product_id: string;
  lot_id?: string;
  serial_number?: string;
  warehouse_id?: string;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const BarcodeMappingSchema = new Schema<IBarcodeMapping>(
  {
    barcode: { type: String, required: true, unique: true, index: true },
    barcode_type: {
      type: String,
      enum: ["sku", "lot", "serial", "custom"],
      required: true,
      index: true,
    },
    product_id: { type: String, required: true, index: true },
    lot_id: { type: String },
    serial_number: { type: String },
    warehouse_id: { type: String },
    is_active: { type: Boolean, default: true, index: true },
    created_by: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
BarcodeMappingSchema.index({ barcode: 1, is_active: 1 });
BarcodeMappingSchema.index({ product_id: 1, barcode_type: 1 });

export const BarcodeMapping = (mongoose.models.BarcodeMapping ||
  mongoose.model<IBarcodeMapping>("BarcodeMapping", BarcodeMappingSchema)) as mongoose.Model<IBarcodeMapping>;
