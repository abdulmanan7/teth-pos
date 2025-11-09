import { useState, useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  Bell,
  Loader,
  ChevronRight,
} from "lucide-react";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { StockAlert, ExpiryNotification, Product } from "@shared/api";

interface InventoryAlertsWidgetProps {
  isDarkTheme?: boolean;
  onAlertClick?: () => void; // Callback to open admin modal
}

export default function InventoryAlertsWidget({
  isDarkTheme = true,
  onAlertClick,
}: InventoryAlertsWidgetProps) {
  const { get } = useElectronApi();
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [expiryNotifications, setExpiryNotifications] = useState<ExpiryNotification[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [stockData, expiryData, productsData] = await Promise.all([
        get("/api/inventory/stock-alerts").catch(() => []),
        get("/api/inventory/expiry-notifications").catch(() => []),
        get("/api/products").catch(() => []),
      ]);

      // Filter only active alerts
      const activeStockAlerts = stockData.filter((a: StockAlert) => a.status === "active");
      const activeExpiryNotifications = expiryData.filter(
        (n: ExpiryNotification) => n.status === "active"
      );

      setStockAlerts(activeStockAlerts);
      setExpiryNotifications(activeExpiryNotifications);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? product.name : "Unknown Product";
  };

  // Get critical alerts (out of stock and expired)
  const criticalStockAlerts = stockAlerts.filter((a) => a.alert_type === "out_of_stock");
  const lowStockAlerts = stockAlerts.filter((a) => a.alert_type === "low_stock");
  const expiredItems = expiryNotifications.filter((n) => n.notification_type === "expired");
  const expiringSoon = expiryNotifications.filter((n) => n.notification_type === "expiring_soon");

  const totalCritical = criticalStockAlerts.length + expiredItems.length;
  const totalWarnings = lowStockAlerts.length + expiringSoon.length;

  if (loading) {
    return (
      <div
        className={`rounded-lg border p-4 ${
          isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-center py-4">
          <Loader className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  // Don't show widget if no alerts
  if (totalCritical === 0 && totalWarnings === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`text-sm font-semibold flex items-center gap-2 ${
            isDarkTheme ? "text-white" : "text-slate-900"
          }`}
        >
          <Bell className="w-4 h-4" />
          Inventory Alerts
        </h3>
        {onAlertClick && (
          <button
            onClick={onAlertClick}
            className={`text-xs font-medium flex items-center gap-1 transition-colors ${
              isDarkTheme
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {totalCritical > 0 && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Critical</p>
                <p className="text-lg font-bold text-red-400">{totalCritical}</p>
              </div>
            </div>
          </div>
        )}
        {totalWarnings > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">Warnings</p>
                <p className="text-lg font-bold text-yellow-400">{totalWarnings}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Critical Alerts List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {/* Out of Stock Items */}
        {criticalStockAlerts.slice(0, 3).map((alert) => (
          <div
            key={alert._id}
            className={`p-2 rounded border text-xs ${
              isDarkTheme
                ? "bg-red-900/20 border-red-600/50"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${
                    isDarkTheme ? "text-red-300" : "text-red-700"
                  }`}
                >
                  {getProductName(alert.product_id)}
                </p>
                <p
                  className={`text-xs ${
                    isDarkTheme ? "text-red-400" : "text-red-600"
                  }`}
                >
                  Out of Stock
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Expired Items */}
        {expiredItems.slice(0, 3).map((notification) => (
          <div
            key={notification._id}
            className={`p-2 rounded border text-xs ${
              isDarkTheme
                ? "bg-red-900/20 border-red-600/50"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <Calendar className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${
                    isDarkTheme ? "text-red-300" : "text-red-700"
                  }`}
                >
                  {getProductName(notification.product_id)}
                </p>
                <p
                  className={`text-xs ${
                    isDarkTheme ? "text-red-400" : "text-red-600"
                  }`}
                >
                  Expired • {notification.quantity} units
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Low Stock Items */}
        {lowStockAlerts.slice(0, 2).map((alert) => (
          <div
            key={alert._id}
            className={`p-2 rounded border text-xs ${
              isDarkTheme
                ? "bg-yellow-900/20 border-yellow-600/50"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${
                    isDarkTheme ? "text-yellow-300" : "text-yellow-700"
                  }`}
                >
                  {getProductName(alert.product_id)}
                </p>
                <p
                  className={`text-xs ${
                    isDarkTheme ? "text-yellow-400" : "text-yellow-600"
                  }`}
                >
                  Low Stock • {alert.current_stock} units left
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Expiring Soon Items */}
        {expiringSoon.slice(0, 2).map((notification) => (
          <div
            key={notification._id}
            className={`p-2 rounded border text-xs ${
              isDarkTheme
                ? "bg-yellow-900/20 border-yellow-600/50"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <Clock className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${
                    isDarkTheme ? "text-yellow-300" : "text-yellow-700"
                  }`}
                >
                  {getProductName(notification.product_id)}
                </p>
                <p
                  className={`text-xs ${
                    isDarkTheme ? "text-yellow-400" : "text-yellow-600"
                  }`}
                >
                  Expires in {notification.days_until_expiry} days
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {(criticalStockAlerts.length + expiredItems.length + lowStockAlerts.length + expiringSoon.length) > 10 && (
        <div className="mt-2 pt-2 border-t border-slate-600">
          <p
            className={`text-xs text-center ${
              isDarkTheme ? "text-slate-400" : "text-slate-600"
            }`}
          >
            + {(criticalStockAlerts.length + expiredItems.length + lowStockAlerts.length + expiringSoon.length) - 10} more alerts
          </p>
        </div>
      )}

      {/* Action Message */}
      <div
        className={`mt-3 p-2 rounded text-xs ${
          isDarkTheme
            ? "bg-blue-900/20 border border-blue-600/50 text-blue-300"
            : "bg-blue-50 border border-blue-200 text-blue-700"
        }`}
      >
        <p className="font-semibold">⚠️ Inform your manager about critical alerts</p>
      </div>
    </div>
  );
}
