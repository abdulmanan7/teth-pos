import { X, Plus, Eye, Trash2, Check, AlertCircle, Package, Calendar, User, FileText, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, Hash, Barcode, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";

interface Product {
  _id: string;
  name: string;
  sku: string;
}

interface PurchaseOrder {
  _id: string;
  po_number: string;
  items: Array<{
    product_id: string;
    quantity: number;
    purchase_price: number;
  }>;
}

interface GRItem {
  product_id: string;
  po_item_index: number;
  po_quantity: number;
  ordered_quantity?: number; // Original PO quantity
  already_received?: number; // Already received in previous GRs
  already_damaged?: number; // Already damaged in previous GRs
  received_quantity: number;
  damaged_quantity: number;
  quality_check: 'pass' | 'fail' | 'pending';
  quality_notes?: string;
  barcodes?: string[];
  lot_numbers?: string[];
  serial_numbers?: string[];
}

interface GoodsReceipt {
  _id: string;
  po_id: string;
  po_number: string;
  receipt_number: string;
  items: GRItem[];
  receipt_date: string;
  received_by?: string;
  total_received: number;
  total_damaged: number;
  status: 'pending' | 'partial' | 'complete';
  notes?: string;
}

interface GoodsReceiptManagerProps {
  isDarkTheme?: boolean;
}

export default function GoodsReceiptManager({ isDarkTheme = true }: GoodsReceiptManagerProps) {
  const { addToast } = useToast();
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [formData, setFormData] = useState({
    po_id: "",
    received_by: "",
    notes: "",
    items: [] as GRItem[],
  });
  const [submitting, setSubmitting] = useState(false);
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grsData, posData, productsData] = await Promise.all([
        get("/api/goods-receipts"),
        get("/api/purchase-orders"),
        get("/api/products"),
      ]);
      setGoodsReceipts(grsData);
      setPurchaseOrders(posData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      addToast("Failed to fetch goods receipt data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePOSelect = async (poId: string) => {
    try {
      // Fetch PO with remaining quantities
      const poWithRemaining = await get(`/api/goods-receipts/po/${poId}/remaining`);
      
      setSelectedPO(purchaseOrders.find(p => p._id === poId) || null);
      setFormData({
        ...formData,
        po_id: poId,
        items: poWithRemaining.items
          .filter((item: any) => item.remaining_quantity > 0) // Only show items with remaining qty
          .map((item: any) => ({
            product_id: item.product_id,
            po_item_index: item.po_item_index,
            po_quantity: item.remaining_quantity, // Use remaining instead of original
            ordered_quantity: item.ordered_quantity, // Keep original for reference
            already_received: item.already_received,
            already_damaged: item.already_damaged,
            received_quantity: 0,
            damaged_quantity: 0,
            quality_check: 'pending',
            barcodes: [],
            lot_numbers: [],
            serial_numbers: [],
          })),
      });
    } catch (error) {
      console.error("Error fetching PO details:", error);
      addToast("Failed to load PO details", "error");
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  // Validate quantity constraints
  const validateQuantities = (item: GRItem): { isValid: boolean; error?: string } => {
    const totalReceived = (item.received_quantity || 0) + (item.damaged_quantity || 0);
    if (totalReceived > item.po_quantity) {
      return {
        isValid: false,
        error: `Total (${totalReceived}) exceeds ordered quantity (${item.po_quantity})`
      };
    }
    if (item.received_quantity < 0 || item.damaged_quantity < 0) {
      return { isValid: false, error: 'Quantities cannot be negative' };
    }
    return { isValid: true };
  };

  // Generate lot numbers in range
  const generateLotNumbers = (itemIndex: number, prefix: string, start: number, count: number) => {
    const newItems = [...formData.items];
    const lots: string[] = [];
    for (let i = 0; i < count; i++) {
      lots.push(`${prefix}${String(start + i).padStart(4, '0')}`);
    }
    newItems[itemIndex].lot_numbers = lots;
    setFormData({ ...formData, items: newItems });
  };

  // Generate serial numbers in range
  const generateSerialNumbers = (itemIndex: number, prefix: string, start: number, count: number) => {
    const newItems = [...formData.items];
    const serials: string[] = [];
    for (let i = 0; i < count; i++) {
      serials.push(`${prefix}${String(start + i).padStart(6, '0')}`);
    }
    newItems[itemIndex].serial_numbers = serials;
    setFormData({ ...formData, items: newItems });
  };

  const handleAddBarcode = (itemIndex: number, barcode: string) => {
    if (barcode.trim()) {
      const newItems = [...formData.items];
      if (!newItems[itemIndex].barcodes) {
        newItems[itemIndex].barcodes = [];
      }
      newItems[itemIndex].barcodes!.push(barcode);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleRemoveBarcode = (itemIndex: number, barcodeIndex: number) => {
    const newItems = [...formData.items];
    if (newItems[itemIndex].barcodes) {
      newItems[itemIndex].barcodes!.splice(barcodeIndex, 1);
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleSaveGR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.po_id || formData.items.length === 0) {
      addToast("Please select a PO and add items", "warning");
      return;
    }

    // Validate all items
    for (const item of formData.items) {
      const validation = validateQuantities(item);
      if (!validation.isValid) {
        addToast(validation.error || "Invalid quantities", "warning");
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        po_id: formData.po_id,
        items: formData.items,
        received_by: formData.received_by,
        notes: formData.notes,
      };

      await post("/api/goods-receipts", payload);
      addToast("Goods receipt created successfully!", "success");
      setShowForm(false);
      setFormData({
        po_id: "",
        received_by: "",
        notes: "",
        items: [],
      });
      setSelectedPO(null);
      await fetchData();
    } catch (error) {
      console.error("Error saving GR:", error);
      addToast("Failed to create goods receipt", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGR = async (id: string) => {
    if (confirm("Are you sure you want to delete this goods receipt?")) {
      try {
        await deleteRequest(`/api/goods-receipts/${id}`);
        addToast("Goods receipt deleted successfully!", "success");
        await fetchData();
      } catch (error) {
        console.error("Error deleting GR:", error);
        addToast("Failed to delete goods receipt", "error");
      }
    }
  };

  const handleConfirmGR = async () => {
    if (!selectedGR) return;
    try {
      setConfirming(true);
      await put(`/api/goods-receipts/${selectedGR._id}/confirm`, {});
      addToast("Goods receipt confirmed! Inventory updated.", "success");
      await fetchData();
      setShowDetailsModal(false);
      setSelectedGR(null);
    } catch (error) {
      console.error("Error confirming GR:", error);
      addToast("Failed to confirm goods receipt", "error");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-600",
      partial: "bg-blue-600",
      complete: "bg-green-600",
    };
    return colors[status] || "bg-gray-600";
  };

  const getQualityColor = (quality: string) => {
    const colors: Record<string, string> = {
      pass: "bg-green-900 text-green-300",
      fail: "bg-red-900 text-red-300",
      pending: "bg-yellow-900 text-yellow-300",
    };
    return colors[quality] || "bg-gray-900 text-gray-300";
  };

  const getProductName = (productId: string) => {
    return products.find(p => p._id === productId)?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Loading goods receipts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Goods Receipts</h2>
        <Button
          onClick={() => {
            setShowForm(true);
            setSelectedPO(null);
            setFormData({
              po_id: "",
              received_by: "",
              notes: "",
              items: [],
            });
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create GR
        </Button>
      </div>

      {/* Goods Receipts List */}
      <div className="grid gap-4">
        {goodsReceipts.length === 0 ? (
          <div className={`text-center py-12 rounded-lg border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
            <Package className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className={`text-lg font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>No goods receipts yet</p>
            <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Create one to start receiving inventory from purchase orders</p>
          </div>
        ) : (
          goodsReceipts.map((gr) => {
            const totalOrdered = gr.items.reduce((sum, item) => sum + item.po_quantity, 0);
            const receivePercentage = totalOrdered > 0 ? Math.round((gr.total_received / totalOrdered) * 100) : 0;
            const hasQualityIssues = gr.items.some(item => item.quality_check === 'fail' || item.damaged_quantity > 0);
            const allQualityPassed = gr.items.every(item => item.quality_check === 'pass');

            return (
              <div
                key={gr._id}
                className={`border rounded-lg overflow-hidden transition-all hover:shadow-lg ${isDarkTheme ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-300 hover:border-slate-400'}`}
              >
                {/* Header */}
                <div className={`p-4 border-b ${isDarkTheme ? 'border-slate-700 bg-slate-700/30' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {gr.receipt_number}
                        </h3>
                        <span className={`text-xs px-3 py-1 rounded-full text-white font-medium ${getStatusColor(gr.status)}`}>
                          {gr.status.toUpperCase()}
                        </span>
                        {hasQualityIssues && (
                          <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-medium border border-red-500/30">
                            ⚠️ QUALITY ISSUES
                          </span>
                        )}
                        {allQualityPassed && gr.status === 'complete' && (
                          <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-medium border border-green-500/30">
                            ✓ ALL PASSED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          <FileText className="w-4 h-4" />
                          PO: <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{gr.po_number}</span>
                        </span>
                        <span className={`flex items-center gap-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          <Calendar className="w-4 h-4" />
                          {new Date(gr.receipt_date).toLocaleDateString()}
                        </span>
                        {gr.received_by && (
                          <span className={`flex items-center gap-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                            <User className="w-4 h-4" />
                            {gr.received_by}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedGR(gr);
                          setShowDetailsModal(true);
                        }}
                        className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGR(gr._id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="Delete GR"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className={`w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Items</span>
                      </div>
                      <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {gr.items.length}
                      </p>
                    </div>

                    <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className={`text-xs font-medium ${isDarkTheme ? 'text-green-300' : 'text-green-700'}`}>Received</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">
                        {gr.total_received}
                      </p>
                      <p className={`text-xs ${isDarkTheme ? 'text-green-300' : 'text-green-600'}`}>
                        {receivePercentage}% of {totalOrdered}
                      </p>
                    </div>

                    <div className={`rounded-lg p-3 ${gr.total_damaged > 0 ? (isDarkTheme ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200') : (isDarkTheme ? 'bg-slate-700/30' : 'bg-slate-100')}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className={`w-4 h-4 ${gr.total_damaged > 0 ? 'text-red-400' : (isDarkTheme ? 'text-slate-400' : 'text-slate-500')}`} />
                        <span className={`text-xs font-medium ${gr.total_damaged > 0 ? (isDarkTheme ? 'text-red-300' : 'text-red-700') : (isDarkTheme ? 'text-slate-400' : 'text-slate-600')}`}>Damaged</span>
                      </div>
                      <p className={`text-2xl font-bold ${gr.total_damaged > 0 ? 'text-red-400' : (isDarkTheme ? 'text-slate-500' : 'text-slate-400')}`}>
                        {gr.total_damaged}
                      </p>
                    </div>

                    <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {allQualityPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : hasQualityIssues ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className={`w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                        <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Quality</span>
                      </div>
                      <p className={`text-sm font-bold ${allQualityPassed ? 'text-green-400' : hasQualityIssues ? 'text-red-400' : (isDarkTheme ? 'text-yellow-400' : 'text-yellow-600')}`}>
                        {allQualityPassed ? 'All Pass' : hasQualityIssues ? 'Issues' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Receive Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        Receipt Progress
                      </span>
                      <span className={`text-sm font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {receivePercentage}%
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-300'}`}>
                      <div
                        className={`h-2 rounded-full transition-all ${receivePercentage === 100 ? 'bg-green-500' : receivePercentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                        style={{ width: `${receivePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <p className={`text-sm font-semibold mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Items ({gr.items.length})
                    </p>
                    <div className="space-y-2">
                      {gr.items.map((item, idx) => {
                        const receivedPercent = item.po_quantity > 0 ? Math.round((item.received_quantity / item.po_quantity) * 100) : 0;
                        
                        return (
                          <div key={idx} className={`rounded-lg p-3 border ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                                  {getProductName(item.product_id)}
                                </p>
                                <div className="flex items-center gap-3 text-xs mt-1">
                                  <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                                    Ordered: <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.po_quantity}</span>
                                  </span>
                                  <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                                    Received: <span className={`font-semibold ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>{item.received_quantity}</span>
                                  </span>
                                  {item.damaged_quantity > 0 && (
                                    <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                                      Damaged: <span className="font-semibold text-red-400">{item.damaged_quantity}</span>
                                    </span>
                                  )}
                                  <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                                    {receivedPercent}%
                                  </span>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(item.quality_check)}`}>
                                {item.quality_check.toUpperCase()}
                              </span>
                            </div>
                            {item.quality_notes && (
                              <p className={`text-xs mt-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                                📝 {item.quality_notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  {gr.notes && (
                    <div className={`mt-4 rounded-lg p-3 ${isDarkTheme ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                      <p className={`text-xs font-medium mb-1 ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>Notes:</p>
                      <p className={`text-sm ${isDarkTheme ? 'text-blue-200' : 'text-blue-600'}`}>{gr.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create GR Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg border shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
              <h3 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Create Goods Receipt</h3>
              <button
                onClick={() => setShowForm(false)}
                className={isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGR} className="p-6 space-y-4">
              {/* PO Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Purchase Order *
                </label>
                <select
                  value={formData.po_id}
                  onChange={(e) => handlePOSelect(e.target.value)}
                  className={`w-full rounded px-3 py-2 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                >
                  <option value="">Select a PO</option>
                  {purchaseOrders
                    .filter(po => po.items && po.items.length > 0)
                    .map((po) => (
                      <option key={po._id} value={po._id}>
                        {po.po_number}
                      </option>
                    ))}
                </select>
              </div>

              {/* Received By */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Received By
                </label>
                <Input
                  type="text"
                  placeholder="Name of person who received"
                  value={formData.received_by}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                />
              </div>

              {/* Items Section */}
              {formData.items.length > 0 ? (
                <div className={`border-t pt-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    Items to Receive ({formData.items.length})
                  </h4>
                  <div className="space-y-4">
                    {formData.items.map((item, index) => {
                      const validation = validateQuantities(item);
                      const totalQty = (item.received_quantity || 0) + (item.damaged_quantity || 0);
                      const goodQty = (item.received_quantity || 0) - (item.damaged_quantity || 0);
                      
                      return (
                        <div key={index} className={`p-4 rounded-lg space-y-3 border-2 ${!validation.isValid ? 'border-red-500' : (isDarkTheme ? 'border-slate-600' : 'border-slate-300')} ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                          {/* Header */}
                          <div className="flex items-center justify-between pb-2 border-b ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}">
                            <div className="flex-1">
                              <h5 className={`font-semibold text-base ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                                {getProductName(item.product_id)}
                              </h5>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                {item.ordered_quantity && item.ordered_quantity !== item.po_quantity && (
                                  <>
                                    <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                                      Original PO: <span className="font-bold">{item.ordered_quantity}</span>
                                    </span>
                                    <span className={isDarkTheme ? 'text-blue-400' : 'text-blue-600'}>
                                      Already Received: <span className="font-bold">{item.already_received || 0}</span>
                                    </span>
                                    {(item.already_damaged || 0) > 0 && (
                                      <span className={isDarkTheme ? 'text-red-400' : 'text-red-600'}>
                                        Already Damaged: <span className="font-bold">{item.already_damaged}</span>
                                      </span>
                                    )}
                                  </>
                                )}
                                <span className={`font-semibold ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                                  Remaining: <span className="font-bold">{item.po_quantity}</span> units
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Receiving Now</p>
                              <p className={`text-2xl font-bold ${totalQty > item.po_quantity ? 'text-red-400' : totalQty === item.po_quantity ? 'text-green-400' : (isDarkTheme ? 'text-white' : 'text-slate-900')}`}>
                                {totalQty}
                              </p>
                            </div>
                          </div>

                          {/* Validation Error */}
                          {!validation.isValid && (
                            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-red-400 font-medium">{validation.error}</p>
                            </div>
                          )}

                          {/* Quantity Inputs */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className={`text-xs font-medium flex items-center gap-1 mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                <CheckCircle2 className="w-3 h-3" />
                                Received Qty *
                              </label>
                              <Input
                                type="number"
                                min="0"
                                max={item.po_quantity}
                                value={item.received_quantity || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  handleItemChange(index, "received_quantity", val);
                                }}
                                className={`${isDarkTheme ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-sm font-semibold`}
                              />
                            </div>
                            <div>
                              <label className={`text-xs font-medium flex items-center gap-1 mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                <XCircle className="w-3 h-3" />
                                Damaged Qty
                              </label>
                              <Input
                                type="number"
                                min="0"
                                max={item.po_quantity}
                                value={item.damaged_quantity || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  handleItemChange(index, "damaged_quantity", val);
                                }}
                                className={`${isDarkTheme ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-sm font-semibold`}
                              />
                            </div>
                            <div>
                              <label className={`text-xs font-medium flex items-center gap-1 mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                                <Check className="w-3 h-3" />
                                Quality Check
                              </label>
                              <select
                                value={item.quality_check}
                                onChange={(e) =>
                                  handleItemChange(index, "quality_check", e.target.value)
                                }
                                className={`w-full rounded px-2 py-2 text-sm font-medium ${isDarkTheme ? 'bg-slate-600 border border-slate-500 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                              >
                                <option value="pending">⏳ Pending</option>
                                <option value="pass">✓ Pass</option>
                                <option value="fail">✗ Fail</option>
                              </select>
                            </div>
                          </div>

                          {/* Summary Bar */}
                          <div className={`rounded-lg p-2 text-xs ${isDarkTheme ? 'bg-slate-600/50' : 'bg-slate-200'}`}>
                            <div className="flex items-center justify-between">
                              <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>
                                Good Units: <span className="font-bold text-green-400">{goodQty}</span>
                              </span>
                              <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>
                                Damaged: <span className="font-bold text-red-400">{item.damaged_quantity || 0}</span>
                              </span>
                              <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>
                                Remaining: <span className="font-bold">{item.po_quantity - totalQty}</span>
                              </span>
                            </div>
                          </div>

                          {/* Quality Notes */}
                          <div>
                            <label className={`text-xs font-medium mb-1 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                              Quality Notes
                            </label>
                            <Input
                              type="text"
                              placeholder="e.g., 2 units broken in transit, packaging damaged"
                              value={item.quality_notes || ""}
                              onChange={(e) =>
                                handleItemChange(index, "quality_notes", e.target.value)
                              }
                              className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                            />
                          </div>

                          {/* Lot Numbers Section */}
                          <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-slate-600/30 border border-slate-600' : 'bg-white border border-slate-300'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Hash className={`w-4 h-4 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
                              <label className={`text-xs font-semibold ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>
                                Lot Numbers
                              </label>
                            </div>
                            
                            {/* Quick Generate */}
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              <Input
                                type="text"
                                placeholder="Prefix (LOT-)"
                                id={`lot-prefix-${index}`}
                                className={`${isDarkTheme ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-xs`}
                              />
                              <Input
                                type="number"
                                placeholder="Start (1)"
                                id={`lot-start-${index}`}
                                defaultValue="1"
                                className={`${isDarkTheme ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-xs`}
                              />
                              <Input
                                type="number"
                                placeholder="Count"
                                id={`lot-count-${index}`}
                                defaultValue={goodQty}
                                className={`${isDarkTheme ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-xs`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const prefix = (document.getElementById(`lot-prefix-${index}`) as HTMLInputElement)?.value || 'LOT-';
                                  const start = parseInt((document.getElementById(`lot-start-${index}`) as HTMLInputElement)?.value) || 1;
                                  const count = parseInt((document.getElementById(`lot-count-${index}`) as HTMLInputElement)?.value) || goodQty;
                                  generateLotNumbers(index, prefix, start, count);
                                }}
                                className={`text-xs px-2 py-1 rounded font-medium ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                              >
                                Generate
                              </button>
                            </div>

                            {/* Manual Entry */}
                            <textarea
                              placeholder="Manual entry: LOT-001, LOT-002 (comma-separated)"
                              value={item.lot_numbers?.join(", ") || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "lot_numbers",
                                  e.target.value.split(",").map(s => s.trim()).filter(s => s)
                                )
                              }
                              rows={2}
                              className={`w-full rounded px-2 py-2 text-xs ${isDarkTheme ? 'bg-slate-700 border border-slate-500 text-white placeholder-slate-400' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-500'}`}
                            />
                            {item.lot_numbers && item.lot_numbers.length > 0 && (
                              <p className={`text-xs mt-1 ${isDarkTheme ? 'text-blue-300' : 'text-blue-600'}`}>
                                ✓ {item.lot_numbers.length} lot number(s) added
                              </p>
                            )}
                          </div>

                          {/* Serial Numbers Section */}
                          <div className={`rounded-lg p-3 ${isDarkTheme ? 'bg-slate-600/30 border border-slate-600' : 'bg-white border border-slate-300'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Barcode className={`w-4 h-4 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} />
                              <label className={`text-xs font-semibold ${isDarkTheme ? 'text-purple-300' : 'text-purple-700'}`}>
                                Serial Numbers
                              </label>
                            </div>
                            
                            {/* Quick Generate */}
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              <Input
                                type="text"
                                placeholder="Prefix (SN-)"
                                id={`serial-prefix-${index}`}
                                className={`${isDarkTheme ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-xs`}
                              />
                              <Input
                                type="number"
                                placeholder="Start (1)"
                                id={`serial-start-${index}`}
                                defaultValue="1"
                                className={`${isDarkTheme ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-xs`}
                              />
                              <Input
                                type="number"
                                placeholder="Count"
                                id={`serial-count-${index}`}
                                defaultValue={goodQty}
                                className={`${isDarkTheme ? 'bg-slate-700 border-slate-500 text-white' : 'bg-white border-slate-300 text-slate-900'} text-xs`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const prefix = (document.getElementById(`serial-prefix-${index}`) as HTMLInputElement)?.value || 'SN-';
                                  const start = parseInt((document.getElementById(`serial-start-${index}`) as HTMLInputElement)?.value) || 1;
                                  const count = parseInt((document.getElementById(`serial-count-${index}`) as HTMLInputElement)?.value) || goodQty;
                                  generateSerialNumbers(index, prefix, start, count);
                                }}
                                className={`text-xs px-2 py-1 rounded font-medium ${isDarkTheme ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                              >
                                Generate
                              </button>
                            </div>

                            {/* Manual Entry */}
                            <textarea
                              placeholder="Manual entry: SN-000001, SN-000002 (comma-separated)"
                              value={item.serial_numbers?.join(", ") || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "serial_numbers",
                                  e.target.value.split(",").map(s => s.trim()).filter(s => s)
                                )
                              }
                              rows={2}
                              className={`w-full rounded px-2 py-2 text-xs ${isDarkTheme ? 'bg-slate-700 border border-slate-500 text-white placeholder-slate-400' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-500'}`}
                            />
                            {item.serial_numbers && item.serial_numbers.length > 0 && (
                              <p className={`text-xs mt-1 ${isDarkTheme ? 'text-purple-300' : 'text-purple-600'}`}>
                                ✓ {item.serial_numbers.length} serial number(s) added
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : formData.po_id ? (
                <div className={`border-t pt-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                  <div className={`rounded-lg p-6 text-center ${isDarkTheme ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                    <CheckCircle2 className={`w-12 h-12 mx-auto mb-3 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} />
                    <p className={`text-lg font-semibold mb-2 ${isDarkTheme ? 'text-green-300' : 'text-green-700'}`}>
                      All Items Fully Received
                    </p>
                    <p className={`text-sm ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`}>
                      This PO has been completely received. No items remaining.
                    </p>
                  </div>
                </div>
              ) : null}

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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.po_id}
                  className={`flex-1 disabled:opacity-50 ${isDarkTheme ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {submitting ? "Creating..." : "Create GR"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GR Details Modal */}
      {showDetailsModal && selectedGR && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h3 className="text-xl font-bold text-white">Goods Receipt Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedGR(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Header Info */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">GR Number</p>
                    <p className="text-lg font-semibold text-white">{selectedGR.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">PO Number</p>
                    <p className="text-lg font-semibold text-white">{selectedGR.po_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span className={`inline-block text-xs px-2 py-1 rounded text-white ${getStatusColor(selectedGR.status)}`}>
                      {selectedGR.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Date</p>
                    <p className="text-sm text-white">{new Date(selectedGR.receipt_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-900/30 border border-green-700 rounded p-3">
                  <p className="text-xs text-green-400">Total Received</p>
                  <p className="text-2xl font-bold text-green-300">{selectedGR.total_received}</p>
                </div>
                <div className="bg-red-900/30 border border-red-700 rounded p-3">
                  <p className="text-xs text-red-400">Total Damaged</p>
                  <p className="text-2xl font-bold text-red-300">{selectedGR.total_damaged}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-slate-600 pt-4">
                <p className="text-sm font-semibold text-slate-300 mb-3">Items ({selectedGR.items.length})</p>
                <div className="space-y-2">
                  {selectedGR.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-700/50 p-3 rounded space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{getProductName(item.product_id)}</p>
                          <p className="text-xs text-slate-400">
                            Ordered: {item.po_quantity} | Received: {item.received_quantity} | Damaged: {item.damaged_quantity}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(item.quality_check)}`}>
                          {item.quality_check}
                        </span>
                      </div>
                      {item.quality_notes && (
                        <p className="text-xs text-slate-300">Notes: {item.quality_notes}</p>
                      )}
                      {item.lot_numbers && item.lot_numbers.length > 0 && (
                        <p className="text-xs text-slate-300">Lots: {item.lot_numbers.join(", ")}</p>
                      )}
                      {item.serial_numbers && item.serial_numbers.length > 0 && (
                        <p className="text-xs text-slate-300">Serials: {item.serial_numbers.join(", ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedGR.notes && (
                <div className="border-t border-slate-600 pt-4">
                  <p className="text-sm font-semibold text-slate-300 mb-2">Notes</p>
                  <p className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded">{selectedGR.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-700 p-6 flex gap-2">
              {selectedGR.status !== 'complete' && (
                <Button
                  onClick={handleConfirmGR}
                  disabled={confirming}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {confirming ? "Confirming..." : "Confirm & Update Inventory"}
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedGR(null);
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
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
