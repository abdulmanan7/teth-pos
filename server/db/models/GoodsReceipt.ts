import mongoose, { Schema, Document } from "mongoose";

export interface GoodsReceiptItem {
  product_id: string;
  po_item_index: number; // Index of item in PO
  po_quantity: number; // Original ordered quantity
  received_quantity: number; // Actual received quantity
  damaged_quantity: number; // Damaged items
  quality_check: "pass" | "fail" | "pending";
  quality_notes?: string;
  barcodes?: string[]; // Scanned barcodes
  lot_numbers?: string[]; // Lot/batch numbers
  serial_numbers?: string[]; // Serial numbers if applicable
}

export interface IGoodsReceipt extends Document {
  _id: string;
  po_id: string; // Reference to PurchaseOrder
  po_number: string;
  vendor_id: string;
  receipt_number: string; // Unique GR number
  items: GoodsReceiptItem[];
  receipt_date: Date;
  received_by?: string; // User who received
  total_received: number; // Total items received across all items
  total_damaged: number; // Total damaged items
  status: "pending" | "partial" | "complete"; // pending=awaiting more, partial=received some, complete=all received
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoodsReceiptItemSchema = new Schema({
  product_id: {
    type: String,
    required: true,
  },
  po_item_index: {
    type: Number,
    required: true,
  },
  po_quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  received_quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  damaged_quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  quality_check: {
    type: String,
    enum: ["pass", "fail", "pending"],
    default: "pending",
  },
  quality_notes: {
    type: String,
    trim: true,
  },
  barcodes: {
    type: [String],
    default: [],
  },
  lot_numbers: {
    type: [String],
    default: [],
  },
  serial_numbers: {
    type: [String],
    default: [],
  },
});

const GoodsReceiptSchema = new Schema<IGoodsReceipt>(
  {
    po_id: {
      type: String,
      required: true,
      index: true,
    },
    po_number: {
      type: String,
      required: true,
      trim: true,
    },
    vendor_id: {
      type: String,
      required: true,
      index: true,
    },
    receipt_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    items: {
      type: [GoodsReceiptItemSchema],
      required: true,
      validate: {
        validator: function (v: GoodsReceiptItem[]) {
          return v.length > 0;
        },
        message: "Goods receipt must have at least one item",
      },
    },
    receipt_date: {
      type: Date,
      default: Date.now,
    },
    received_by: {
      type: String,
      trim: true,
    },
    total_received: {
      type: Number,
      required: true,
      min: 0,
    },
    total_damaged: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "partial", "complete"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Indexes
GoodsReceiptSchema.index({ po_id: 1 });
GoodsReceiptSchema.index({ vendor_id: 1, receipt_date: -1 });

export const GoodsReceipt = mongoose.model<IGoodsReceipt>(
  "GoodsReceipt",
  GoodsReceiptSchema,
);
