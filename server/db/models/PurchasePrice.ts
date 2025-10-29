import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchasePrice extends Document {
  _id: string;
  product_id: string;
  vendor_id: string;
  purchase_price: number;
  minimum_quantity: number;
  maximum_quantity: number;
  lead_time_days: number;
  currency: string;
  is_active: boolean;
  effective_from: Date;
  effective_to?: Date;
  notes?: string;
  last_purchased?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchasePriceSchema = new Schema<IPurchasePrice>(
  {
    product_id: {
      type: String,
      required: true,
      index: true,
    },
    vendor_id: {
      type: String,
      required: true,
      index: true,
    },
    purchase_price: {
      type: Number,
      required: true,
      min: 0,
    },
    minimum_quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    maximum_quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    lead_time_days: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    effective_from: {
      type: Date,
      default: Date.now,
    },
    effective_to: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    last_purchased: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
PurchasePriceSchema.index({ product_id: 1, vendor_id: 1 });
PurchasePriceSchema.index({ product_id: 1, is_active: 1 });
PurchasePriceSchema.index({ vendor_id: 1, is_active: 1 });

export const PurchasePrice = mongoose.model<IPurchasePrice>('PurchasePrice', PurchasePriceSchema);
