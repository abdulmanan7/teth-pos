import { X, Search, Plus, Loader, Edit2, Trash2, Barcode, Copy, CheckCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { Product } from "@shared/api";

export default function ProductsModal({ isDarkTheme, onClose, onProductsUpdated }: { isDarkTheme: boolean; onClose: () => void; onProductsUpdated?: (products: Product[]) => void }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "1",
    category: "",
    description: "",
    unit: "piece" as 'piece' | 'kg' | 'liter' | 'meter' | 'box' | 'pack' | 'dozen' | 'gram' | 'ml' | 'cm' | 'custom',
    unit_custom: "",
    warehouse_id: "",
    status: "active" as 'active' | 'inactive' | 'discontinued',
  });
  const [submitting, setSubmitting] = useState(false);
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await get("/api/products");
      setProducts(data);
      // Extract unique categories from products
      const uniqueCategories = [...new Set(data.map((p: Product) => p.category))].filter(Boolean) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await get("/api/inventory/warehouses");
      setWarehouses(data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      addToast("Please enter a category name", "warning");
      return;
    }
    if (categories.includes(newCategory)) {
      addToast("This category already exists", "warning");
      return;
    }
    setCategories([...categories, newCategory]);
    setNewCategory("");
    addToast("Category added successfully!", "success");
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    // Check if category is used by any products
    const productsInCategory = products.filter(p => p.category === categoryToDelete);
    if (productsInCategory.length > 0) {
      addToast(`Cannot delete "${categoryToDelete}" - it has ${productsInCategory.length} product(s). Please reassign them first.`, "error");
      return;
    }
    setCategories(categories.filter(c => c !== categoryToDelete));
    addToast("Category deleted successfully!", "success");
  };

  const filtered = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      quantity: "1",
      category: "",
      description: "",
      unit: "piece",
      unit_custom: "",
      warehouse_id: "",
      status: "active",
    });
    setEditingId(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.quantity) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        category: formData.category || "Uncategorized",
        description: formData.description,
        unit: formData.unit,
        unit_custom: formData.unit_custom,
        warehouse_id: formData.warehouse_id,
        status: formData.status,
      };

      if (editingId) {
        const updatedProduct = await put(`/api/products/${editingId}`, payload);
        // Update product in state instead of full refresh
        const updatedProducts = products.map(p => p._id === editingId ? updatedProduct : p);
        setProducts(updatedProducts);
        // Notify parent component about the update
        onProductsUpdated?.(updatedProducts);
        addToast("Product updated successfully!", "success");
      } else {
        const newProduct = await post("/api/products", payload);
        // Add new product to state instead of full refresh
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        // Notify parent component about the update
        onProductsUpdated?.(updatedProducts);
        addToast("Product added successfully!", "success");
      }

      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error saving product:", error);
      addToast("Failed to save product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      quantity: (product.quantity || 1).toString(),
      category: product.category,
      description: product.description || "",
      unit: product.unit || "piece",
      unit_custom: product.unit_custom || "",
      warehouse_id: product.warehouse_id || "",
      status: product.status || "active",
    });
    setEditingId(product._id);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteRequest(`/api/products/${id}`);
        // Remove product from state instead of full refresh
        const updatedProducts = products.filter(p => p._id !== id);
        setProducts(updatedProducts);
        // Notify parent component about the update
        onProductsUpdated?.(updatedProducts);
        addToast("Product deleted successfully!", "success");
      } catch (error) {
        addToast("Failed to delete product", "error");
      }
    }
  };

  const handleCopyBarcode = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedBarcode(sku);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Products</h2>
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-blue-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No products found</p>
                </div>
              ) : (
                filtered.map((product) => (
                  <div
                    key={product._id}
                    className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white truncate">{product.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            product.status === 'active' ? 'bg-green-900/30 text-green-400' :
                            product.status === 'inactive' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            {product.status || 'active'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-2">
                          <div>SKU: <span className="text-white font-mono">{product.sku}</span></div>
                          <div>Unit: <span className="text-white">{product.unit_custom || product.unit || 'piece'}</span></div>
                          <div>Qty/Unit: <span className="text-white font-semibold">{product.quantity} {product.unit_custom || product.unit || 'piece'}</span></div>
                          <div>Category: <span className="text-white">{product.category}</span></div>
                          <div>Stock: <span className={`text-white font-semibold ${product.stock < (product.reorder_point || 10) ? 'text-red-400' : 'text-green-400'}`}>{product.stock} {product.unit_custom || product.unit || 'piece'}</span></div>
                          <div>Status: <span className={`text-white font-semibold ${product.status === 'active' ? 'text-green-400' : product.status === 'inactive' ? 'text-yellow-400' : 'text-red-400'}`}>{product.status || 'active'}</span></div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col gap-2">
                        <div>
                          <p className="text-lg font-bold text-blue-400">Rs {product.price.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">Price</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopyBarcode(product.sku)}
                            className={`p-2 rounded transition-colors ${
                              copiedBarcode === product.sku
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-600 hover:bg-slate-700 text-slate-300'
                            }`}
                            title="Copy SKU"
                          >
                            {copiedBarcode === product.sku ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDetail(true);
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="View details"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          <Button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">Product Details</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Name</p>
                <p className="text-white font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-slate-400">SKU</p>
                <p className="text-white font-mono">{selectedProduct.sku}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Price</p>
                  <p className="text-white font-semibold">Rs {selectedProduct.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Quantity per Unit</p>
                  <p className="text-white font-semibold">{selectedProduct.quantity} {selectedProduct.unit_custom || selectedProduct.unit || 'piece'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Unit Type</p>
                  <p className="text-white">{selectedProduct.unit_custom || selectedProduct.unit || 'piece'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Category</p>
                  <p className="text-white">{selectedProduct.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Current Stock</p>
                  <p className={`text-white font-semibold ${selectedProduct.stock < (selectedProduct.reorder_point || 10) ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedProduct.stock} {selectedProduct.unit_custom || selectedProduct.unit || 'piece'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Reorder Point</p>
                  <p className="text-white">{selectedProduct.reorder_point || 10}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Safety Stock</p>
                  <p className="text-white">{selectedProduct.safety_stock || 5}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className={`text-white capitalize font-semibold ${selectedProduct.status === 'active' ? 'text-green-400' : selectedProduct.status === 'inactive' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {selectedProduct.status || 'active'}
                  </p>
                </div>
              </div>
              {selectedProduct.lead_time_days && (
                <div>
                  <p className="text-slate-400">Lead Time</p>
                  <p className="text-white">{selectedProduct.lead_time_days} days</p>
                </div>
              )}
            </div>
            <div className="border-t border-slate-700 p-6">
              <Button
                onClick={() => setShowDetail(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Premium Coffee"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price *
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Quantity per Unit *
                  </label>
                  <Input
                    type="number"
                    placeholder="1"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
                      title="Manage categories"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Unit of Measurement
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value as any })
                    }
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                  >
                    <option value="piece">Piece (countable)</option>
                    <option value="kg">Kilogram (weight)</option>
                    <option value="gram">Gram (weight)</option>
                    <option value="liter">Liter (liquid)</option>
                    <option value="ml">Milliliter (liquid)</option>
                    <option value="meter">Meter (length)</option>
                    <option value="cm">Centimeter (length)</option>
                    <option value="box">Box (package)</option>
                    <option value="pack">Pack (package)</option>
                    <option value="dozen">Dozen (12 units)</option>
                    <option value="custom">Custom Unit</option>
                  </select>
                </div>
              </div>

              {formData.unit === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Unit Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., bottle, jar, roll"
                    value={formData.unit_custom}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_custom: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Product description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              {/* Inventory Section */}
              <div className="border-t border-slate-600 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-white mb-3">Inventory Settings</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'discontinued' })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Warehouse
                    </label>
                    <select
                      value={formData.warehouse_id}
                      onChange={(e) =>
                        setFormData({ ...formData, warehouse_id: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select warehouse</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse._id} value={warehouse._id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                >
                  {submitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Product" : "Add Product")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h3 className="text-xl font-bold text-white">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add New Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., Electronics"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={handleAddCategory}
                    className="bg-green-600 hover:bg-green-700 text-white px-4"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Categories List */}
              <div className="border-t border-slate-600 pt-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Current Categories ({categories.length})
                </h4>
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No categories yet. Add one above!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const productCount = products.filter(
                        (p) => p.category === category
                      ).length;
                      return (
                        <div
                          key={category}
                          className="flex items-center justify-between p-3 bg-slate-700/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {category}
                            </p>
                            <p className="text-xs text-slate-400">
                              {productCount} product{productCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="ml-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-700 p-6">
              <Button
                onClick={() => setShowCategoryModal(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
