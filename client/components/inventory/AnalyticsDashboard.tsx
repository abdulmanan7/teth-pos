import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Loader,
  PieChart,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { InventoryOverview, InventoryMetrics } from "@shared/api";

interface AnalyticsDashboardProps {
  isDarkTheme?: boolean;
  onClose: () => void;
}

export default function AnalyticsDashboard({ isDarkTheme = true, onClose }: AnalyticsDashboardProps) {
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "warehouses" | "performance">("overview");
  const { get, post } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchMetrics(),
        fetchCategories(),
        fetchWarehouses(),
        fetchPerformance(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/analytics/overview");
          setOverview(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching overview:", error);
    }
  };

  const fetchMetrics = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/analytics/latest");
          setMetrics(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/analytics/categories");
          setCategories(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/analytics/warehouses");
          setWarehouses(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchPerformance = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/analytics/performance");
          setPerformance(data);
          return;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching performance:", error);
    }
  };

  const handleCalculateMetrics = async () => {
    try {
      setLoading(true);
      await post("/api/inventory/analytics/calculate", {});
      alert("Metrics calculated successfully");
      await fetchData();
    } catch (error) {
      console.error("Error calculating metrics:", error);
      alert("Failed to calculate metrics");
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-900/20 border-green-600";
    if (score >= 60) return "bg-yellow-900/20 border-yellow-600";
    return "bg-red-900/20 border-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-2xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          <BarChart3 className="w-7 h-7" />
          Inventory Analytics
        </h3>
        <Button
          onClick={handleCalculateMetrics}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Calculate Metrics
        </Button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 gap-3">
          <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Total Products</p>
            <p className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{overview.total_products}</p>
          </div>
          <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Total Stock Value</p>
            <p className="text-3xl font-bold text-green-400">
              ${overview.total_stock_value.toLocaleString()}
            </p>
          </div>
          <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Total Units</p>
            <p className="text-3xl font-bold text-blue-400">{overview.total_units}</p>
          </div>
          <div
            className={`border rounded-lg p-4 ${getHealthBgColor(
              overview.health_score
            )}`}
          >
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Health Score</p>
            <p className={`text-3xl font-bold ${getHealthColor(overview.health_score)}`}>
              {overview.health_score}%
            </p>
          </div>
        </div>
      )}

      {/* Alert Summary */}
      {overview && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-400">
              {overview.low_stock_alerts}
            </p>
          </div>
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Out of Stock</p>
            <p className="text-2xl font-bold text-red-400">
              {overview.out_of_stock_alerts}
            </p>
          </div>
          <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Expired</p>
            <p className="text-2xl font-bold text-orange-400">
              {overview.expired_products}
            </p>
          </div>
          <div className="bg-pink-900/20 border border-pink-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Expiring Soon</p>
            <p className="text-2xl font-bold text-pink-400">
              {overview.expiring_soon_products}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-2 border-b ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "overview"
              ? "text-blue-400 border-b-2 border-blue-400"
              : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "categories"
              ? "text-blue-400 border-b-2 border-blue-400"
              : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <PieChart className="w-4 h-4 inline mr-2" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab("warehouses")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "warehouses"
              ? "text-blue-400 border-b-2 border-blue-400"
              : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Warehouses
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "performance"
              ? "text-blue-400 border-b-2 border-blue-400"
              : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Performance
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "overview" && overview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                <p className={`text-sm mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Avg Value per Product</p>
                <p className="text-2xl font-bold text-green-400">
                  Rs {overview.average_value_per_product.toFixed(2)}
                </p>
              </div>
              <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                <p className={`text-sm mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Avg Units per Product</p>
                <p className="text-2xl font-bold text-blue-400">
                  {overview.average_units_per_product.toFixed(1)}
                </p>
              </div>
            </div>

            {metrics && (
              <div className="space-y-3">
                <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Top Products by Value</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {metrics.top_products.map((product, idx) => (
                    <div
                      key={idx}
                      className={`border rounded p-3 flex justify-between items-center ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}
                    >
                      <div>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{product.product_name}</p>
                        <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          ${product.value.toLocaleString()}
                        </p>
                        <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{product.stock} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && categories.length > 0 && (
          <div className="space-y-3">
            <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Category Distribution</h4>
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div key={idx} className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{cat.category}</p>
                    <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{cat.percentage.toFixed(1)}%</p>
                  </div>
                  <div className={`w-full rounded-full h-2 ${isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'}`}>
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <div className={`flex justify-between mt-2 text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>{cat.units} units</span>
                    <span>${cat.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "warehouses" && warehouses.length > 0 && (
          <div className="space-y-3">
            <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Warehouse Distribution</h4>
            <div className="space-y-2">
              {warehouses.map((wh, idx) => (
                <div key={idx} className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{wh.warehouse_name}</p>
                    <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      {wh.capacity_utilization.toFixed(1)}% utilized
                    </p>
                  </div>
                  <div className={`w-full rounded-full h-2 ${isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'}`}>
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(wh.capacity_utilization, 100)}%` }}
                    />
                  </div>
                  <div className={`flex justify-between mt-2 text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>{wh.total_units} units</span>
                    <span>${wh.total_value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "performance" && performance && (
          <div className="space-y-4">
            <div>
              <h4 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Top 10 by Value</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {performance.top_by_value.map((product: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border rounded p-3 flex justify-between ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}
                  >
                    <div>
                      <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{product.product_name}</p>
                      <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{product.sku}</p>
                    </div>
                    <p className="text-green-400 font-bold">
                      ${product.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Top 10 by Quantity</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {performance.top_by_quantity.map((product: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border rounded p-3 flex justify-between ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}
                  >
                    <div>
                      <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{product.product_name}</p>
                      <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold">{product.stock} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
