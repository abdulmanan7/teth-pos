import mongoose, { Document, Schema } from "mongoose";

export interface ITaxRate extends Document {
  name: string;
  rate: number; // Stored as decimal (e.g., 0.1 = 10%)
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaxRateSchema = new Schema<ITaxRate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    description: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

TaxRateSchema.index({ isDefault: 1 });

export const TaxRate = mongoose.model<ITaxRate>("TaxRate", TaxRateSchema);

export default TaxRate;
