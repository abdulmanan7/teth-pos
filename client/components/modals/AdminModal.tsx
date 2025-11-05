import { useState } from "react";
import { X, Package, Warehouse, Settings, BarChart3, Truck, Barcode, AlertCircle, Bell, Calendar, History, QrCode, FileText, ShoppingCart, Users, Store, Percent, Search, ChevronDown, ChevronRight, TrendingDown } from "lucide-react";
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
import BrandingManager from "@/components/modals/BrandingManager";
import TaxRatesManager from "@/components/modals/TaxRatesManager";

interface AdminModalProps {
  isDarkTheme: boolean;
  onClose: () => void;
  userRole?: string;
}

type AdminTab = "overview" | "warehouses" | "lot-numbers" | "reorder-rules" | "serial-numbers" | "stock-adjustments" | "stock-alerts" | "expiry-notifications" | "analytics" | "transactions" | "barcode-scanner" | "reporting" | "vendors" | "purchase-orders" | "goods-receipts" | "staff" | "branding" | "tax-rates" | null;

export default function AdminModal({ isDarkTheme, onClose, userRole }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["inventory", "procurement", "settings"]));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (activeTab === "warehouses") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <WarehousesManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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

  if (activeTab === "tax-rates") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <TaxRatesManager isDarkTheme={isDarkTheme} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <LotNumbersManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <ReorderRulesManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <SerialNumbersManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <StockAdjustmentsManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <StockAlertsManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <ExpiryNotificationsManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
            <AnalyticsDashboard isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
            <TransactionHistoryViewer isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
            <BarcodeScanner isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
            <AdvancedReporting isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <VendorManager isDarkTheme={isDarkTheme} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <PurchaseOrderManager isDarkTheme={isDarkTheme} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <GoodsReceiptManager isDarkTheme={isDarkTheme} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <StaffManagementModal isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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

  if (activeTab === "branding") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <button
              onClick={onClose}
              className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <BrandingManager isDarkTheme={isDarkTheme} onClose={onClose} />
          </div>
          <div className={`border-t p-6 flex gap-2 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <Button
              onClick={() => setActiveTab("overview")}
              className={isDarkTheme ? 'flex-1 bg-slate-600 hover:bg-slate-700 text-white' : 'flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900'}
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

  // Define menu items with categories
  const menuItems = [
    // Inventory Management
    { id: "warehouses", category: "inventory", icon: Warehouse, title: "Warehouses", description: "Configure warehouse locations and storage zones", color: "purple" },
    { id: "lot-numbers", category: "inventory", icon: Package, title: "Lot Numbers", description: "Track products by lot/batch numbers", color: "blue" },
    { id: "serial-numbers", category: "inventory", icon: Barcode, title: "Serial Numbers", description: "Track individual items with serial numbers", color: "green" },
    { id: "stock-adjustments", category: "inventory", icon: Settings, title: "Stock Adjustments", description: "Adjust inventory levels and record reasons", color: "yellow" },
    { id: "stock-alerts", category: "inventory", icon: AlertCircle, title: "Stock Alerts", description: "Configure low stock and out-of-stock alerts", color: "red" },
    { id: "reorder-rules", category: "inventory", icon: TrendingDown, title: "Reorder Rules", description: "Set automatic reorder points and quantities", color: "orange" },
    { id: "expiry-notifications", category: "inventory", icon: Bell, title: "Expiry Notifications", description: "Track and manage product expiration dates", color: "pink" },
    { id: "transactions", category: "inventory", icon: History, title: "Transaction History", description: "View detailed log of all inventory movements", color: "indigo" },
    { id: "barcode-scanner", category: "inventory", icon: QrCode, title: "Barcode Scanner", description: "Scan and manage product barcodes", color: "red" },
    { id: "reporting", category: "inventory", icon: FileText, title: "Advanced Reporting", description: "Generate comprehensive inventory reports", color: "indigo" },
    { id: "analytics", category: "inventory", icon: BarChart3, title: "Analytics Dashboard", description: "View inventory analytics and insights", color: "cyan" },
    
    // Procurement
    { id: "vendors", category: "procurement", icon: Truck, title: "Vendor Management", description: "Manage vendors and track ratings", color: "blue" },
    { id: "purchase-orders", category: "procurement", icon: ShoppingCart, title: "Purchase Orders", description: "Create and manage purchase orders", color: "green" },
    { id: "goods-receipts", category: "procurement", icon: Package, title: "Goods Receipts", description: "Receive goods with quality checks", color: "purple" },
    
    // Settings
    { id: "staff", category: "settings", icon: Users, title: "Staff Management", description: "Add and manage staff members", color: "cyan" },
    { id: "tax-rates", category: "settings", icon: Percent, title: "Tax Rates", description: "Configure tax presets for checkout", color: "emerald" },
    { id: "branding", category: "settings", icon: Store, title: "Store Branding", description: "Configure store name and business details", color: "orange" },
  ];

  // Filter menu items based on search
  const filteredItems = menuItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const categories = {
    inventory: { title: "Inventory Management", icon: Package },
    procurement: { title: "Procurement", icon: ShoppingCart },
    settings: { title: "Settings & Configuration", icon: Settings },
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: "bg-purple-500/20 group-hover:bg-purple-500/30 text-purple-400",
      blue: "bg-blue-500/20 group-hover:bg-blue-500/30 text-blue-400",
      green: "bg-green-500/20 group-hover:bg-green-500/30 text-green-400",
      yellow: "bg-yellow-500/20 group-hover:bg-yellow-500/30 text-yellow-400",
      red: "bg-red-500/20 group-hover:bg-red-500/30 text-red-400",
      orange: "bg-orange-500/20 group-hover:bg-orange-500/30 text-orange-400",
      pink: "bg-pink-500/20 group-hover:bg-pink-500/30 text-pink-400",
      indigo: "bg-indigo-500/20 group-hover:bg-indigo-500/30 text-indigo-400",
      cyan: "bg-cyan-500/20 group-hover:bg-cyan-500/30 text-cyan-400",
      emerald: "bg-emerald-500/20 group-hover:bg-emerald-500/30 text-emerald-400",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h2>
            <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Manage your store, inventory, and settings</p>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-0">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                isDarkTheme 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {searchTerm ? (
            // Show filtered results
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.length === 0 ? (
                <div className={`col-span-2 text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  No features found matching "{searchTerm}"
                </div>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as AdminTab)}
                      className={`border rounded-lg p-4 transition-all cursor-pointer group text-left hover:scale-[1.02] ${
                        isDarkTheme 
                          ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' 
                          : 'bg-slate-100 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg transition-colors ${getColorClasses(item.color)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className={`text-base font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                      </div>
                      <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.description}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            // Show categorized view
            <div className="space-y-4">
              {Object.entries(categories).map(([categoryKey, category]) => {
                const categoryItems = menuItems.filter(item => item.category === categoryKey);
                const isExpanded = expandedCategories.has(categoryKey);
                const CategoryIcon = category.icon;
                
                return (
                  <div key={categoryKey} className={`border rounded-lg overflow-hidden ${isDarkTheme ? 'border-slate-700' : 'border-slate-300'}`}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className={`w-full flex items-center justify-between p-4 transition-colors ${
                        isDarkTheme 
                          ? 'bg-slate-700/50 hover:bg-slate-700/70' 
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
                        <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {category.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isDarkTheme ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {categoryItems.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={`w-5 h-5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
                      ) : (
                        <ChevronRight className={`w-5 h-5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
                      )}
                    </button>

                    {/* Category Items */}
                    {isExpanded && (
                      <div className={`grid grid-cols-2 gap-3 p-4 ${isDarkTheme ? 'bg-slate-800/50' : 'bg-white'}`}>
                        {categoryItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id as AdminTab)}
                              className={`border rounded-lg p-4 transition-all cursor-pointer group text-left hover:scale-[1.02] ${
                                isDarkTheme 
                                  ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' 
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg transition-colors ${getColorClasses(item.color)}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <h3 className={`text-base font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                              </div>
                              <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                                {item.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t p-6 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
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
