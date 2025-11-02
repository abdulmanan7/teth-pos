import { X, Plus, Eye, Trash2, Check, AlertCircle } from "lucide-react";
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

  const handlePOSelect = (poId: string) => {
    const po = purchaseOrders.find(p => p._id === poId);
    if (po) {
      setSelectedPO(po);
      setFormData({
        ...formData,
        po_id: poId,
        items: po.items.map((item, idx) => ({
          product_id: item.product_id,
          po_item_index: idx,
          po_quantity: item.quantity,
          received_quantity: 0,
          damaged_quantity: 0,
          quality_check: 'pending',
          barcodes: [],
          lot_numbers: [],
          serial_numbers: [],
        })),
      });
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
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

    if (formData.items.some(item => item.received_quantity < 0)) {
      addToast("Received quantity cannot be negative", "warning");
      return;
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
          <div className={`text-center py-8 rounded-lg border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
            <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>No goods receipts yet. Create one to get started!</p>
          </div>
        ) : (
          goodsReceipts.map((gr) => (
            <div
              key={gr._id}
              className={`border rounded-lg p-4 transition-colors ${isDarkTheme ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-300 hover:border-slate-400'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{gr.receipt_number}</h3>
                    <span className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(gr.status)}`}>
                      {gr.status}
                    </span>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 text-sm mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    <div>PO: <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{gr.po_number}</span></div>
                    <div>Received: <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{gr.total_received}</span></div>
                    <div>Damaged: <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{gr.total_damaged}</span></div>
                    <div>Date: <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{new Date(gr.receipt_date).toLocaleDateString()}</span></div>
                  </div>

                  {/* Items Summary */}
                  <div className={`rounded p-2 mb-2 ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                    <p className={`text-xs mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Items ({gr.items.length}):</p>
                    <div className="space-y-1">
                      {gr.items.map((item, idx) => (
                        <div key={idx} className={`text-xs flex items-center justify-between ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span>{getProductName(item.product_id)} - {item.received_quantity}/{item.po_quantity}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getQualityColor(item.quality_check)}`}>
                            {item.quality_check}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedGR(gr);
                      setShowDetailsModal(true);
                    }}
                    className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-900'}`}
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGR(gr._id)}
                    className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-900'}`}
                    title="Delete GR"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
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
              {formData.items.length > 0 && (
                <div className={`border-t pt-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Items</h4>
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className={`p-4 rounded space-y-3 ${isDarkTheme ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                        <div className="flex items-center justify-between">
                          <h5 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            {getProductName(item.product_id)}
                          </h5>
                          <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                            Ordered: {item.po_quantity}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Received Qty</label>
                            <Input
                              type="number"
                              min="0"
                              value={item.received_quantity}
                              onChange={(e) =>
                                handleItemChange(index, "received_quantity", parseInt(e.target.value))
                              }
                              className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                            />
                          </div>
                          <div>
                            <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Damaged Qty</label>
                            <Input
                              type="number"
                              min="0"
                              value={item.damaged_quantity}
                              onChange={(e) =>
                                handleItemChange(index, "damaged_quantity", parseInt(e.target.value))
                              }
                              className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                            />
                          </div>
                          <div>
                            <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Quality</label>
                            <select
                              value={item.quality_check}
                              onChange={(e) =>
                                handleItemChange(index, "quality_check", e.target.value)
                              }
                              className={`w-full rounded px-2 py-1 text-sm ${isDarkTheme ? 'bg-slate-600 border border-slate-500 text-white' : 'bg-white border border-slate-300 text-slate-900'}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="pass">Pass</option>
                              <option value="fail">Fail</option>
                            </select>
                          </div>
                        </div>

                        {/* Quality Notes */}
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Quality Notes</label>
                          <Input
                            type="text"
                            placeholder="e.g., 2 units broken in transit"
                            value={item.quality_notes || ""}
                            onChange={(e) =>
                              handleItemChange(index, "quality_notes", e.target.value)
                            }
                            className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                          />
                        </div>

                        {/* Lot Numbers */}
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Lot Numbers (comma-separated)</label>
                          <Input
                            type="text"
                            placeholder="e.g., LOT-2025-001, LOT-2025-002"
                            value={item.lot_numbers?.join(", ") || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "lot_numbers",
                                e.target.value.split(",").map(s => s.trim()).filter(s => s)
                              )
                            }
                            className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                          />
                        </div>

                        {/* Serial Numbers */}
                        <div>
                          <label className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Serial Numbers (comma-separated)</label>
                          <Input
                            type="text"
                            placeholder="e.g., SN-001, SN-002, SN-003"
                            value={item.serial_numbers?.join(", ") || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "serial_numbers",
                                e.target.value.split(",").map(s => s.trim()).filter(s => s)
                              )
                            }
                            className={isDarkTheme ? 'bg-slate-600 border-slate-500 text-white text-sm' : 'bg-white border-slate-300 text-slate-900 text-sm'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
