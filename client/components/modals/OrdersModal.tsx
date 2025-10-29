import { X, Search, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { Order } from "@shared/api";

const statusConfig = {
  pending: { color: "text-yellow-400", bg: "bg-yellow-500/10" },
  processing: { color: "text-blue-400", bg: "bg-blue-500/10" },
  completed: { color: "text-green-400", bg: "bg-green-500/10" },
  cancelled: { color: "text-red-400", bg: "bg-red-500/10" },
};

export default function OrdersModal({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { get } = useElectronApi();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await get("/api/orders");
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.includes(searchTerm) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Active Orders</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-slate-700 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === null
                  ? "bg-blue-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              All
            </button>
            {(
              ["pending", "processing", "completed", "cancelled"] as const
            ).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  statusFilter === status
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No orders found</p>
                </div>
              ) : (
                filtered.map((order) => {
                  const statusConfig_ =
                    statusConfig[order.status as keyof typeof statusConfig];
                  return (
                    <div
                      key={order._id}
                      className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <h3 className="font-bold text-white text-lg">
                            {order.orderNumber}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${statusConfig_.color} ${statusConfig_.bg}`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
                        <div>
                          <p className="text-slate-400 mb-1">Customer</p>
                          <p>{order.customer}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Items</p>
                          <p>{order.items.length} products</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Order Time</p>
                          <p>{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
