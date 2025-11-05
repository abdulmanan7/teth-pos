import mongoose, { Schema, Document } from 'mongoose';

export interface IChartOfAccount extends Document {
  _id: string;
  name: string;
  code: string; // Account code (e.g., "1060", "4100")
  type_id: string; // Reference to ChartOfAccountType
  sub_type_id: string; // Reference to ChartOfAccountSubType
  parent_id?: string; // Parent account for hierarchical structure
  is_enabled: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const ChartOfAccountSchema = new Schema<IChartOfAccount>(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    type_id: {
      type: String,
      required: true,
      ref: 'ChartOfAccountType',
    },
    sub_type_id: {
      type: String,
      required: true,
      ref: 'ChartOfAccountSubType',
    },
    parent_id: {
      type: String,
      ref: 'ChartOfAccount',
    },
    is_enabled: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Index for faster lookups
ChartOfAccountSchema.index({ code: 1 }, { unique: true });
ChartOfAccountSchema.index({ type_id: 1 });
ChartOfAccountSchema.index({ is_enabled: 1 });

export const ChartOfAccount = mongoose.model<IChartOfAccount>(
  'ChartOfAccount',
  ChartOfAccountSchema
);
