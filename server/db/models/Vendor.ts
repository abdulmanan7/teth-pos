import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  payment_terms?: string;
  is_active: boolean;
  rating: number;
  total_purchases: number;
  total_spent: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zip_code: {
      type: String,
      trim: true,
    },
    contact_person: {
      type: String,
      trim: true,
    },
    payment_terms: {
      type: String,
      trim: true,
      default: 'Net 30',
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    total_purchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
VendorSchema.index({ name: 1, is_active: 1 });
VendorSchema.index({ code: 1 });
VendorSchema.index({ email: 1 });

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
