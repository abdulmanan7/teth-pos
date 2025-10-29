import { useState } from "react";
import { X, Package, Warehouse, Settings, BarChart3, Truck, Barcode, AlertCircle, Bell, Calendar, History, QrCode, FileText, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import WarehousesManager from "@/components/inventory/WarehousesManager";
import LotNumbersManager from "@/components/inventory/LotNumbersManager";
import ReorderRulesManager from "@/components/inventory/ReorderRulesManager";
import SerialNumbersManager from "@/components/inventory/SerialNumbersManager";
import StockAdjustmentsManager from "@/components/inventory/StockAdjustmentsManager";
import StockAlertsManager from "@/components/inventory/StockAlertsManager";
import ExpiryNotificationsManager from "@/components/inventory/ExpiryNotificationsManager";
import AnalyticsDashboard from "@/components/inventory/AnalyticsDashboard";
import TransactionHistoryViewer from "@/components/inventory/TransactionHistoryViewer";
import BarcodeScanner from "@/components/inventory/BarcodeScanner";
import AdvancedReporting from "@/components/inventory/AdvancedReporting";
import VendorManager from "@/components/procurement/VendorManager";
import PurchaseOrderManager from "@/components/procurement/PurchaseOrderManager";
import GoodsReceiptManager from "@/components/procurement/GoodsReceiptManager";
import StaffManagementModal from "@/components/modals/StaffManagementModal";

interface AdminModalProps {
  onClose: () => void;
  userRole?: string;
}

type AdminTab = "overview" | "warehouses" | "lot-numbers" | "reorder-rules" | "serial-numbers" | "stock-adjustments" | "stock-alerts" | "expiry-notifications" | "analytics" | "transactions" | "barcode-scanner" | "reporting" | "vendors" | "purchase-orders" | "goods-receipts" | "staff" | null;

export default function AdminModal({ onClose }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  if (activeTab === "warehouses") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <WarehousesManager onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "lot-numbers") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <LotNumbersManager onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "reorder-rules") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <ReorderRulesManager onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "serial-numbers") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <SerialNumbersManager onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "stock-adjustments") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <StockAdjustmentsManager onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "stock-alerts") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <StockAlertsManager onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "expiry-notifications") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <ExpiryNotificationsManager onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "analytics") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <AnalyticsDashboard onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "transactions") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <TransactionHistoryViewer onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "barcode-scanner") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <BarcodeScanner onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "reporting") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <AdvancedReporting onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "vendors") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <VendorManager />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "purchase-orders") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <PurchaseOrderManager />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "goods-receipts") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <GoodsReceiptManager />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "staff") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <StaffManagementModal onClose={onClose} />
          </div>
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <Button
              onClick={() => setActiveTab("overview")}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              Back
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Warehouse Management */}
            <button
              onClick={() => setActiveTab("warehouses")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Warehouse className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Warehouses</h3>
              </div>
              <p className="text-sm text-slate-400">
                Configure warehouse locations and storage zones
              </p>
            </button>

            {/* Lot Numbers */}
            <button
              onClick={() => setActiveTab("lot-numbers")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Lot Numbers</h3>
              </div>
              <p className="text-sm text-slate-400">
                Manage batch/lot tracking with expiry dates
              </p>
            </button>

            {/* Reorder Rules */}
            <button
              onClick={() => setActiveTab("reorder-rules")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <Truck className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Reorder Rules</h3>
              </div>
              <p className="text-sm text-slate-400">
                Set minimum stock levels and reorder points
              </p>
            </button>

            {/* Serial Numbers */}
            <button
              onClick={() => setActiveTab("serial-numbers")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                  <Barcode className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Serial Numbers</h3>
              </div>
              <p className="text-sm text-slate-400">
                Track individual unit serial numbers and status
              </p>
            </button>

            {/* Stock Adjustments */}
            <button
              onClick={() => setActiveTab("stock-adjustments")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Stock Adjustments</h3>
              </div>
              <p className="text-sm text-slate-400">
                Manage inventory discrepancies and adjustments with approval workflow
              </p>
            </button>

            {/* Stock Alerts */}
            <button
              onClick={() => setActiveTab("stock-alerts")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                  <Bell className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Stock Alerts</h3>
              </div>
              <p className="text-sm text-slate-400">
                Monitor low stock, out of stock, and overstock alerts
              </p>
            </button>

            {/* Expiry Notifications */}
            <button
              onClick={() => setActiveTab("expiry-notifications")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors">
                  <Calendar className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Expiry Notifications</h3>
              </div>
              <p className="text-sm text-slate-400">
                Track expired, expiring soon, and upcoming product expiries
              </p>
            </button>

            {/* Analytics Dashboard */}
            <button
              onClick={() => setActiveTab("analytics")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Analytics Dashboard</h3>
              </div>
              <p className="text-sm text-slate-400">
                View inventory metrics, trends, and performance analytics
              </p>
            </button>

            {/* Transaction History */}
            <button
              onClick={() => setActiveTab("transactions")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                  <History className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Transaction History</h3>
              </div>
              <p className="text-sm text-slate-400">
                View detailed log of all inventory movements and transactions
              </p>
            </button>

            {/* Barcode Scanner */}
            <button
              onClick={() => setActiveTab("barcode-scanner")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                  <QrCode className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Barcode Scanner</h3>
              </div>
              <p className="text-sm text-slate-400">
                Scan and manage product barcodes, QR codes, and serial numbers
              </p>
            </button>

            {/* Advanced Reporting */}
            <button
              onClick={() => setActiveTab("reporting")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                  <FileText className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Advanced Reporting</h3>
              </div>
              <p className="text-sm text-slate-400">
                Generate and export comprehensive inventory reports in JSON or CSV
              </p>
            </button>

            {/* Vendor Management */}
            <button
              onClick={() => setActiveTab("vendors")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Truck className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Vendor Management</h3>
              </div>
              <p className="text-sm text-slate-400">
                Manage vendors, track ratings, and monitor purchase history
              </p>
            </button>

            {/* Purchase Orders */}
            <button
              onClick={() => setActiveTab("purchase-orders")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Purchase Orders</h3>
              </div>
              <p className="text-sm text-slate-400">
                Create and manage purchase orders with multi-vendor support
              </p>
            </button>

            {/* Goods Receipts */}
            <button
              onClick={() => setActiveTab("goods-receipts")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Goods Receipts</h3>
              </div>
              <p className="text-sm text-slate-400">
                Receive goods with quality checks, barcode scanning, and damage tracking
              </p>
            </button>

            {/* Staff Management */}
            <button
              onClick={() => setActiveTab("staff")}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-slate-500 transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Staff Management</h3>
              </div>
              <p className="text-sm text-slate-400">
                Add, edit, and manage staff members and their roles
              </p>
            </button>

            {/* Coming Soon */}
            <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-slate-500/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Analytics</h3>
              </div>
              <p className="text-sm text-slate-400">
                Coming soon: Inventory reports and valuations
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-slate-700/20 border border-slate-600 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">Inventory System</h4>
            <p className="text-xs text-slate-400">
              Full inventory management system with support for lot numbers, serial tracking, 
              warehouse management, stock adjustments, and reorder rules. All features are 
              designed for multi-location operations.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6">
          <Button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
