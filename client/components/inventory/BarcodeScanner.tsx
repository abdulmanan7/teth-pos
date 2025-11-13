import { useState, useRef, useEffect } from "react";
import {
  Barcode,
  Search,
  Plus,
  Trash2,
  Loader,
  Eye,
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElectronApi } from "@/hooks/useElectronApi";
import { showNotification } from "@/utils";
import type { BarcodeMapping, BarcodeResult, Product } from "@shared/api";

interface BarcodeScannerProps {
  isDarkTheme?: boolean;
  onClose: () => void;
}

export default function BarcodeScanner({ isDarkTheme = true, onClose }: BarcodeScannerProps) {
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<BarcodeResult | null>(null);
  const [barcodes, setBarcodes] = useState<BarcodeMapping[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeMapping | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"scan" | "manage" | "stats">("scan");
  const [newBarcode, setNewBarcode] = useState({
    barcode: "",
    barcode_type: "sku" as const,
    product_id: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const { post, get, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
    // Focus on scan input when component mounts
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Focus on scan input when tab changes to scan
    if (activeTab === "scan" && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBarcodes(),
        fetchProducts(),
        fetchStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarcodes = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/barcodes");
          setBarcodes(data);
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
      console.error("Error fetching barcodes:", error);
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

  const fetchStats = async () => {
    try {
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const data = await get("/api/inventory/barcodes/stats");
          setStats(data);
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
      console.error("Error fetching stats:", error);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    try {
      setLoading(true);
      const result = await post("/api/inventory/barcodes/scan", {
        barcode: scanInput.trim(),
      });
      setScanResult(result);
      setScanInput("");
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
      setScanResult({
        barcode: scanInput,
        found: false,
        barcode_type: "unknown",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarcode.barcode || !newBarcode.product_id) {
      showNotification.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await post("/api/inventory/barcodes", newBarcode);
      showNotification.success("Barcode created successfully");
      setNewBarcode({ barcode: "", barcode_type: "sku", product_id: "" });
      await fetchBarcodes();
    } catch (error) {
      console.error("Error creating barcode:", error);
      showNotification.error("Failed to create barcode");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBarcode = async (id: string) => {
    if (confirm("Delete this barcode mapping?")) {
      try {
        await deleteRequest(`/api/inventory/barcodes/${id}`);
        showNotification.success("Barcode deleted");
        await fetchBarcodes();
      } catch (error) {
        console.error("Error deleting barcode:", error);
        showNotification.error("Failed to delete barcode");
      }
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      await fetchBarcodes();
      return;
    }

    try {
      setLoading(true);
      const results = await get(`/api/inventory/barcodes/search?query=${query}`);
      setBarcodes(results);
    } catch (error) {
      console.error("Error searching barcodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sku":
        return "bg-blue-600";
      case "lot":
        return "bg-green-600";
      case "serial":
        return "bg-purple-600";
      case "custom":
        return "bg-yellow-600";
      default:
        return "bg-slate-600";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
          <Barcode className="w-6 h-6" />
          Barcode Scanner
        </h3>
        <Button
          onClick={fetchData}
          className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-600">
        <button
          onClick={() => setActiveTab("scan")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "scan"
              ? "text-blue-400 border-b-2 border-blue-400"
              : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Barcode className="w-4 h-4 inline mr-2" />
          Scan
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "manage"
              ? "text-blue-400 border-b-2 border-blue-400"
              : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Manage
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "stats"
              ? "text-blue-400 border-b-2 border-blue-400"
              : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Stats
        </button>
      </div>

      {/* Scan Tab */}
      {activeTab === "scan" && (
        <div className="space-y-4">
          <form onSubmit={handleScan} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Scan Barcode
              </label>
              <input
                ref={scanInputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan barcode or enter manually..."
                className={`w-full rounded px-4 py-2 focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Barcode className="w-4 h-4" />}
              Scan
            </Button>
          </form>

          {/* Scan Result */}
          {scanResult && (
            <div
              className={`border rounded-lg p-4 ${
                scanResult.found
                  ? "bg-green-900/20 border-green-600"
                  : "bg-red-900/20 border-red-600"
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.found ? (
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {scanResult.found ? "Product Found" : "Not Found"}
                  </p>
                  <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    Barcode: <span className="font-mono">{scanResult.barcode}</span>
                  </p>
                  {scanResult.product && (
                    <>
                      <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        Product: <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{scanResult.product.name}</span>
                      </p>
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        Stock: <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{scanResult.product.stock} units</span>
                      </p>
                    </>
                  )}
                  {scanResult.lot && (
                    <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Lot: <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{scanResult.lot.lot_number}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          {/* Create New Barcode */}
          <div className={`border rounded-lg p-4 space-y-3 ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
            <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Create New Barcode</h4>
            <form onSubmit={handleCreateBarcode} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  value={newBarcode.barcode}
                  onChange={(e) =>
                    setNewBarcode({ ...newBarcode, barcode: e.target.value })
                  }
                  placeholder="Enter barcode..."
                  className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newBarcode.barcode_type}
                    onChange={(e) =>
                      setNewBarcode({
                        ...newBarcode,
                        barcode_type: e.target.value as any,
                      })
                    }
                    className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                  >
                    <option value="sku">SKU</option>
                    <option value="lot">Lot</option>
                    <option value="serial">Serial</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Product
                  </label>
                  <select
                    value={newBarcode.product_id}
                    onChange={(e) =>
                      setNewBarcode({ ...newBarcode, product_id: e.target.value })
                    }
                    className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Barcode
              </Button>
            </form>
          </div>

          {/* Search Barcodes */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search barcodes..."
              className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
            />
          </div>

          {/* Barcode List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : barcodes.length === 0 ? (
            <div className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>No barcodes found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {barcodes.map((barcode) => (
                <div
                  key={barcode._id}
                  className={`border rounded-lg p-3 flex items-center justify-between ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs text-white px-2 py-1 rounded ${getTypeColor(
                          barcode.barcode_type
                        )}`}
                      >
                        {getTypeLabel(barcode.barcode_type)}
                      </span>
                      <p className={`font-mono text-sm truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {barcode.barcode}
                      </p>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      {getProductName(barcode.product_id)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedBarcode(barcode);
                        setShowDetail(true);
                      }}
                      className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(barcode.barcode);
                        showNotification.success("Barcode copied!");
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      title="Copy barcode"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBarcode(barcode._id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-slate-700/30 border border-slate-600' : 'bg-slate-100 border border-slate-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Total Barcodes</p>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{stats.total_barcodes}</p>
          </div>
          <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-green-900/20 border border-green-600' : 'bg-green-100 border border-green-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Active</p>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
              {stats.active_barcodes}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-blue-900/20 border border-blue-600' : 'bg-blue-100 border border-blue-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>SKU Barcodes</p>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`}>{stats.sku_barcodes}</p>
          </div>
          <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-purple-900/20 border border-purple-600' : 'bg-purple-100 border border-purple-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Lot Barcodes</p>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`}>
              {stats.lot_barcodes}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-yellow-900/20 border border-yellow-600' : 'bg-yellow-100 border border-yellow-300'}`}>
            <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Serial Barcodes</p>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {stats.serial_barcodes}
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedBarcode && (
        <div className={`rounded-lg p-4 space-y-3 ${isDarkTheme ? 'bg-slate-700/30 border border-slate-600' : 'bg-slate-100 border border-slate-300'}`}>
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Barcode Details</h4>
            <button
              onClick={() => setShowDetail(false)}
              className={isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Barcode</p>
              <p className={`font-mono ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{selectedBarcode.barcode}</p>
            </div>
            <div>
              <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Type</p>
              <p className={isDarkTheme ? 'text-white' : 'text-slate-900'}>
                <span
                  className={`text-xs text-white px-2 py-1 rounded ${getTypeColor(
                    selectedBarcode.barcode_type
                  )}`}
                >
                  {getTypeLabel(selectedBarcode.barcode_type)}
                </span>
              </p>
            </div>
            <div>
              <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Product</p>
              <p className={isDarkTheme ? 'text-white' : 'text-slate-900'}>
                {getProductName(selectedBarcode.product_id)}
              </p>
            </div>
            {selectedBarcode.lot_id && (
              <div>
                <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Lot ID</p>
                <p className={`font-mono text-xs ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {selectedBarcode.lot_id}
                </p>
              </div>
            )}
            {selectedBarcode.serial_number && (
              <div>
                <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Serial Number</p>
                <p className={`font-mono ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {selectedBarcode.serial_number}
                </p>
              </div>
            )}
            <div>
              <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Created</p>
              <p className={`text-xs ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {new Date(selectedBarcode.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
