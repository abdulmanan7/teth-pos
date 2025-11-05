import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader, Truck, AlertCircle, ChevronDown, Package, TrendingDown, Clock, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { ReorderRule, Product, Warehouse } from "@shared/api";

interface ReorderRulesManagerProps {
  isDarkTheme?: boolean;
  onClose: () => void;
}

export default function ReorderRulesManager({ isDarkTheme = true, onClose }: ReorderRulesManagerProps) {
  const { addToast } = useToast();
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
      addToast("Product, reorder point, and reorder quantity are required", "warning");
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
        addToast("Reorder rule updated successfully", "success");
      } else {
        await post("/api/inventory/reorder-rules", payload);
        addToast("Reorder rule created successfully", "success");
      }
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving reorder rule:", error);
      addToast("Failed to save reorder rule", "error");
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
        addToast("Reorder rule deleted", "success");
        await fetchData();
      } catch (error) {
        console.error("Error deleting reorder rule:", error);
        addToast("Failed to delete reorder rule", "error");
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
        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
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
        <div className={`border rounded-lg p-6 space-y-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
          <div>
            <h4 className={`font-semibold text-lg ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              {editingId ? 'Edit' : 'Create'} Reorder Rule
            </h4>
            <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              Set automatic reorder points to maintain optimal stock levels
            </p>
          </div>

          {/* Info Box */}
          <div className={`rounded-lg p-4 ${isDarkTheme ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className={`font-medium mb-2 ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>How Reorder Rules Work:</p>
                <ul className={`space-y-1 ${isDarkTheme ? 'text-blue-200' : 'text-blue-600'}`}>
                  <li>• <strong>Reorder Point:</strong> When stock falls to this level, trigger reorder</li>
                  <li>• <strong>Reorder Quantity:</strong> How much to order when triggered</li>
                  <li>• <strong>Safety Stock:</strong> Extra buffer to prevent stockouts</li>
                  <li>• <strong>Lead Time:</strong> Days it takes to receive new stock</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Product Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className={`w-full px-4 py-2 border rounded text-left flex items-center justify-between transition-colors ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white hover:border-slate-500' : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'}`}
                >
                  <span className={formData.product_name ? (isDarkTheme ? "text-white" : "text-slate-900") : (isDarkTheme ? "text-slate-400" : "text-slate-600")}>
                    {formData.product_name || "Select Product *"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showProductDropdown && (
                  <div className={`absolute top-full mt-1 left-0 right-0 border rounded shadow-lg z-50 max-h-48 overflow-y-auto ${isDarkTheme ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className={`w-full px-3 py-2 border-b sticky top-0 ${isDarkTheme ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-600'}`}
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
                            className={`w-full text-left px-3 py-2 text-sm border-b last:border-0 ${isDarkTheme ? 'hover:bg-slate-600 text-white border-slate-600' : 'hover:bg-slate-100 text-slate-900 border-slate-300'}`}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>SKU: {product.sku}</div>
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
                  className={`w-full px-4 py-2 border rounded text-left flex items-center justify-between transition-colors ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white hover:border-slate-500' : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'}`}
                >
                  <span className={formData.warehouse_name ? (isDarkTheme ? "text-white" : "text-slate-900") : (isDarkTheme ? "text-slate-400" : "text-slate-600")}>
                    {formData.warehouse_name || "Select Warehouse (optional)"}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showWarehouseDropdown && (
                  <div className={`absolute top-full mt-1 left-0 right-0 border rounded shadow-lg z-50 max-h-48 overflow-y-auto ${isDarkTheme ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}>
                    <input
                      type="text"
                      placeholder="Search warehouses..."
                      value={warehouseSearch}
                      onChange={(e) => setWarehouseSearch(e.target.value)}
                      className={`w-full px-3 py-2 border-b sticky top-0 ${isDarkTheme ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-600'}`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, warehouse_id: "", warehouse_name: "" });
                        setShowWarehouseDropdown(false);
                        setWarehouseSearch("");
                      }}
                      className={`w-full text-left px-3 py-2 text-sm border-b ${isDarkTheme ? 'hover:bg-slate-600 text-slate-300 border-slate-600' : 'hover:bg-slate-100 text-slate-600 border-slate-300'}`}
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
                            className={`w-full text-left px-3 py-2 text-sm border-b last:border-0 ${isDarkTheme ? 'hover:bg-slate-600 text-white border-slate-600' : 'hover:bg-slate-100 text-slate-900 border-slate-300'}`}
                          >
                            <div className="font-medium">{warehouse.name}</div>
                            <div className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{warehouse.code}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Required Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    <TrendingDown className="w-4 h-4 inline mr-1" />
                    Reorder Point * <span className={`font-normal ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>(Trigger level)</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 50"
                    value={formData.reorder_point}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_point: e.target.value })
                    }
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                    required
                  />
                  <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-600'}`}>
                    Alert when stock reaches this level
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Package className="w-4 h-4 inline mr-1" />
                    Reorder Quantity * <span className={`font-normal ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>(Order amount)</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={formData.reorder_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_quantity: e.target.value })
                    }
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                    required
                  />
                  <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-600'}`}>
                    How many units to order
                  </p>
                </div>
              </div>

              {/* Optional Fields */}
              <div className={`border-t pt-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                <p className={`text-sm font-medium mb-3 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Optional Settings
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Minimum Quantity
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.minimum_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, minimum_quantity: e.target.value })
                      }
                      className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                    />
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-600'}`}>
                      Absolute minimum
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Shield className="w-4 h-4 inline mr-1" />
                      Safety Stock
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.safety_stock}
                      onChange={(e) =>
                        setFormData({ ...formData, safety_stock: e.target.value })
                      }
                      className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                    />
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-600'}`}>
                      Extra buffer stock
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Clock className="w-4 h-4 inline mr-1" />
                      Lead Time (days)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.lead_time_days}
                      onChange={(e) =>
                        setFormData({ ...formData, lead_time_days: e.target.value })
                      }
                      className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                    />
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-500' : 'text-slate-600'}`}>
                      Delivery time
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                className={`flex-1 ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
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
        <div className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          <p>No reorder rules found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const product = products.find(p => p._id === rule.product_id);
            const currentStock = product?.stock || 0;
            const needsReorder = currentStock <= rule.reorder_point;
            const criticalStock = currentStock <= rule.minimum_quantity;
            const stockPercentage = rule.reorder_point > 0 ? Math.min((currentStock / rule.reorder_point) * 100, 100) : 100;

            return (
              <div
                key={rule._id}
                className={`border rounded-lg overflow-hidden transition-all hover:shadow-lg ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-white border-slate-300 hover:border-slate-400'}`}
              >
                {/* Header */}
                <div className={`p-4 border-b ${isDarkTheme ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold text-lg ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {product?.name || rule.product_id}
                        </h4>
                        {!rule.is_active && (
                          <span className="text-xs bg-slate-600 text-white px-2 py-1 rounded-full font-medium">
                            INACTIVE
                          </span>
                        )}
                        {needsReorder && rule.is_active && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${criticalStock ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                            {criticalStock ? '🚨 CRITICAL' : '⚠️ REORDER NOW'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                          SKU: {product?.sku || 'N/A'}
                        </span>
                        {rule.warehouse_id && (
                          <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                            📦 {warehouses.find(w => w._id === rule.warehouse_id)?.name || 'Unknown'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                        title="Edit rule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Current Stock Status */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        Current Stock Level
                      </span>
                      <span className={`text-lg font-bold ${criticalStock ? 'text-red-400' : needsReorder ? 'text-yellow-400' : 'text-green-400'}`}>
                        {currentStock} units
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className={`w-full rounded-full h-3 ${isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'}`}>
                      <div
                        className={`h-3 rounded-full transition-all ${criticalStock ? 'bg-red-500' : needsReorder ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${stockPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={isDarkTheme ? 'text-slate-500' : 'text-slate-600'}>Min: {rule.minimum_quantity}</span>
                      <span className={isDarkTheme ? 'text-slate-500' : 'text-slate-600'}>Reorder: {rule.reorder_point}</span>
                    </div>
                  </div>

                  {/* Rule Details Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-slate-600/30' : 'bg-slate-100'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className={`w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Reorder Point</span>
                      </div>
                      <p className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {rule.reorder_point}
                      </p>
                    </div>

                    <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-slate-600/30' : 'bg-slate-100'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className={`w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Order Qty</span>
                      </div>
                      <p className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {rule.reorder_quantity}
                      </p>
                    </div>

                    {rule.safety_stock && rule.safety_stock > 0 && (
                      <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className={`text-xs font-medium ${isDarkTheme ? 'text-green-300' : 'text-green-700'}`}>Safety Stock</span>
                        </div>
                        <p className="text-xl font-bold text-green-400">
                          {rule.safety_stock}
                        </p>
                      </div>
                    )}

                    {rule.lead_time_days && rule.lead_time_days > 0 && (
                      <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className={`text-xs font-medium ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>Lead Time</span>
                        </div>
                        <p className="text-xl font-bold text-blue-400">
                          {rule.lead_time_days}d
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Recommendation */}
                  {needsReorder && rule.is_active && (
                    <div className={`mt-4 rounded-lg p-3 ${criticalStock ? (isDarkTheme ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200') : (isDarkTheme ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200')}`}>
                      <p className={`text-sm font-medium ${criticalStock ? 'text-red-400' : 'text-yellow-400'}`}>
                        💡 Recommended Action: Order {rule.reorder_quantity} units to replenish stock
                        {rule.lead_time_days && ` (${rule.lead_time_days} day delivery)`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
