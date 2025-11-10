import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyNew } from "@/utils";

interface MarketPurchaseItem {
  product_id: string;
  quantity: number;
  cost_per_unit: number;
  expiry_date?: string;
  manufacture_date?: string;
  notes?: string;
}

interface MarketPurchase {
  _id: string;
  purchase_number: string;
  warehouse_id: string;
  supplier_name?: string;
  items: MarketPurchaseItem[];
  total_amount: number;
  purchase_date: string;
  created_at: string;
}

interface AddToInventoryModalProps {
  isOpen: boolean;
  isDarkTheme: boolean;
  purchase: MarketPurchase | null;
  serialNumbers: Record<string, string>;
  onSerialNumberChange: (productId: string, value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
  getProductName: (productId: string) => string;
}

export default function AddToInventoryModal({
  isOpen,
  isDarkTheme,
  purchase,
  serialNumbers,
  onSerialNumberChange,
  onConfirm,
  onClose,
  isLoading,
  getProductName,
}: AddToInventoryModalProps) {
  if (!isOpen || !purchase) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div
        className={`rounded-lg border shadow-xl max-w-2xl w-full ${
          isDarkTheme
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-300"
        }`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkTheme
              ? "bg-slate-800 border-slate-700"
              : "bg-slate-50 border-slate-300"
          }`}
        >
          <h3
            className={`text-xl font-bold ${
              isDarkTheme ? "text-white" : "text-slate-900"
            }`}
          >
            Add to Inventory
          </h3>
          <button
            onClick={onClose}
            className={
              isDarkTheme
                ? "text-slate-400 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Purchase Summary */}
          <div
            className={`p-4 rounded border ${
              isDarkTheme
                ? "bg-slate-700/50 border-slate-600"
                : "bg-slate-50 border-slate-300"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                isDarkTheme ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Purchase: {purchase.purchase_number}
            </p>
            <p
              className={`text-sm ${
                isDarkTheme ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {purchase.items.length} item(s) •{" "}
              {formatCurrencyNew(purchase.total_amount)}
            </p>
          </div>

          {/* Serial Numbers (Optional) */}
          <div>
            <label
              className={`block text-sm font-medium mb-3 ${
                isDarkTheme ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Serial Numbers (Optional)
            </label>
            <div className="space-y-2">
              {purchase.items.map((item, idx) => (
                <div key={idx}>
                  <label
                    className={`text-xs ${
                      isDarkTheme ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {getProductName(item.product_id)} (Qty: {item.quantity})
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter serial numbers separated by commas (optional)"
                    value={serialNumbers[item.product_id] || ""}
                    onChange={(e) =>
                      onSerialNumberChange(item.product_id, e.target.value)
                    }
                    className={
                      isDarkTheme
                        ? "bg-slate-700 border-slate-600 text-white text-sm"
                        : "bg-white border-slate-300 text-slate-900 text-sm"
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div
            className={`p-3 rounded border-l-4 ${
              isDarkTheme
                ? "bg-blue-900/30 border-blue-500"
                : "bg-blue-50 border-blue-500"
            }`}
          >
            <p
              className={`text-sm ${
                isDarkTheme ? "text-blue-300" : "text-blue-800"
              }`}
            >
              ✓ Batches already created • ✓ Stock updated • ✓ Accounting
              entries will be created
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${
                isDarkTheme
                  ? "bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Cancel
            </button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 disabled:opacity-50 ${
                isDarkTheme
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isLoading ? "Adding..." : "Confirm & Add to Inventory"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
