import { useState } from "react";
import { Printer, ChevronDown, ChevronUp, X } from "lucide-react";
import { formatCurrencyNew } from "@/utils";
import type { Order } from "@shared/api";

interface RecentOrdersWidgetProps {
  isDarkTheme?: boolean;
  orders: Order[];
}

export default function RecentOrdersWidget({
  isDarkTheme = true,
  orders,
}: RecentOrdersWidgetProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const recentThreeOrders = orders.slice(0, 3);

  return (
    <>
      <div
        className={`rounded-lg border p-4 ${
          isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        }`}
      >
        <h3
          className={`text-sm font-semibold mb-3 ${
            isDarkTheme ? "text-white" : "text-slate-900"
          }`}
        >
          📋 Recent Orders ({recentThreeOrders.length})
        </h3>
        <div className="space-y-2">
          {recentThreeOrders.length === 0 ? (
            <p
              className={`text-xs text-center py-4 ${
                isDarkTheme ? "text-slate-400" : "text-slate-500"
              }`}
            >
              No orders yet
            </p>
          ) : (
            recentThreeOrders.map((order: any) => {
              const isExpanded = expandedOrderId === order._id;
              const timeAgo = getTimeAgo(order.createdAt);

              return (
                <div
                  key={order._id}
                  className={`rounded border transition-colors ${
                    isDarkTheme
                      ? "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                      : "bg-slate-100 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  {/* Order Header */}
                  <div className="p-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isDarkTheme ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {order.orderNumber}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            isDarkTheme ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {order.customer}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <p
                          className={`text-xs font-bold ${
                            isDarkTheme ? "text-emerald-400" : "text-emerald-600"
                          }`}
                        >
                          {formatCurrencyNew(order.total)}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowReceipt(true);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isDarkTheme
                              ? "hover:bg-slate-600 text-slate-400 hover:text-white"
                              : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                          }`}
                          title="Print receipt"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkTheme ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {timeAgo}
                    </p>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() =>
                      setExpandedOrderId(isExpanded ? null : order._id)
                    }
                    className={`w-full px-2 py-1.5 border-t flex items-center justify-between text-xs font-medium transition-colors ${
                      isDarkTheme
                        ? "border-slate-600 text-blue-400 hover:bg-slate-600/50"
                        : "border-slate-300 text-blue-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div
                      className={`p-3 border-t space-y-3 ${
                        isDarkTheme ? "border-slate-600" : "border-slate-300"
                      }`}
                    >
                      {/* Order Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p
                            className={`${
                              isDarkTheme ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            Order ID
                          </p>
                          <p
                            className={`font-semibold truncate ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {order._id}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`${
                              isDarkTheme ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            Status
                          </p>
                          <p
                            className={`font-semibold capitalize ${
                              order.status === "completed"
                                ? isDarkTheme
                                  ? "text-green-400"
                                  : "text-green-600"
                                : isDarkTheme
                                ? "text-yellow-400"
                                : "text-yellow-600"
                            }`}
                          >
                            {order.status}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`${
                              isDarkTheme ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            Payment
                          </p>
                          <p
                            className={`font-semibold capitalize ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {order.paymentMethod}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`${
                              isDarkTheme ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            Date
                          </p>
                          <p
                            className={`font-semibold ${
                              isDarkTheme ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Items List */}
                      <div>
                        <p
                          className={`text-xs font-semibold mb-2 ${
                            isDarkTheme ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          Items ({order.items?.length || 0})
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-2 rounded text-xs ${
                                  isDarkTheme
                                    ? "bg-slate-600/30"
                                    : "bg-slate-100"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`font-semibold truncate ${
                                        isDarkTheme
                                          ? "text-white"
                                          : "text-slate-900"
                                      }`}
                                    >
                                      {item.name}
                                    </p>
                                    <p
                                      className={`${
                                        isDarkTheme
                                          ? "text-slate-400"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      Qty: {item.quantity}
                                    </p>
                                  </div>
                                  <p
                                    className={`font-semibold whitespace-nowrap ${
                                      isDarkTheme
                                        ? "text-emerald-400"
                                        : "text-emerald-600"
                                    }`}
                                  >
                                    {formatCurrencyNew(item.price * item.quantity)}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p
                              className={`text-xs ${
                                isDarkTheme ? "text-slate-400" : "text-slate-600"
                              }`}
                            >
                              No items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Total Summary */}
                      <div
                        className={`border-t pt-2 ${
                          isDarkTheme ? "border-slate-600" : "border-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <p
                            className={`font-semibold ${
                              isDarkTheme ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Total
                          </p>
                          <p
                            className={`text-sm font-bold ${
                              isDarkTheme
                                ? "text-emerald-400"
                                : "text-emerald-600"
                            }`}
                          >
                            {formatCurrencyNew(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
