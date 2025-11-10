import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionLine extends Document {
  _id: string;
  account_id: string; // Reference to ChartOfAccount
  reference: string; // Transaction type (Order, PurchaseOrder, JournalEntry, etc.)
  reference_id: string; // Source document ID
  reference_sub_id?: string; // Sub-item ID (for line items)
  date: Date;
  debit: number;
  credit: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const TransactionLineSchema = new Schema<ITransactionLine>(
  {
    account_id: {
      type: String,
      required: true,
      ref: 'ChartOfAccount',
    },
    reference: {
      type: String,
      required: true,
      enum: ['Order', 'PurchaseOrder', 'GoodsReceipt', 'JournalEntry', 'Payment', 'Adjustment', 'MarketPurchase'],
    },
    reference_id: {
      type: String,
      required: true,
    },
    reference_sub_id: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    debit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    credit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Indexes for faster lookups
TransactionLineSchema.index({ account_id: 1, date: 1 });
TransactionLineSchema.index({ reference: 1, reference_id: 1 });
TransactionLineSchema.index({ date: 1 });

export const TransactionLine = mongoose.model<ITransactionLine>(
  'TransactionLine',
  TransactionLineSchema
);
