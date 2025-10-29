import mongoose, { Schema, Document } from 'mongoose';

export interface PurchaseOrderItem {
  product_id: string;
  quantity: number;
  purchase_price: number;
  line_total: number;
}

export interface PaymentRecord {
  _id?: string;
  amount: number;
  payment_date: Date;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface IPurchaseOrder extends Document {
  _id: string;
  po_number: string;
  vendor_id: string;
  items: PurchaseOrderItem[];
  total_amount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'invoiced' | 'paid';
  payment_status: 'pending' | 'partial' | 'paid';
  amount_paid: number;
  payment_history: PaymentRecord[];
  order_date: Date;
  expected_delivery?: Date;
  actual_delivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRecordSchema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  payment_date: {
    type: Date,
    default: Date.now,
  },
  payment_method: {
    type: String,
    enum: ['cash', 'check', 'bank_transfer', 'credit_card', 'other'],
  },
  reference: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
}, { _id: true });

const PurchaseOrderItemSchema = new Schema({
  product_id: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  purchase_price: {
    type: Number,
    required: true,
    min: 0,
  },
  line_total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    po_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    vendor_id: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [PurchaseOrderItemSchema],
      required: true,
      validate: {
        validator: function (v: PurchaseOrderItem[]) {
          return v.length > 0;
        },
        message: 'Purchase order must have at least one item',
      },
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'confirmed', 'received', 'invoiced', 'paid'],
      default: 'draft',
      index: true,
    },
    payment_status: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
      index: true,
    },
    amount_paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    payment_history: {
      type: [PaymentRecordSchema],
      default: [],
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
    expected_delivery: {
      type: Date,
    },
    actual_delivery: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
PurchaseOrderSchema.index({ vendor_id: 1, status: 1 });
PurchaseOrderSchema.index({ po_number: 1 });
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ order_date: -1 });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
