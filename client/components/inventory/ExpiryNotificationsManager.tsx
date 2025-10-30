import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Trash2,
  Loader,
  Calendar,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { ExpiryNotification, Product, LotNumber } from "@shared/api";

interface ExpiryNotificationsManagerProps {
  onClose: () => void;
}

export default function ExpiryNotificationsManager({
  onClose,
}: ExpiryNotificationsManagerProps) {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<LotNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<ExpiryNotification | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [filterType, setFilterType] = useState<string>("all");
  const [summary, setSummary] = useState({
    expired: 0,
    expiring_soon: 0,
    upcoming: 0,
    total_active: 0,
  });
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchNotifications(),
        fetchProducts(),
        fetchLots(),
        fetchSummary(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/expiry-notifications");
          setNotifications(data);
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
      console.error("Error fetching notifications:", error);
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

  const fetchLots = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/lot-numbers");
          setLots(data);
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
      console.error("Error fetching lots:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/expiry-notifications/summary");
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

  const handleCheckExpiries = async () => {
    try {
      setLoading(true);
      const result = await post("/api/inventory/expiry-notifications/check", {});
      addToast(
        `Expiry check completed. ${result.notifications_created} new notifications created.`,
        "success"
      );
      await fetchData();
    } catch (error) {
      console.error("Error checking expiries:", error);
      addToast("Failed to check expiries", "error");
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await put(`/api/inventory/expiry-notifications/${id}/acknowledge`, {
        acknowledged_by: "current_user",
      });
      await fetchData();
      addToast("Notification acknowledged", "success");
    } catch (error) {
      console.error("Error acknowledging notification:", error);
      addToast("Failed to acknowledge notification", "error");
    }
  };

  const handleResolve = async (id: string, resolutionType: string) => {
    try {
      await put(`/api/inventory/expiry-notifications/${id}/resolve`, {
        resolution_type: resolutionType,
      });
      await fetchData();
      addToast("Notification resolved", "success");
    } catch (error) {
      console.error("Error resolving notification:", error);
      addToast("Failed to resolve notification", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this notification?")) {
      try {
        await deleteRequest(`/api/inventory/expiry-notifications/${id}`);
        await fetchData();
        addToast("Notification deleted", "success");
      } catch (error) {
        console.error("Error deleting notification:", error);
        addToast("Failed to delete notification", "error");
      }
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const getLotNumber = (lotId: string) => {
    const lot = lots.find((l) => l._id === lotId);
    return lot ? (lot.title ? `${lot.title} (${lot.lot_number})` : lot.lot_number) : lotId;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expired":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "expiring_soon":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "upcoming":
        return <Calendar className="w-5 h-5 text-blue-400" />;
      default:
        return <Calendar className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "expired":
        return "bg-red-900/20 border-red-600";
      case "expiring_soon":
        return "bg-yellow-900/20 border-yellow-600";
      case "upcoming":
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
      case "expired":
        return "Expired";
      case "expiring_soon":
        return "Expiring Soon";
      case "upcoming":
        return "Upcoming";
      default:
        return type;
    }
  };

  let filteredNotifications = notifications;
  if (filterStatus !== "all") {
    filteredNotifications = filteredNotifications.filter(
      (n) => n.status === filterStatus
    );
  }
  if (filterType !== "all") {
    filteredNotifications = filteredNotifications.filter(
      (n) => n.notification_type === filterType
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Expiry Notifications
        </h3>
        <Button
          onClick={handleCheckExpiries}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Check Expiries
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Expired</p>
          <p className="text-2xl font-bold text-red-400">{summary.expired}</p>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-400">
            {summary.expiring_soon}
          </p>
        </div>
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Upcoming</p>
          <p className="text-2xl font-bold text-blue-400">{summary.upcoming}</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
          <p className="text-xs text-slate-400">Total Active</p>
          <p className="text-2xl font-bold text-white">
            {summary.total_active}
          </p>
        </div>
      </div>

      {/* Detail View */}
      {showDetail && selectedNotification && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white flex items-center gap-2">
              {getNotificationIcon(selectedNotification.notification_type)}
              {getProductName(selectedNotification.product_id)}
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
              <p className="text-slate-400">Notification Type</p>
              <p className="text-white font-medium">
                {getTypeLabel(selectedNotification.notification_type)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className={`text-white font-medium ${getStatusColor(selectedNotification.status)}`}>
                {getStatusLabel(selectedNotification.status)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Lot Number</p>
              <p className="text-white font-medium">
                {getLotNumber(selectedNotification.lot_id)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Quantity</p>
              <p className="text-white font-medium">
                {selectedNotification.quantity} units
              </p>
            </div>
            <div>
              <p className="text-slate-400">Expiry Date</p>
              <p className="text-white font-medium">
                {new Date(selectedNotification.expiry_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Days Until Expiry</p>
              <p className="text-white font-medium">
                {selectedNotification.days_until_expiry} days
              </p>
            </div>
          </div>

          {selectedNotification.notes && (
            <div className="border-t border-slate-600 pt-4">
              <p className="text-slate-400 text-sm">Notes</p>
              <p className="text-white">{selectedNotification.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {selectedNotification.status === "active" && (
              <>
                <Button
                  onClick={() => handleAcknowledge(selectedNotification._id)}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Acknowledge
                </Button>
                <Button
                  onClick={() => handleResolve(selectedNotification._id, "disposed")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Disposed
                </Button>
                <Button
                  onClick={() => handleResolve(selectedNotification._id, "used")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Used
                </Button>
                <Button
                  onClick={() => handleResolve(selectedNotification._id, "transferred")}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Transferred
                </Button>
              </>
            )}
            {selectedNotification.status === "acknowledged" && (
              <>
                <Button
                  onClick={() => handleResolve(selectedNotification._id, "disposed")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Disposed
                </Button>
                <Button
                  onClick={() => handleResolve(selectedNotification._id, "used")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Used
                </Button>
              </>
            )}
            <Button
              onClick={() => handleDelete(selectedNotification._id)}
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
          <option value="expired">Expired</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="upcoming">Upcoming</option>
        </select>
        <span className="text-slate-400 text-sm py-2">
          {filteredNotifications.length} notifications
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No expiry notifications found. All products are fresh!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${getNotificationColor(
                notification.notification_type
              )}`}
            >
              <div className="flex-1 flex items-start gap-3">
                <div className="mt-1">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">
                      {getProductName(notification.product_id)}
                    </h4>
                    <span
                      className={`text-xs text-white px-2 py-1 rounded ${getStatusColor(
                        notification.status
                      )}`}
                    >
                      {getStatusLabel(notification.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {getTypeLabel(notification.notification_type)} • Qty:{" "}
                    {notification.quantity} • Expires:{" "}
                    {new Date(notification.expiry_date).toLocaleDateString()} •{" "}
                    {notification.days_until_expiry} days
                  </p>
                  <p className="text-xs text-slate-500">
                    Lot: {getLotNumber(notification.lot_id)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedNotification(notification);
                    setShowDetail(true);
                  }}
                  className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {notification.status === "active" && (
                  <button
                    onClick={() => handleAcknowledge(notification._id)}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                    title="Acknowledge"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                )}
                {notification.status !== "resolved" && (
                  <button
                    onClick={() =>
                      handleResolve(notification._id, "disposed")
                    }
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    title="Resolve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification._id)}
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
