import mongoose, { Schema, Document } from 'mongoose';

export interface IJournalItem extends Document {
  _id: string;
  journal_entry_id: string; // Reference to JournalEntry
  account_id: string; // Reference to ChartOfAccount
  description: string;
  debit: number;
  credit: number;
  created_at: Date;
  updated_at: Date;
}

const JournalItemSchema = new Schema<IJournalItem>(
  {
    journal_entry_id: {
      type: String,
      required: true,
      ref: 'JournalEntry',
    },
    account_id: {
      type: String,
      required: true,
      ref: 'ChartOfAccount',
    },
    description: {
      type: String,
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
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Index for faster lookups
JournalItemSchema.index({ journal_entry_id: 1 });
JournalItemSchema.index({ account_id: 1 });

// Validation: Either debit OR credit should be non-zero, never both
JournalItemSchema.pre('save', function (next) {
  if (this.debit > 0 && this.credit > 0) {
    next(new Error('A journal item cannot have both debit and credit'));
  }
  if (this.debit === 0 && this.credit === 0) {
    next(new Error('A journal item must have either debit or credit'));
  }
  next();
});

export const JournalItem = mongoose.model<IJournalItem>('JournalItem', JournalItemSchema);
