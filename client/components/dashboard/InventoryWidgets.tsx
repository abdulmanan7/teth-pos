import { useState, useEffect } from "react";
import {
  AlertTriangle,
  TrendingUp,
  Package,
  Clock,
  Activity,
  Loader,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useElectronApi } from "@/hooks/useElectronApi";

interface InventoryStats {
  total_products: number;
  total_stock_value: number;
  total_units: number;
  low_stock_alerts: number;
  out_of_stock_alerts: number;
  expired_products: number;
  expiring_soon_products: number;
  health_score: number;
}

interface BarcodeStats {
  total_barcodes: number;
  active_barcodes: number;
  sku_barcodes: number;
  lot_barcodes: number;
  serial_barcodes: number;
}

interface TransactionSummary {
  total_transactions: number;
  stock_in: number;
  stock_out: number;
  adjustments: number;
  transfers: number;
  total_value: number;
}

export default function InventoryWidgets() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [barcodeStats, setBarcodeStats] = useState<BarcodeStats | null>(null);
  const [transactions, setTransactions] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { get } = useElectronApi();

  useEffect(() => {
    fetchWidgetData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWidgetData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWidgetData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchInventoryStats(),
        fetchBarcodeStats(),
        fetchTransactionSummary(),
      ]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryStats = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/analytics/overview");
          setStats(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
    }
  };

  const fetchBarcodeStats = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/barcodes/stats");
          setBarcodeStats(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching barcode stats:", error);
    }
  };

  const fetchTransactionSummary = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/transactions/summary");
          setTransactions(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching transaction summary:", error);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "from-green-600 to-green-700";
    if (score >= 60) return "from-yellow-600 to-yellow-700";
    return "from-red-600 to-red-700";
  };

  const getHealthTextColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Inventory Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchWidgetData}
            disabled={loading}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Health Score */}
          <div
            className={`bg-gradient-to-br ${getHealthColor(
              stats.health_score
            )} rounded-lg p-6 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Health Score</h3>
              <Activity className="w-5 h-5 opacity-75" />
            </div>
            <p className={`text-4xl font-bold ${getHealthTextColor(stats.health_score)}`}>
              {stats.health_score}%
            </p>
            <p className="text-xs opacity-75 mt-2">
              {stats.health_score >= 80
                ? "Excellent"
                : stats.health_score >= 60
                ? "Good"
                : "Needs Attention"}
            </p>
          </div>

          {/* Total Stock Value */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Stock Value</h3>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(stats.total_stock_value)}
            </p>
            <p className="text-xs opacity-75 mt-2">
              {stats.total_units.toLocaleString()} units
            </p>
          </div>

          {/* Total Products */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Products</h3>
              <Package className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-4xl font-bold">{stats.total_products}</p>
            <p className="text-xs opacity-75 mt-2">
              Avg: Rs {(stats.total_stock_value / stats.total_products).toFixed(0)}
            </p>
          </div>

          {/* Critical Alerts */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Critical</h3>
              <AlertTriangle className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-4xl font-bold">
              {stats.out_of_stock_alerts + stats.expired_products}
            </p>
            <p className="text-xs opacity-75 mt-2">
              {stats.out_of_stock_alerts} out of stock
            </p>
          </div>
        </div>
      )}

      {/* Alert Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-400">
              {stats.low_stock_alerts}
            </p>
          </div>
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Out of Stock</p>
            <p className="text-2xl font-bold text-red-400">
              {stats.out_of_stock_alerts}
            </p>
          </div>
          <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Expired</p>
            <p className="text-2xl font-bold text-orange-400">
              {stats.expired_products}
            </p>
          </div>
          <div className="bg-pink-900/20 border border-pink-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-1">Expiring Soon</p>
            <p className="text-2xl font-bold text-pink-400">
              {stats.expiring_soon_products}
            </p>
          </div>
        </div>
      )}

      {/* Transaction Activity */}
      {transactions && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {transactions.total_transactions}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <ArrowDown className="w-4 h-4 text-green-400" />
                <p className="text-2xl font-bold text-green-400">
                  {transactions.stock_in}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-1">In</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <ArrowUp className="w-4 h-4 text-red-400" />
                <p className="text-2xl font-bold text-red-400">
                  {transactions.stock_out}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-1">Out</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {transactions.adjustments}
              </p>
              <p className="text-xs text-slate-400 mt-1">Adjustments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {transactions.transfers}
              </p>
              <p className="text-xs text-slate-400 mt-1">Transfers</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-600">
            <p className="text-sm text-slate-400">
              Total Transaction Value:{" "}
              <span className="text-white font-semibold">
                {formatCurrency(transactions.total_value)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Barcode Stats */}
      {barcodeStats && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Barcode Coverage</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {barcodeStats.total_barcodes}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {barcodeStats.active_barcodes}
              </p>
              <p className="text-xs text-slate-400 mt-1">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {barcodeStats.sku_barcodes}
              </p>
              <p className="text-xs text-slate-400 mt-1">SKU</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {barcodeStats.lot_barcodes}
              </p>
              <p className="text-xs text-slate-400 mt-1">Lot</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {barcodeStats.serial_barcodes}
              </p>
              <p className="text-xs text-slate-400 mt-1">Serial</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Avg Stock Level</p>
            <p className="text-2xl font-bold text-white">
              {(stats.total_units / stats.total_products).toFixed(1)}
            </p>
            <p className="text-xs text-slate-500 mt-1">units per product</p>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Avg Product Value</p>
            <p className="text-2xl font-bold text-white">
              Rs {(stats.total_stock_value / stats.total_products).toFixed(0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">per product</p>
          </div>
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Alert Rate</p>
            <p className="text-2xl font-bold text-white">
              {(
                ((stats.low_stock_alerts +
                  stats.out_of_stock_alerts +
                  stats.expired_products) /
                  stats.total_products) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-xs text-slate-500 mt-1">of products</p>
          </div>
        </div>
      )}
    </div>
  );
}
