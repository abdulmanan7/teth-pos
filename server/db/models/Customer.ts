import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
