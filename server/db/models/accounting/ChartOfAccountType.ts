import mongoose, { Schema, Document } from 'mongoose';

export interface IChartOfAccountType extends Document {
  _id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

const ChartOfAccountTypeSchema = new Schema<IChartOfAccountType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['Assets', 'Liabilities', 'Equity', 'Income', 'Cost of Goods Sold', 'Expenses'],
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const ChartOfAccountType = mongoose.model<IChartOfAccountType>(
  'ChartOfAccountType',
  ChartOfAccountTypeSchema
);
