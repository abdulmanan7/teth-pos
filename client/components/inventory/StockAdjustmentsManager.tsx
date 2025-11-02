import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Loader,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { StockAdjustment, Product, Warehouse } from "@shared/api";

interface StockAdjustmentsManagerProps {
  isDarkTheme?: boolean;
  onClose: () => void;
}

interface AdjustmentLine {
  product_id: string;
  lot_id?: string;
  serial_id?: string;
  current_quantity: number;
  adjusted_quantity: number;
  difference: number;
  unit_cost?: number;
  line_total?: number;
  notes?: string;
}

export default function StockAdjustmentsManager({ isDarkTheme = true, onClose }: StockAdjustmentsManagerProps) {
  const { addToast } = useToast();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    warehouse_id: "",
    adjustment_date: new Date().toISOString().split("T")[0],
    reason: "count_discrepancy",
    notes: "",
    lines: [] as AdjustmentLine[],
  });
  const [currentLine, setCurrentLine] = useState<AdjustmentLine>({
    product_id: "",
    current_quantity: 0,
    adjusted_quantity: 0,
    difference: 0,
  });
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAdjustments(),
        fetchProducts(),
        fetchWarehouses(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/stock-adjustments");
          setAdjustments(data);
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
      console.error("Error fetching adjustments:", error);
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

  const fetchWarehouses = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/warehouses");
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

  const handleAddLine = () => {
    if (!currentLine.product_id) {
      addToast("Please select a product", "warning");
      return;
    }

    const newLine = {
      ...currentLine,
      difference: currentLine.adjusted_quantity - currentLine.current_quantity,
      line_total: (currentLine.adjusted_quantity - currentLine.current_quantity) * (currentLine.unit_cost || 0),
    };

    setFormData({
      ...formData,
      lines: [...formData.lines, newLine],
    });

    setCurrentLine({
      product_id: "",
      current_quantity: 0,
      adjusted_quantity: 0,
      difference: 0,
    });
  };

  const handleRemoveLine = (index: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.warehouse_id || formData.lines.length === 0) {
      addToast("Please select a warehouse and add at least one line item", "warning");
      return;
    }

    try {
      const payload = {
        ...formData,
        created_by: "current_user",
      };

      await post("/api/inventory/stock-adjustments", payload);
      resetForm();
      await fetchAdjustments();
      addToast("Stock adjustment created successfully", "success");
    } catch (error) {
      console.error("Error creating adjustment:", error);
      addToast("Failed to create adjustment", "error");
    }
  };

  const handleApprove = async (id: string) => {
    if (confirm("Approve this adjustment? This will update the inventory immediately.")) {
      try {
        await put(`/api/inventory/stock-adjustments/${id}/approve`, {
          approved_by: "current_user",
        });
        await fetchAdjustments();
        addToast("Adjustment approved and inventory updated", "success");
      } catch (error) {
        console.error("Error approving adjustment:", error);
        addToast("Failed to approve adjustment", "error");
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (reason !== null) {
      try {
        await put(`/api/inventory/stock-adjustments/${id}/reject`, {
          rejection_reason: reason,
        });
        await fetchAdjustments();
        addToast("Adjustment rejected", "success");
      } catch (error) {
        console.error("Error rejecting adjustment:", error);
        addToast("Failed to reject adjustment", "error");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this adjustment? (Only draft adjustments can be deleted)")) {
      try {
        await deleteRequest(`/api/inventory/stock-adjustments/${id}`);
        await fetchAdjustments();
        addToast("Adjustment deleted", "success");
      } catch (error) {
        console.error("Error deleting adjustment:", error);
        addToast("Failed to delete adjustment", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      warehouse_id: "",
      adjustment_date: new Date().toISOString().split("T")[0],
      reason: "count_discrepancy",
      notes: "",
      lines: [],
    });
    setCurrentLine({
      product_id: "",
      current_quantity: 0,
      adjusted_quantity: 0,
      difference: 0,
    });
    setShowForm(false);
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w._id === warehouseId);
    return warehouse ? `${warehouse.name} (${warehouse.code})` : warehouseId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-600";
      case "pending_approval":
        return "bg-yellow-600";
      case "approved":
        return "bg-green-600";
      case "rejected":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "pending_approval":
        return "Pending Approval";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const filteredAdjustments =
    filterStatus === "all"
      ? adjustments
      : adjustments.filter((a) => a.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          <AlertCircle className="w-6 h-6" />
          Stock Adjustments
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New Adjustment
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className={`border rounded-lg p-4 space-y-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
          <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Create Stock Adjustment</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Warehouse
                </label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) =>
                    setFormData({ ...formData, warehouse_id: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Adjustment Date
                </label>
                <Input
                  type="date"
                  value={formData.adjustment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, adjustment_date: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
                >
                  <option value="count_discrepancy">Count Discrepancy</option>
                  <option value="damage">Damage</option>
                  <option value="loss">Loss/Theft</option>
                  <option value="expiry">Expiry Write-off</option>
                  <option value="transfer">Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <Input
              type="text"
              placeholder="Notes (Optional)"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-white"
            />

            {/* Line Items */}
            <div className="border-t border-slate-600 pt-4">
              <h5 className="font-semibold text-white mb-3">Line Items</h5>

              {/* Add Line Form */}
              <div className="bg-slate-600/30 rounded p-3 mb-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Product
                    </label>
                    <select
                      value={currentLine.product_id}
                      onChange={(e) => {
                        const productId = e.target.value;
                        const selectedProduct = products.find((p) => p._id === productId);
                        setCurrentLine({
                          ...currentLine,
                          product_id: productId,
                          current_quantity: selectedProduct?.stock || 0,
                          adjusted_quantity: selectedProduct?.stock || 0,
                        });
                      }}
                      className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 w-full text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Current Qty
                    </label>
                    <Input
                      type="number"
                      value={currentLine.current_quantity}
                      onChange={(e) =>
                        setCurrentLine({
                          ...currentLine,
                          current_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Adjusted Qty
                    </label>
                    <Input
                      type="number"
                      value={currentLine.adjusted_quantity}
                      onChange={(e) =>
                        setCurrentLine({
                          ...currentLine,
                          adjusted_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Unit Cost (Optional)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentLine.unit_cost || ""}
                      onChange={(e) =>
                        setCurrentLine({
                          ...currentLine,
                          unit_cost: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddLine}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      Add Line
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lines List */}
              {formData.lines.length > 0 && (
                <div className="space-y-2">
                  {formData.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-600/20 rounded p-2 flex items-center justify-between text-sm"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {getProductName(line.product_id)}
                        </p>
                        <p className="text-slate-400">
                          {line.current_quantity} → {line.adjusted_quantity} (Diff: {line.difference})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Create Adjustment
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Detail View */}
      {showDetail && selectedAdjustment && (
        <div className={`border rounded-lg p-4 space-y-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {selectedAdjustment.adjustment_number}
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
              <p className="text-slate-400">Warehouse</p>
              <p className="text-white font-medium">
                {getWarehouseName(selectedAdjustment.warehouse_id)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Date</p>
              <p className="text-white font-medium">
                {new Date(selectedAdjustment.adjustment_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Reason</p>
              <p className="text-white font-medium">{selectedAdjustment.reason}</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className={`text-white font-medium ${getStatusColor(selectedAdjustment.status)}`}>
                {getStatusLabel(selectedAdjustment.status)}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-600 pt-4">
            <h5 className="font-semibold text-white mb-2">Line Items</h5>
            <div className="space-y-2">
              {selectedAdjustment.lines.map((line, idx) => (
                <div key={idx} className="bg-slate-600/20 rounded p-2 text-sm">
                  <p className="text-white font-medium">
                    {getProductName(line.product_id)}
                  </p>
                  <p className="text-slate-400">
                    {line.current_quantity} → {line.adjusted_quantity} (Diff: {line.difference})
                  </p>
                  {line.notes && (
                    <p className="text-slate-500 text-xs">Notes: {line.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedAdjustment.notes && (
            <div className="border-t border-slate-600 pt-4">
              <p className="text-slate-400 text-sm">Notes</p>
              <p className="text-white">{selectedAdjustment.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          {(selectedAdjustment.status === "draft" || selectedAdjustment.status === "pending_approval") && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(selectedAdjustment._id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(selectedAdjustment._id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject
              </Button>
              {selectedAdjustment.status === "draft" && (
                <Button
                  onClick={() => handleDelete(selectedAdjustment._id)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className={`text-sm py-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          {filteredAdjustments.length} adjustments
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filteredAdjustments.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No adjustments found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAdjustments.map((adjustment) => (
            <div
              key={adjustment._id}
              className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {adjustment.adjustment_number}
                  </h4>
                  <span
                    className={`text-xs text-white px-2 py-1 rounded ${getStatusColor(
                      adjustment.status
                    )}`}
                  >
                    {getStatusLabel(adjustment.status)}
                  </span>
                </div>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-700'}`}>
                  {getWarehouseName(adjustment.warehouse_id)} • {adjustment.reason} •{" "}
                  {adjustment.lines.length} items
                </p>
                <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-700'}`}>
                  {new Date(adjustment.adjustment_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedAdjustment(adjustment);
                    setShowDetail(true);
                  }}
                  className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {adjustment.status === "draft" && (
                  <button
                    onClick={() => handleDelete(adjustment._id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
