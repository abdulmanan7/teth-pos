import { X, Plus, Trash2, ShoppingCart, Package, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import { formatCurrencyNew } from "@/utils";

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
}

interface Warehouse {
  _id: string;
  name: string;
  code: string;
}

interface MarketPurchaseItem {
  product_id: string;
  quantity: number;
  cost_per_unit: number;
  expiry_date?: string;
  manufacture_date?: string;
  notes?: string;
}

interface MarketPurchase {
  _id: string;
  purchase_number: string;
  warehouse_id: string;
  items: MarketPurchaseItem[];
  total_amount: number;
  purchase_date: string;
  purchased_by?: string;
  supplier_name?: string;
  notes?: string;
  created_at: string;
  inventory_added?: boolean;
}

interface DirectMarketPurchaseManagerProps {
  isDarkTheme?: boolean;
}

export default function DirectMarketPurchaseManager({ isDarkTheme = true }: DirectMarketPurchaseManagerProps) {
  const { addToast } = useToast();
  const [purchases, setPurchases] = useState<MarketPurchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<"created_at" | "total_amount" | "supplier_name" | "purchase_number">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    warehouse_id: "",
    supplier_name: "",
    purchased_by: "",
    items: [{ product_id: "", quantity: 1, cost_per_unit: 0, expiry_date: "", manufacture_date: "", notes: "", serial_numbers: [] }],
    notes: "",
  });
  const { get, post, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, [currentPage, sortField, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesData, productsData, warehousesData] = await Promise.all([
        get(`/api/market-purchases?page=${currentPage}&limit=10&sort=${sortField}&order=${sortOrder}`),
        get("/api/products"),
        get("/api/inventory/warehouses"),
      ]);
      
      // Handle new response format with pagination
      if (purchasesData?.data) {
        setPurchases(purchasesData.data || []);
        setTotalPages(purchasesData.pagination?.total_pages || 1);
      } else {
        // Fallback for old format
        setPurchases(purchasesData || []);
      }
      
      setProducts(productsData || []);
      setWarehouses(warehousesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      addToast("Failed to fetch market purchase data", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      warehouse_id: "",
      supplier_name: "",
      purchased_by: "",
      items: [{ product_id: "", quantity: 1, cost_per_unit: 0, expiry_date: "", manufacture_date: "", notes: "", serial_numbers: [] }],
      notes: "",
    });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: "", quantity: 1, cost_per_unit: 0, expiry_date: "", manufacture_date: "", notes: "", serial_numbers: [] }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouse_id || formData.items.length === 0) {
      addToast("Please select a warehouse and add items", "warning");
      return;
    }

    if (formData.items.some(item => !item.product_id || item.quantity <= 0 || item.cost_per_unit <= 0)) {
      addToast("Please fill in all item details (product, quantity, cost)", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        warehouse_id: formData.warehouse_id,
        supplier_name: formData.supplier_name || "Open Market",
        purchased_by: formData.purchased_by || "system",
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          cost_per_unit: item.cost_per_unit,
          expiry_date: item.expiry_date || undefined,
          manufacture_date: item.manufacture_date || undefined,
          notes: item.notes || undefined,
        })),
        notes: formData.notes,
      };

      await post("/api/market-purchases", payload);
      addToast("Market purchase recorded successfully! Batches created.", "success");
      resetForm();
      setShowForm(false);
      await fetchData();
    } catch (error: any) {
      console.error("Error saving purchase:", error);
      addToast(error.message || "Failed to save market purchase", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (confirm("Are you sure you want to delete this market purchase?")) {
      try {
        await deleteRequest(`/api/market-purchases/${id}`);
        addToast("Market purchase deleted successfully!", "success");
        await fetchData();
      } catch (error) {
        console.error("Error deleting purchase:", error);
        addToast("Failed to delete market purchase", "error");
      }
    }
  };

  const handleAddToInventory = async (id: string) => {
    try {
      setSubmitting(true);
      const response = await post(`/api/market-purchases/${id}/add-to-inventory`, {});
      addToast("Purchase added to inventory successfully!", "success");
      await fetchData();
    } catch (error: any) {
      console.error("Error adding purchase to inventory:", error);
      addToast(error.message || "Failed to add purchase to inventory", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getProductName = (productId: string) => {
    return products.find(p => p._id === productId)?.name || "Unknown";
  };

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find(w => w._id === warehouseId)?.name || "Unknown";
  };

  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchTerm.toLowerCase();
    return (
      purchase.purchase_number.toLowerCase().includes(searchLower) ||
      (purchase.supplier_name?.toLowerCase().includes(searchLower) || false) ||
      getWarehouseName(purchase.warehouse_id).toLowerCase().includes(searchLower) ||
      purchase.total_amount.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Loading market purchases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className={`w-6 h-6 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Direct Market Purchases</h2>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Purchase
        </Button>
      </div>

      {/* Info Box */}
      <div className={`border-l-4 p-4 rounded ${isDarkTheme ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-500'}`}>
        <div className="flex gap-3">
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <p className={`font-medium ${isDarkTheme ? 'text-blue-300' : 'text-blue-900'}`}>Quick Market Purchases</p>
            <p className={`text-sm ${isDarkTheme ? 'text-blue-200/70' : 'text-blue-800/70'}`}>
              Record items purchased directly from the market. Stock is updated immediately and accounting entries are created automatically (DEBIT: Inventory, CREDIT: Cash).
            </p>
          </div>
        </div>
      </div>

      {/* Search Field */}
      <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
        <Input
          type="text"
          placeholder="Search by purchase number, supplier, warehouse, or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`}
        />
        {searchTerm && (
          <p className={`text-xs mt-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Found {filteredPurchases.length} of {purchases.length} purchases
          </p>
        )}
      </div>

      {/* Purchases List */}
      <div className="grid gap-4">
        {purchases.length === 0 ? (
          <div className={`text-center py-8 rounded-lg border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
            <ShoppingCart className={`w-12 h-12 mx-auto mb-2 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>No market purchases yet. Record one to get started!</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className={`text-center py-8 rounded-lg border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
            <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>No purchases match your search.</p>
          </div>
        ) : (
          filteredPurchases.map((purchase) => (
            <div
              key={purchase._id}
              className={`border rounded-lg overflow-hidden transition-all ${isDarkTheme ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-300 hover:border-slate-400'}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {purchase.purchase_number}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${isDarkTheme ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                        ✓ RECORDED
                      </span>
                      {purchase.inventory_added ? (
                        <span className={`text-xs px-2 py-1 rounded font-medium ${isDarkTheme ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                          ✓ IN INVENTORY
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded font-medium ${isDarkTheme ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                          ⏳ PENDING
                        </span>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <ShoppingCart className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>Supplier</p>
                          <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {purchase.supplier_name || "Market"}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Package className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>Warehouse</p>
                          <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {getWarehouseName(purchase.warehouse_id)}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <div>
                          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>Total</p>
                          <p className={`text-sm font-bold ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                            {formatCurrencyNew(purchase.total_amount)}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`}>Date</p>
                          <p className={`text-sm ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className={`p-3 rounded ${isDarkTheme ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                      <p className={`text-xs font-semibold mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        Items ({purchase.items.length})
                      </p>
                      <div className="space-y-1">
                        {purchase.items.map((item, idx) => (
                          <div key={idx} className={`text-sm flex justify-between ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>{getProductName(item.product_id)}</span>
                            <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                              {item.quantity} × {formatCurrencyNew(item.cost_per_unit)}
                              {item.expiry_date && (
                                <span className={`ml-2 text-xs ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                  (Exp: {new Date(item.expiry_date).toLocaleDateString()})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!purchase.inventory_added ? (
                      <button
                        onClick={() => handleAddToInventory(purchase._id)}
                        disabled={submitting}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${isDarkTheme ? 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50' : 'bg-green-100 hover:bg-green-200 text-green-900 disabled:opacity-50'}`}
                        title="Add to Inventory"
                      >
                        {submitting ? "Adding..." : "Add to Inventory"}
                      </button>
                    ) : null}
                    {!purchase.inventory_added && (
                      <button
                        onClick={() => handleDeletePurchase(purchase._id)}
                        disabled={submitting}
                        className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50' : 'bg-red-100 hover:bg-red-200 text-red-900 disabled:opacity-50'}`}
                        title="Delete Purchase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filteredPurchases.length > 0 && totalPages > 1 && (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
          <div className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white border border-slate-300 hover:bg-slate-100'}`}
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white border border-slate-300 hover:bg-slate-100'}`}
            >
              Next →
            </button>
          </div>
          <div className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Sort: {sortField} ({sortOrder})
          </div>
        </div>
      )}

      {/* Create Purchase Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
              <h3 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Record Market Purchase</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-4">
              {/* Warehouse Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Warehouse *
                </label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className={`w-full rounded px-3 py-2 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Supplier Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Market A, Local Vendor, Farmer"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                />
              </div>

              {/* Purchased By */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Purchased By
                </label>
                <Input
                  type="text"
                  placeholder="Your name or staff ID"
                  value={formData.purchased_by}
                  onChange={(e) => setFormData({ ...formData, purchased_by: e.target.value })}
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                />
              </div>

              {/* Items Section */}
              <div className={`border-t pt-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Items *</h4>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className={`p-3 rounded space-y-2 ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Product</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                            className={`w-full rounded px-2 py-2 text-sm ${isDarkTheme ? 'bg-slate-600 border border-slate-500 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} {product.sku ? `(${product.sku})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Qty</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                            className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Cost/Unit</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cost_per_unit}
                            onChange={(e) => handleItemChange(index, "cost_per_unit", parseFloat(e.target.value))}
                            className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Expiry Date (Optional)</label>
                          <Input
                            type="date"
                            value={item.expiry_date}
                            onChange={(e) => handleItemChange(index, "expiry_date", e.target.value)}
                            className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Manufacture Date (Optional)</label>
                          <Input
                            type="date"
                            value={item.manufacture_date}
                            onChange={(e) => handleItemChange(index, "manufacture_date", e.target.value)}
                            className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                          />
                        </div>
                      </div>

                      {/* Serial Numbers (Optional) */}
                      <div>
                        <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          Serial Numbers (Optional - max {item.quantity})
                        </label>
                        <textarea
                          placeholder={`Comma-separated serials (e.g., SN-001, SN-002, SN-003). Barcode scanner will auto-add commas. Max ${item.quantity} serials.`}
                          value={item.serial_numbers?.join(", ") || ""}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const serials = inputValue
                              .split(",")
                              .map(s => s.trim())
                              .filter(s => s)
                              .slice(0, item.quantity); // Limit to quantity
                            handleItemChange(index, "serial_numbers", serials);
                          }}
                          onKeyDown={(e) => {
                            // Auto-add comma on barcode scanner (Enter key without Shift)
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              const textarea = e.target as HTMLTextAreaElement;
                              const currentValue = textarea.value.trim();
                              
                              // If value doesn't end with comma, add one
                              if (currentValue && !currentValue.endsWith(",")) {
                                textarea.value = currentValue + ", ";
                                // Trigger onChange to update state
                                const event = new Event('change', { bubbles: true });
                                textarea.dispatchEvent(event);
                              }
                            }
                          }}
                          rows={2}
                          className={`w-full rounded px-2 py-2 text-xs ${isDarkTheme ? 'bg-slate-600 border border-slate-500 text-white placeholder-slate-400' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-500'}`}
                        />
                        {item.serial_numbers && item.serial_numbers.length > 0 && (
                          <p className={`text-xs mt-1 ${isDarkTheme ? 'text-green-300' : 'text-green-600'}`}>
                            ✓ {item.serial_numbers.length}/{item.quantity} serial(s) added
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          Line Total: {formatCurrencyNew((item.quantity * item.cost_per_unit))}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className={`p-1 rounded transition-colors ${isDarkTheme ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-900'}`}
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`mt-3 p-3 rounded ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Total Amount:</span>
                    <span className="text-lg font-bold text-green-400">{formatCurrencyNew(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full rounded px-3 py-2 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-500'}`}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 disabled:opacity-50 ${isDarkTheme ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  {submitting ? "Recording..." : "Record Purchase"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
