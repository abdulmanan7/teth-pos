import { useState, useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader,
  Bell,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { StockAlert, Product } from "@shared/api";

interface StockAlertsManagerProps {
  onClose: () => void;
}

export default function StockAlertsManager({ onClose }: StockAlertsManagerProps) {
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [filterType, setFilterType] = useState<string>("all");
  const [summary, setSummary] = useState({
    total_active: 0,
    low_stock: 0,
    out_of_stock: 0,
    overstock: 0,
  });
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchProducts(), fetchSummary()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/stock-alerts");
          setAlerts(data);
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
      console.error("Error fetching alerts:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/products");
          setProducts(data);
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
      console.error("Error fetching products:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/stock-alerts/summary");
          setSummary(data);
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
      console.error("Error fetching summary:", error);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      setLoading(true);
      const result = await post("/api/inventory/stock-alerts/check", {});
      addToast(`Alert check completed. ${result.alerts_created} new alerts created.`, "success");
      await fetchData();
    } catch (error) {
      console.error("Error checking alerts:", error);
      addToast("Failed to check alerts", "error");
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await put(`/api/inventory/stock-alerts/${id}/acknowledge`, {
        acknowledged_by: "current_user",
      });
      await fetchData();
      addToast("Alert acknowledged", "success");
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      addToast("Failed to acknowledge alert", "error");
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await put(`/api/inventory/stock-alerts/${id}/resolve`, {});
      await fetchData();
      addToast("Alert resolved", "success");
    } catch (error) {
      console.error("Error resolving alert:", error);
      addToast("Failed to resolve alert", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this alert?")) {
      try {
        await deleteRequest(`/api/inventory/stock-alerts/${id}`);
        await fetchData();
        addToast("Alert deleted", "success");
      } catch (error) {
        console.error("Error deleting alert:", error);
        addToast("Failed to delete alert", "error");
      }
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "out_of_stock":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "low_stock":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "overstock":
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "out_of_stock":
        return "bg-red-900/20 border-red-600";
      case "low_stock":
        return "bg-yellow-900/20 border-yellow-600";
      case "overstock":
        return "bg-blue-900/20 border-blue-600";
      default:
        return "bg-slate-700/30 border-slate-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-600";
      case "acknowledged":
        return "bg-yellow-600";
      case "resolved":
        return "bg-green-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "acknowledged":
        return "Acknowledged";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      case "overstock":
        return "Overstock";
      default:
        return type;
    }
  };

  let filteredAlerts = alerts;
  if (filterStatus !== "all") {
    filteredAlerts = filteredAlerts.filter((a) => a.status === filterStatus);
  }
  if (filterType !== "all") {
    filteredAlerts = filteredAlerts.filter((a) => a.alert_type === filterType);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Stock Alerts
        </h3>
        <Button
          onClick={handleCheckAlerts}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Check Alerts
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Out of Stock</p>
          <p className="text-2xl font-bold text-red-400">{summary.out_of_stock}</p>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.low_stock}</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Overstock</p>
          <p className="text-2xl font-bold text-blue-400">{summary.overstock}</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Total Active</p>
          <p className="text-2xl font-bold text-white">{summary.total_active}</p>
        </div>
      </div>

      {/* Detail View */}
      {showDetail && selectedAlert && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white flex items-center gap-2">
              {getAlertIcon(selectedAlert.alert_type)}
              {getProductName(selectedAlert.product_id)}
            </h4>
            <button
              onClick={() => setShowDetail(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Alert Type</p>
              <p className="text-white font-medium">{getTypeLabel(selectedAlert.alert_type)}</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className={`text-white font-medium ${getStatusColor(selectedAlert.status)}`}>
                {getStatusLabel(selectedAlert.status)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Current Stock</p>
              <p className="text-white font-medium">{selectedAlert.current_stock} units</p>
            </div>
            <div>
              <p className="text-slate-400">Threshold</p>
              <p className="text-white font-medium">{selectedAlert.threshold} units</p>
            </div>
            {selectedAlert.reorder_point && (
              <div>
                <p className="text-slate-400">Reorder Point</p>
                <p className="text-white font-medium">{selectedAlert.reorder_point} units</p>
              </div>
            )}
            <div>
              <p className="text-slate-400">Created</p>
              <p className="text-white font-medium">
                {new Date(selectedAlert.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {selectedAlert.notes && (
            <div className="border-t border-slate-600 pt-4">
              <p className="text-slate-400 text-sm">Notes</p>
              <p className="text-white">{selectedAlert.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {selectedAlert.status === "active" && (
              <>
                <Button
                  onClick={() => handleAcknowledge(selectedAlert._id)}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Acknowledge
                </Button>
                <Button
                  onClick={() => handleResolve(selectedAlert._id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Resolve
                </Button>
              </>
            )}
            {selectedAlert.status === "acknowledged" && (
              <Button
                onClick={() => handleResolve(selectedAlert._id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Resolve
              </Button>
            )}
            <Button
              onClick={() => handleDelete(selectedAlert._id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="overstock">Overstock</option>
        </select>
        <span className="text-slate-400 text-sm py-2">
          {filteredAlerts.length} alerts
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No alerts found. Stock levels are healthy!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <div
              key={alert._id}
              className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${getAlertColor(
                alert.alert_type
              )}`}
            >
              <div className="flex-1 flex items-start gap-3">
                <div className="mt-1">{getAlertIcon(alert.alert_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">
                      {getProductName(alert.product_id)}
                    </h4>
                    <span
                      className={`text-xs text-white px-2 py-1 rounded ${getStatusColor(
                        alert.status
                      )}`}
                    >
                      {getStatusLabel(alert.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {getTypeLabel(alert.alert_type)} • Current: {alert.current_stock} units •
                    Threshold: {alert.threshold} units
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedAlert(alert);
                    setShowDetail(true);
                  }}
                  className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {alert.status === "active" && (
                  <button
                    onClick={() => handleAcknowledge(alert._id)}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                    title="Acknowledge"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                )}
                {alert.status !== "resolved" && (
                  <button
                    onClick={() => handleResolve(alert._id)}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    title="Resolve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(alert._id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
