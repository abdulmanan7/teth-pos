import mongoose, { Schema, Document } from 'mongoose';

export interface IChartOfAccountSubType extends Document {
  _id: string;
  name: string;
  type_id: string; // Reference to ChartOfAccountType
  created_at: Date;
  updated_at: Date;
}

const ChartOfAccountSubTypeSchema = new Schema<IChartOfAccountSubType>(
  {
    name: {
      type: String,
      required: true,
    },
    type_id: {
      type: String,
      required: true,
      ref: 'ChartOfAccountType',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const ChartOfAccountSubType = mongoose.model<IChartOfAccountSubType>(
  'ChartOfAccountSubType',
  ChartOfAccountSubTypeSchema
);
