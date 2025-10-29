import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { LotNumber, Product, Warehouse } from "@shared/api";

interface LotNumbersManagerProps {
  onClose: () => void;
}

export default function LotNumbersManager({ onClose }: LotNumbersManagerProps) {
  const [lotNumbers, setLotNumbers] = useState<LotNumber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    lot_number: "",
    title: "",
    product_id: "",
    quantity: "",
    warehouse_id: "",
    manufacture_date: "",
    expiry_date: "",
    notes: "",
  });
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchLotNumbers(),
        fetchProducts(),
        fetchWarehouses(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLotNumbers = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/lot-numbers");
          setLotNumbers(data);
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
      console.error("Error fetching lot numbers:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lot_number || !formData.product_id || !formData.warehouse_id) {
      alert("Lot number, product ID, and warehouse ID are required");
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        manufacture_date: formData.manufacture_date || undefined,
        expiry_date: formData.expiry_date || undefined,
      };

      if (editingId) {
        await put(`/api/inventory/lot-numbers/${editingId}`, payload);
      } else {
        await post("/api/inventory/lot-numbers", payload);
      }
      resetForm();
      await fetchLotNumbers();
    } catch (error) {
      console.error("Error saving lot number:", error);
      alert("Failed to save lot number");
    }
  };

  const handleEdit = (lot: LotNumber) => {
    // Convert ISO date strings to YYYY-MM-DD format for date inputs
    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    setFormData({
      lot_number: lot.lot_number,
      title: lot.title || "",
      product_id: lot.product_id,
      quantity: lot.quantity.toString(),
      warehouse_id: lot.warehouse_id,
      manufacture_date: formatDateForInput(lot.manufacture_date),
      expiry_date: formatDateForInput(lot.expiry_date),
      notes: lot.notes || "",
    });
    setEditingId(lot._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lot number?")) {
      try {
        await deleteRequest(`/api/inventory/lot-numbers/${id}`);
        await fetchLotNumbers();
      } catch (error) {
        console.error("Error deleting lot number:", error);
        alert("Failed to delete lot number");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      lot_number: "",
      title: "",
      product_id: "",
      quantity: "",
      warehouse_id: "",
      manufacture_date: "",
      expiry_date: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const isExpired = (expiry_date?: string) => {
    if (!expiry_date) return false;
    return new Date(expiry_date) < new Date();
  };

  const isExpiringSoon = (expiry_date?: string) => {
    if (!expiry_date) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(expiry_date);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w._id === warehouseId);
    return warehouse ? `${warehouse.name} (${warehouse.code})` : warehouseId;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="w-6 h-6" />
          Lot Numbers Management
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lot
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder="Lot Number"
                value={formData.lot_number}
                onChange={(e) =>
                  setFormData({ ...formData, lot_number: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                type="text"
                placeholder="Title (Optional)"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.product_id}
                onChange={(e) =>
                  setFormData({ ...formData, product_id: e.target.value })
                }
                className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse_id: e.target.value })
                }
                className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Manufacture Date (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.manufacture_date}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacture_date: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Expiry Date (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white w-full"
                />
              </div>
            </div>
            <Input
              type="text"
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-white"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {editingId ? "Update" : "Create"} Lot
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

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : lotNumbers.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No lot numbers found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lotNumbers.map((lot) => (
            <div
              key={lot._id}
              className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${
                isExpired(lot.expiry_date)
                  ? "bg-red-900/20 border-red-600"
                  : isExpiringSoon(lot.expiry_date)
                    ? "bg-yellow-900/20 border-yellow-600"
                    : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white">
                    {lot.title ? `${lot.title} (${lot.lot_number})` : lot.lot_number}
                  </h4>
                  {isExpired(lot.expiry_date) && (
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                      EXPIRED
                    </span>
                  )}
                  {isExpiringSoon(lot.expiry_date) && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                      EXPIRING SOON
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">
                  Product: {getProductName(lot.product_id)} • Qty: {lot.quantity} • Warehouse: {getWarehouseName(lot.warehouse_id)}
                </p>
                {lot.expiry_date && (
                  <p className="text-xs text-slate-500">
                    Expires: {new Date(lot.expiry_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(lot)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(lot._id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
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
