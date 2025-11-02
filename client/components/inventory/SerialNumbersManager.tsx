import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader, Barcode, AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { SerialNumber, Product, Warehouse, LotNumber } from "@shared/api";

interface SerialNumbersManagerProps {
  isDarkTheme?: boolean;
  onClose: () => void;
}

export default function SerialNumbersManager({ isDarkTheme = true, onClose }: SerialNumbersManagerProps) {
  const { addToast } = useToast();
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [lotNumbers, setLotNumbers] = useState<LotNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    serial_number: "",
    product_id: "",
    warehouse_id: "",
    lot_id: "",
    status: "available" as "available" | "sold" | "returned" | "defective",
    notes: "",
  });
  const [bulkData, setBulkData] = useState({
    serial_numbers: [] as string[],
    product_id: "",
    warehouse_id: "",
    lot_id: "",
  });
  const [scannerInput, setScannerInput] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSerialNumbers(),
        fetchProducts(),
        fetchWarehouses(),
        fetchLotNumbers(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSerialNumbers = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/serial-numbers");
          setSerialNumbers(data);
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
      console.error("Error fetching serial numbers:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serial_number || !formData.product_id || !formData.warehouse_id) {
      addToast("Serial number, product, and warehouse are required", "warning");
      return;
    }

    try {
      const payload = {
        ...formData,
      };

      if (editingId) {
        await put(`/api/inventory/serial-numbers/${editingId}`, payload);
        addToast("Serial number updated successfully", "success");
      } else {
        await post("/api/inventory/serial-numbers", payload);
        addToast("Serial number created successfully", "success");
      }
      resetForm();
      await fetchSerialNumbers();
    } catch (error) {
      console.error("Error saving serial number:", error);
      addToast("Failed to save serial number", "error");
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkData.serial_numbers.length === 0 || !bulkData.product_id || !bulkData.warehouse_id) {
      addToast("Serial numbers, product, and warehouse are required", "warning");
      return;
    }

    try {
      const payload = {
        serials: bulkData.serial_numbers.map((serial_number) => ({
          serial_number,
          product_id: bulkData.product_id,
          warehouse_id: bulkData.warehouse_id,
          lot_id: bulkData.lot_id || undefined,
          status: "available",
        })),
      };

      await post("/api/inventory/serial-numbers/bulk", payload);
      setBulkData({
        serial_numbers: [],
        product_id: "",
        warehouse_id: "",
        lot_id: "",
      });
      setScannerInput("");
      setShowBulkForm(false);
      await fetchSerialNumbers();
      addToast(`Successfully created ${bulkData.serial_numbers.length} serial numbers`, "success");
    } catch (error) {
      console.error("Error creating serial numbers:", error);
      addToast("Failed to create serial numbers", "error");
    }
  };

  const handleEdit = (serial: SerialNumber) => {
    setFormData({
      serial_number: serial.serial_number,
      product_id: serial.product_id,
      warehouse_id: serial.warehouse_id,
      lot_id: serial.lot_id || "",
      status: serial.status,
      notes: serial.notes || "",
    });
    setEditingId(serial._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this serial number?")) {
      try {
        await deleteRequest(`/api/inventory/serial-numbers/${id}`);
        addToast("Serial number deleted successfully", "success");
        await fetchSerialNumbers();
      } catch (error) {
        console.error("Error deleting serial number:", error);
        addToast("Failed to delete serial number", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      serial_number: "",
      product_id: "",
      warehouse_id: "",
      lot_id: "",
      status: "available",
      notes: "",
    });
    setEditingId(null);
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

  const getLotNumberTitle = (lotId: string) => {
    const lot = lotNumbers.find((l) => l._id === lotId);
    return lot ? (lot.title ? `${lot.title} (${lot.lot_number})` : lot.lot_number) : lotId;
  };

  const getSelectedProduct = () => {
    return products.find((p) => p._id === bulkData.product_id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-600";
      case "sold":
        return "bg-blue-600";
      case "returned":
        return "bg-yellow-600";
      case "defective":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const filteredSerialNumbers =
    filterStatus === "all"
      ? serialNumbers
      : serialNumbers.filter((s) => s.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          <Barcode className="w-6 h-6" />
          Serial Numbers Management
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowBulkForm(!showBulkForm)}
            className="bg-purple-500 hover:bg-purple-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Bulk Add
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Serial
          </Button>
        </div>
      </div>

      {/* Single Serial Form */}
      {showForm && (
        <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
          <h4 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            {editingId ? "Edit Serial Number" : "Add New Serial Number"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                placeholder="Serial Number"
                value={formData.serial_number}
                onChange={(e) =>
                  setFormData({ ...formData, serial_number: e.target.value })
                }
                className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
              />
              <select
                value={formData.product_id}
                onChange={(e) =>
                  setFormData({ ...formData, product_id: e.target.value })
                }
                className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse_id: e.target.value })
                }
                className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
              <select
                value={formData.lot_id}
                onChange={(e) =>
                  setFormData({ ...formData, lot_id: e.target.value })
                }
                className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="">Select Lot (Optional)</option>
                {lotNumbers.map((lot) => (
                  <option key={lot._id} value={lot._id}>
                    {getLotNumberTitle(lot._id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="returned">Returned</option>
                <option value="defective">Defective</option>
              </select>
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
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {editingId ? "Update" : "Create"} Serial
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

      {/* Bulk Serial Form */}
      {showBulkForm && (
        <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
          <h4 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Bulk Add Serial Numbers</h4>
          <form onSubmit={handleBulkSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={bulkData.product_id}
                onChange={(e) =>
                  setBulkData({ ...bulkData, product_id: e.target.value })
                }
                className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
              <select
                value={bulkData.warehouse_id}
                onChange={(e) =>
                  setBulkData({ ...bulkData, warehouse_id: e.target.value })
                }
                className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Display */}
            {bulkData.product_id && (
              <div className={`border rounded p-3 ${isDarkTheme ? 'bg-slate-800 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Product Stock</p>
                    <p className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{getSelectedProduct()?.stock || 0} units</p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Existing Serials</p>
                    <p className="text-lg font-bold text-green-400">
                      {serialNumbers.filter((s) => s.product_id === bulkData.product_id).length}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Adding Now</p>
                    <p className="text-lg font-bold text-blue-400">{bulkData.serial_numbers.length}</p>
                  </div>
                </div>
                {bulkData.serial_numbers.length > getSelectedProduct()?.stock! && (
                  <div className={`mt-2 p-2 border rounded text-xs flex items-center gap-2 ${isDarkTheme ? 'bg-red-900/30 border-red-600 text-red-300' : 'bg-red-100 border-red-300 text-red-700'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    Serials exceed stock! Max: {getSelectedProduct()?.stock}
                  </div>
                )}
              </div>
            )}

            <select
              value={bulkData.lot_id}
              onChange={(e) =>
                setBulkData({ ...bulkData, lot_id: e.target.value })
              }
              className={`border rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-full ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
            >
              <option value="">Select Lot (Optional)</option>
              {lotNumbers.map((lot) => (
                <option key={lot._id} value={lot._id}>
                  {getLotNumberTitle(lot._id)}
                </option>
              ))}
            </select>
            {/* Barcode Scanner Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Scan Serial Numbers (Barcode Scanner)
              </label>
              <input
                type="text"
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // Prevent form submission
                    const serial = scannerInput.trim();
                    if (!serial) return;
                    
                    const selectedProduct = getSelectedProduct();
                    if (!selectedProduct) {
                      alert("Please select a product first");
                      return;
                    }
                    
                    if (bulkData.serial_numbers.length >= selectedProduct.stock) {
                      alert(`Cannot add more serials. Product stock is ${selectedProduct.stock}`);
                      return;
                    }
                    
                    if (bulkData.serial_numbers.includes(serial)) {
                      alert("This serial number already exists in the list");
                      return;
                    }
                    
                    setBulkData({
                      ...bulkData,
                      serial_numbers: [...bulkData.serial_numbers, serial],
                    });
                    setScannerInput("");
                  }
                }}
                placeholder="Scan barcode or enter serial number and press Enter"
                className={`border rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                autoFocus
              />
              <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Press Enter after each scan to add to list
              </p>
            </div>

            {/* Scanned Serials List */}
            {bulkData.serial_numbers.length > 0 && (
              <div>
                <label className={`block text-xs font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Scanned Serials ({bulkData.serial_numbers.length})
                </label>
                <div className={`border rounded p-3 max-h-32 overflow-y-auto space-y-1 ${isDarkTheme ? 'bg-slate-800 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                  {bulkData.serial_numbers.map((serial, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-2 py-1 rounded text-sm ${isDarkTheme ? 'bg-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                    >
                      <span className="font-mono">{serial}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkData({
                            ...bulkData,
                            serial_numbers: bulkData.serial_numbers.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Create Serials
              </Button>
              <Button
                type="button"
                onClick={() => setShowBulkForm(false)}
                className={`flex-1 ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
              >
                Cancel
              </Button>
            </div>
          </form>
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
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="returned">Returned</option>
          <option value="defective">Defective</option>
        </select>
        <span className={`text-sm py-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          {filteredSerialNumbers.length} serial numbers
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filteredSerialNumbers.length === 0 ? (
        <div className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
          <p>No serial numbers found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSerialNumbers.map((serial) => (
            <div
              key={serial._id}
              className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold font-mono ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{serial.serial_number}</h4>
                  <span className={`text-xs text-white px-2 py-1 rounded ${getStatusColor(serial.status)}`}>
                    {serial.status.toUpperCase()}
                  </span>
                </div>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-700'}`}>
                  Product: {getProductName(serial.product_id)} • Warehouse: {getWarehouseName(serial.warehouse_id)}
                </p>
                {serial.lot_id && (
                  <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-700'}`}>
                    Lot: {getLotNumberTitle(serial.lot_id)}
                  </p>
                )}
                {serial.notes && (
                  <p className={`text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-700'}`}>
                    Notes: {serial.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(serial.serial_number);
                    alert("Serial number copied to clipboard");
                  }}
                  className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-300 hover:bg-slate-400 text-slate-900'}`}
                  title="Copy serial number"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(serial)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(serial._id)}
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
