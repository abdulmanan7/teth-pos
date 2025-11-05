import mongoose, { Schema, Document } from 'mongoose';

export interface IJournalEntry extends Document {
  _id: string;
  journal_number: string; // Sequential journal number (e.g., "JE-00001")
  date: Date;
  reference?: string; // Reference number
  description: string;
  total_debit: number;
  total_credit: number;
  created_at: Date;
  updated_at: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    journal_number: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    reference: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    total_debit: {
      type: Number,
      required: true,
      min: 0,
    },
    total_credit: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Index for faster lookups
JournalEntrySchema.index({ journal_number: 1 }, { unique: true });
JournalEntrySchema.index({ date: 1 });

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
