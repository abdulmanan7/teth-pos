import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: {
    type: 'percentage' | 'fixed'; // percentage (%) or fixed amount
    value: number; // discount value
    reason?: string; // reason for discount
  };
  discountAmount?: number; // calculated discount amount
  subtotal?: number; // price * quantity
  totalAfterDiscount?: number; // subtotal - discountAmount
}

export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  customer: string;
  items: IOrderItem[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  subtotal: number; // sum of all item subtotals
  itemDiscountTotal: number; // sum of all item discounts
  subtotalAfterDiscount: number; // subtotal after item discounts
  checkoutDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  checkoutDiscountAmount: number; // calculated checkout discount
  totalBeforeTax: number; // total after discounts before tax
  taxRate?: number;
  taxAmount: number;
  total: number; // final total after all discounts
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
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      value: Number,
      reason: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAfterDiscount: {
      type: Number,
      default: 0,
      min: 0,
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
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    itemDiscountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotalAfterDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    checkoutDiscount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      value: Number,
      reason: String,
    },
    checkoutDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBeforeTax: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
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
