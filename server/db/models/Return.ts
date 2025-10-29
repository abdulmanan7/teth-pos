import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema(
  {
    // Return identification
    returnNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    originalOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    originalOrderNumber: {
      type: String,
      required: true,
    },

    // Customer info
    customer: {
      type: String,
      required: true,
    },
    customerEmail: String,
    customerPhone: String,

    // Returned items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: String,
        originalPrice: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        reason: {
          type: String,
          enum: ["defective", "wrong_item", "not_as_described", "changed_mind", "other"],
          required: true,
        },
        notes: String,
      },
    ],

    // Return type and resolution
    returnType: {
      type: String,
      enum: ["refund", "replacement"],
      required: true,
    },

    // Refund details
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundMethod: {
      type: String,
      enum: ["cash", "card", "check", "transfer", "store_credit"],
    },

    // Replacement details
    replacementItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: String,
        quantity: Number,
        price: Number,
        type: {
          type: String,
          enum: ["same"],
        },
      },
    ],

    // Price adjustment for replacement
    priceAdjustment: {
      type: Number,
      default: 0, // Positive = customer pays more, Negative = customer gets credit
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: String, // Staff name who approved
    },
    approvedAt: Date,

    // Processing info
    processedBy: {
      type: String, // Staff name who processed
    },
    processedAt: Date,

    // Financial tracking
    originalTotal: Number,
    totalRefund: Number,
    totalExchange: Number,
    netAdjustment: Number, // Final amount owed/refunded

    // Additional info
    notes: String,
    attachments: [String], // URLs to photos/documents
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ReturnSchema.index({ status: 1, createdAt: -1 });
ReturnSchema.index({ customer: 1 });
ReturnSchema.index({ originalOrderId: 1 });

export default mongoose.model("Return", ReturnSchema);
