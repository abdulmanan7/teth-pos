import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  customer: string;
  items: IOrderItem[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  staffId?: string;
  staffName?: string;
  paymentMethod?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: String,
      required: true,
    },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    staffId: {
      type: String,
      index: true,
    },
    staffName: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'check', 'transfer', 'other'],
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
