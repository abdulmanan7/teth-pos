import { useState } from "react";
import { X, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyNew } from "@/utils";

interface DiscountModalProps {
  isDarkTheme: boolean;
  itemName?: string;
  subtotal: number;
  currentDiscount?: {
    type: "percentage" | "fixed";
    value: number;
    reason?: string;
  };
  onApply: (discount: {
    type: "percentage" | "fixed";
    value: number;
    reason?: string;
  }) => void;
  onClose: () => void;
}

export default function DiscountModalComponent({
  isDarkTheme,
  itemName,
  subtotal,
  currentDiscount,
  onApply,
  onClose,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    currentDiscount?.type || "percentage"
  );
  const [discountValue, setDiscountValue] = useState(
    currentDiscount?.value || 0
  );
  const [reason, setReason] = useState(currentDiscount?.reason || "");
  const [error, setError] = useState("");

  const calculatePreview = () => {
    if (discountValue === 0) return subtotal;
    if (discountType === "percentage") {
      return subtotal - (subtotal * discountValue) / 100;
    } else {
      return subtotal - discountValue;
    }
  };

  const handleApply = () => {
    setError("");

    // Validation
    if (discountValue < 0) {
      setError("Discount cannot be negative");
      return;
    }

    if (discountType === "percentage") {
      if (discountValue > 100) {
        setError("Percentage discount cannot exceed 100%");
        return;
      }
    } else {
      if (discountValue > subtotal) {
        setError(`Fixed discount cannot exceed subtotal (Rs ${subtotal.toFixed(2)})`);
        return;
      }
    }

    onApply({
      type: discountType,
      value: discountValue,
      reason: reason || undefined,
    });
    onClose();
  };

  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div
        className={`rounded-lg shadow-xl max-w-md w-full ${
          isDarkTheme ? "bg-slate-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkTheme ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <h2
            className={`text-lg font-bold ${
              isDarkTheme ? "text-white" : "text-slate-900"
            }`}
          >
            Apply Discount
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors ${
              isDarkTheme
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Item Info */}
          {itemName && (
            <div>
              <p
                className={`text-sm font-semibold ${
                  isDarkTheme ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Item: {itemName}
              </p>
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Subtotal: {formatCurrencyNew(subtotal)}
              </p>
            </div>
          )}

          {/* Discount Type Selection */}
          <div className="space-y-2">
            <label
              className={`text-sm font-semibold ${
                isDarkTheme ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Discount Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDiscountType("percentage")}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  discountType === "percentage"
                    ? isDarkTheme
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkTheme
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                <Percent className="w-4 h-4" />
                Percentage
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  discountType === "fixed"
                    ? isDarkTheme
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkTheme
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Fixed Amount
              </button>
            </div>
          </div>

          {/* Discount Value Input */}
          <div className="space-y-2">
            <label
              className={`text-sm font-semibold ${
                isDarkTheme ? "text-slate-300" : "text-slate-700"
              }`}
            >
              {discountType === "percentage" ? "Percentage (%)" : "Amount (Rs)"}
            </label>
            <input
              type="number"
              min="0"
              max={discountType === "percentage" ? 100 : subtotal}
              step={discountType === "percentage" ? 1 : 0.01}
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                isDarkTheme
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-500"
              }`}
              placeholder="Enter discount value"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label
              className={`text-sm font-semibold ${
                isDarkTheme ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                isDarkTheme
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-500"
              }`}
              placeholder="e.g., Clearance, Loyalty, Bulk Order"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Preview */}
          <div
            className={`p-3 rounded-lg border ${
              isDarkTheme
                ? "bg-slate-700/50 border-slate-600"
                : "bg-slate-100 border-slate-300"
            }`}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span
                  className={isDarkTheme ? "text-slate-400" : "text-slate-600"}
                >
                  Subtotal:
                </span>
                <span
                  className={`font-semibold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  {formatCurrencyNew(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={isDarkTheme ? "text-slate-400" : "text-slate-600"}
                >
                  Discount:
                </span>
                <span className="font-semibold text-red-500">
                  -{formatCurrencyNew(discountAmount)}
                </span>
              </div>
              <div
                className={`border-t pt-2 flex justify-between ${
                  isDarkTheme ? "border-slate-600" : "border-slate-300"
                }`}
              >
                <span
                  className={`font-bold ${
                    isDarkTheme ? "text-white" : "text-slate-900"
                  }`}
                >
                  Total:
                </span>
                <span
                  className={`font-bold text-lg ${
                    isDarkTheme ? "text-emerald-400" : "text-emerald-600"
                  }`}
                >
                  {formatCurrencyNew(calculatePreview())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div
          className={`border-t p-4 flex gap-2 ${
            isDarkTheme ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <Button
            onClick={onClose}
            className={`flex-1 ${
              isDarkTheme
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-200 hover:bg-slate-300 text-slate-900"
            }`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            Apply Discount
          </Button>
        </div>
      </div>
    </div>
  );
}
