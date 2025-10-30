import { X, Search, Download, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { Order } from "@shared/api";

export default function OrderHistoryModal({ isDarkTheme, onClose }: { isDarkTheme: boolean; onClose: () => void }) {
  const { get } = useElectronApi();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    
    fetchOrders();
  }, [get]);

  const filtered = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.includes(searchTerm) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalRevenue = filtered.reduce((sum, order) => sum + order.total, 0);
  const totalItems = filtered.reduce((sum, order) => sum + order.items.length, 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Order History</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-slate-700 bg-slate-700/30">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-green-400">
                Rs {totalRevenue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Total Items Sold</p>
              <p className="text-3xl font-bold text-blue-400">{totalItems}</p>
            </div>
          </div>
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

          {/* Date Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "today", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  dateFilter === period
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
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
                filtered.map((order) => (
                  <div
                    key={order._id}
                    className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white text-lg">
                        {order.orderNumber}
                      </h3>
                      <p className="text-2xl font-bold text-green-400">
                        Rs {order.total.toFixed(2)}
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
                        <p className="text-slate-400 mb-1">Created</p>
                        <p>{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Close
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}
