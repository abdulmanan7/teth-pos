import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Repeat2,
  Trash2,
  Loader,
  History,
  Eye,
  X,
  Filter,
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { TransactionHistory, Product } from "@shared/api";

interface TransactionHistoryViewerProps {
  onClose: () => void;
}

export default function TransactionHistoryViewer({
  onClose,
}: TransactionHistoryViewerProps) {
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionHistory | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [summary, setSummary] = useState<any>(null);
  const { get, post } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTransactions(),
        fetchProducts(),
        fetchSummary(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/transactions/recent?limit=100");
          setTransactions(data);
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
      console.error("Error fetching transactions:", error);
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
          const data = await get("/api/inventory/transactions/summary");
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

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "stock_in":
      case "return":
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case "stock_out":
      case "damage":
      case "expiry_disposal":
        return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case "transfer":
        return <Repeat2 className="w-5 h-5 text-blue-400" />;
      case "adjustment":
        return <Package className="w-5 h-5 text-yellow-400" />;
      default:
        return <History className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "stock_in":
      case "return":
        return "bg-green-900/20 border-green-600";
      case "stock_out":
      case "damage":
      case "expiry_disposal":
        return "bg-red-900/20 border-red-600";
      case "transfer":
        return "bg-blue-900/20 border-blue-600";
      case "adjustment":
        return "bg-yellow-900/20 border-yellow-600";
      default:
        return "bg-slate-700/30 border-slate-600";
    }
  };

  const getTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  let filteredTransactions = transactions;
  if (filterType !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.transaction_type === filterType
    );
  }
  if (filterStatus !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.status === filterStatus
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-6 h-6" />
          Transaction History
        </h3>
        <Button
          onClick={fetchData}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <Calendar className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-2xl font-bold text-white">
              {summary.total_transactions}
            </p>
          </div>
          <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Stock In</p>
            <p className="text-2xl font-bold text-green-400">
              {summary.stock_in}
            </p>
          </div>
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Stock Out</p>
            <p className="text-2xl font-bold text-red-400">
              {summary.stock_out}
            </p>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Adjustments</p>
            <p className="text-2xl font-bold text-yellow-400">
              {summary.adjustments}
            </p>
          </div>
          <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">Total Value</p>
            <p className="text-lg font-bold text-blue-400">
              ${summary.total_value?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Detail View */}
      {showDetail && selectedTransaction && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white flex items-center gap-2">
              {getTransactionIcon(selectedTransaction.transaction_type)}
              {getProductName(selectedTransaction.product_id)}
            </h4>
            <button
              onClick={() => setShowDetail(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Transaction ID</p>
              <p className="text-white font-mono text-xs">
                {selectedTransaction.transaction_id}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Type</p>
              <p className="text-white font-medium">
                {getTypeLabel(selectedTransaction.transaction_type)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p
                className={`text-white font-medium px-2 py-1 rounded text-xs w-fit ${getStatusColor(
                  selectedTransaction.status
                )}`}
              >
                {selectedTransaction.status.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Quantity</p>
              <p className="text-white font-medium">
                {selectedTransaction.quantity} units
              </p>
            </div>
            <div>
              <p className="text-slate-400">Unit Price</p>
              <p className="text-white font-medium">
                ${selectedTransaction.unit_price?.toFixed(2) || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Total Value</p>
              <p className="text-white font-medium">
                ${selectedTransaction.total_value?.toLocaleString() || "N/A"}
              </p>
            </div>
            {selectedTransaction.from_warehouse && (
              <div>
                <p className="text-slate-400">From Warehouse</p>
                <p className="text-white font-medium">
                  {selectedTransaction.from_warehouse}
                </p>
              </div>
            )}
            {selectedTransaction.to_warehouse && (
              <div>
                <p className="text-slate-400">To Warehouse</p>
                <p className="text-white font-medium">
                  {selectedTransaction.to_warehouse}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-400">Date</p>
              <p className="text-white font-medium">
                {new Date(selectedTransaction.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {selectedTransaction.notes && (
            <div className="border-t border-slate-600 pt-4">
              <p className="text-slate-400 text-sm">Notes</p>
              <p className="text-white">{selectedTransaction.notes}</p>
            </div>
          )}

          {selectedTransaction.serial_numbers &&
            selectedTransaction.serial_numbers.length > 0 && (
              <div className="border-t border-slate-600 pt-4">
                <p className="text-slate-400 text-sm mb-2">Serial Numbers</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTransaction.serial_numbers.map((sn, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-600 text-white px-2 py-1 rounded text-xs font-mono"
                    >
                      {sn}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="all">All Types</option>
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
          <option value="adjustment">Adjustment</option>
          <option value="transfer">Transfer</option>
          <option value="return">Return</option>
          <option value="damage">Damage</option>
          <option value="expiry_disposal">Expiry Disposal</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-slate-400 text-sm py-2">
          {filteredTransactions.length} transactions
        </span>
      </div>

      {/* List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction._id}
              className={`border rounded-lg p-3 flex items-center justify-between transition-colors ${getTransactionColor(
                transaction.transaction_type
              )}`}
            >
              <div className="flex-1 flex items-start gap-3">
                <div className="mt-1">
                  {getTransactionIcon(transaction.transaction_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white truncate">
                      {getProductName(transaction.product_id)}
                    </h4>
                    <span
                      className={`text-xs text-white px-2 py-1 rounded ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {getTypeLabel(transaction.transaction_type)} • Qty:{" "}
                    {transaction.quantity} • Value: $
                    {transaction.total_value?.toLocaleString() || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(transaction.createdAt).toLocaleString()} •{" "}
                    {transaction.transaction_id}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowDetail(true);
                  }}
                  className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
