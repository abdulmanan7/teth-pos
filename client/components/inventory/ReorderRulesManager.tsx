import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader, Truck, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { ReorderRule, Product, Warehouse } from "@shared/api";

interface ReorderRulesManagerProps {
  onClose: () => void;
}

export default function ReorderRulesManager({ onClose }: ReorderRulesManagerProps) {
  const [rules, setRules] = useState<ReorderRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    product_name: "",
    warehouse_id: "",
    warehouse_name: "",
    minimum_quantity: "",
    reorder_point: "",
    reorder_quantity: "",
    safety_stock: "",
    lead_time_days: "",
  });
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          const [rulesData, productsData, warehousesData] = await Promise.all([
            get("/api/inventory/reorder-rules"),
            get("/api/products"),
            get("/api/inventory/warehouses"),
          ]);
          setRules(rulesData);
          setProducts(productsData);
          setWarehouses(warehousesData);
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
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.reorder_point || !formData.reorder_quantity) {
      alert("Product ID, reorder point, and reorder quantity are required");
      return;
    }

    try {
      const payload = {
        product_id: formData.product_id,
        warehouse_id: formData.warehouse_id || undefined,
        minimum_quantity: parseInt(formData.minimum_quantity) || 0,
        reorder_point: parseInt(formData.reorder_point),
        reorder_quantity: parseInt(formData.reorder_quantity),
        safety_stock: formData.safety_stock ? parseInt(formData.safety_stock) : undefined,
        lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : undefined,
      };

      if (editingId) {
        await put(`/api/inventory/reorder-rules/${editingId}`, payload);
      } else {
        await post("/api/inventory/reorder-rules", payload);
      }
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving reorder rule:", error);
      alert("Failed to save reorder rule");
    }
  };

  const handleEdit = (rule: ReorderRule) => {
    const product = products.find(p => p._id === rule.product_id);
    const warehouse = warehouses.find(w => w._id === rule.warehouse_id);
    
    setFormData({
      product_id: rule.product_id,
      product_name: product?.name || "",
      warehouse_id: rule.warehouse_id || "",
      warehouse_name: warehouse?.name || "",
      minimum_quantity: rule.minimum_quantity.toString(),
      reorder_point: rule.reorder_point.toString(),
      reorder_quantity: rule.reorder_quantity.toString(),
      safety_stock: rule.safety_stock?.toString() || "",
      lead_time_days: rule.lead_time_days?.toString() || "",
    });
    setEditingId(rule._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this reorder rule?")) {
      try {
        await deleteRequest(`/api/inventory/reorder-rules/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Error deleting reorder rule:", error);
        alert("Failed to delete reorder rule");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      product_name: "",
      warehouse_id: "",
      warehouse_name: "",
      minimum_quantity: "",
      reorder_point: "",
      reorder_quantity: "",
      safety_stock: "",
      lead_time_days: "",
    });
    setProductSearch("");
    setWarehouseSearch("");
    setShowProductDropdown(false);
    setShowWarehouseDropdown(false);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Reorder Rules Management
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Product Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded text-left flex items-center justify-between hover:border-slate-500 transition-colors"
                >
                  <span className={formData.product_name ? "text-white" : "text-slate-400"}>
                    {formData.product_name || "Select Product *"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showProductDropdown && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-600 border-b border-slate-500 text-white placeholder-slate-400 sticky top-0"
                      autoFocus
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {products
                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map(product => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, product_id: product._id, product_name: product.name });
                              setShowProductDropdown(false);
                              setProductSearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-600 text-white text-sm border-b border-slate-600 last:border-0"
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-slate-400">SKU: {product.sku}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Warehouse Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded text-left flex items-center justify-between hover:border-slate-500 transition-colors"
                >
                  <span className={formData.warehouse_name ? "text-white" : "text-slate-400"}>
                    {formData.warehouse_name || "Select Warehouse (optional)"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showWarehouseDropdown && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-slate-700 border border-slate-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search warehouses..."
                      value={warehouseSearch}
                      onChange={(e) => setWarehouseSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-600 border-b border-slate-500 text-white placeholder-slate-400 sticky top-0"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, warehouse_id: "", warehouse_name: "" });
                        setShowWarehouseDropdown(false);
                        setWarehouseSearch("");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-600 text-slate-300 text-sm border-b border-slate-600"
                    >
                      <div className="font-medium">None (All Warehouses)</div>
                    </button>
                    <div className="max-h-40 overflow-y-auto">
                      {warehouses
                        .filter(w => w.name.toLowerCase().includes(warehouseSearch.toLowerCase()))
                        .map(warehouse => (
                          <button
                            key={warehouse._id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, warehouse_id: warehouse._id, warehouse_name: warehouse.name });
                              setShowWarehouseDropdown(false);
                              setWarehouseSearch("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-600 text-white text-sm border-b border-slate-600 last:border-0"
                          >
                            <div className="font-medium">{warehouse.name}</div>
                            <div className="text-xs text-slate-400">{warehouse.code}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Minimum Quantity"
                value={formData.minimum_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, minimum_quantity: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                type="number"
                placeholder="Reorder Point"
                value={formData.reorder_point}
                onChange={(e) =>
                  setFormData({ ...formData, reorder_point: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Reorder Quantity"
                value={formData.reorder_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, reorder_quantity: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Input
                type="number"
                placeholder="Safety Stock (optional)"
                value={formData.safety_stock}
                onChange={(e) =>
                  setFormData({ ...formData, safety_stock: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Input
              type="number"
              placeholder="Lead Time Days (optional)"
              value={formData.lead_time_days}
              onChange={(e) =>
                setFormData({ ...formData, lead_time_days: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-white"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {editingId ? "Update" : "Create"} Rule
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
      ) : rules.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No reorder rules found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule._id}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white">
                      {products.find(p => p._id === rule.product_id)?.name || rule.product_id}
                    </h4>
                    {!rule.is_active && (
                      <span className="text-xs bg-slate-600 text-white px-2 py-1 rounded">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Reorder Point</p>
                      <p className="text-white font-semibold">{rule.reorder_point}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Reorder Qty</p>
                      <p className="text-white font-semibold">{rule.reorder_quantity}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Min Quantity</p>
                      <p className="text-white font-semibold">{rule.minimum_quantity}</p>
                    </div>
                    {rule.safety_stock && (
                      <div>
                        <p className="text-slate-400">Safety Stock</p>
                        <p className="text-white font-semibold">{rule.safety_stock}</p>
                      </div>
                    )}
                  </div>
                  {rule.warehouse_id && (
                    <p className="text-xs text-slate-500 mt-2">
                      Warehouse: {warehouses.find(w => w._id === rule.warehouse_id)?.name || rule.warehouse_id}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule._id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
