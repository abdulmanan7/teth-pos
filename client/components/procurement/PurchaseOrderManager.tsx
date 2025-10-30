import { X, Plus, Edit2, Trash2, TrendingDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";

interface Vendor {
  _id: string;
  name: string;
  code: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
}

interface PurchaseOrderItem {
  product_id: string;
  quantity: number;
  purchase_price: number;
  line_total: number;
}

interface PaymentRecord {
  _id?: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

interface PurchaseOrder {
  _id: string;
  po_number: string;
  vendor_id: string;
  items: PurchaseOrderItem[];
  total_amount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'invoiced' | 'paid';
  payment_status: 'pending' | 'partial' | 'paid';
  amount_paid: number;
  payment_history: PaymentRecord[];
  order_date: string;
  expected_delivery?: string;
  actual_delivery?: string;
  notes?: string;
}

export default function PurchaseOrderManager() {
  const { addToast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    vendor_id: "",
    items: [{ product_id: "", quantity: 1, purchase_price: 0 }],
    expected_delivery: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
  });
  const [recordingPayment, setRecordingPayment] = useState(false);
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [posData, vendorsData, productsData] = await Promise.all([
        get("/api/purchase-orders"),
        get("/api/vendors"),
        get("/api/products"),
      ]);
      setPurchaseOrders(posData);
      setVendors(vendorsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      addToast("Failed to fetch purchase order data", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: "",
      items: [{ product_id: "", quantity: 1, purchase_price: 0 }],
      expected_delivery: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: "", quantity: 1, purchase_price: 0 }],
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
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.purchase_price), 0);
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_id || formData.items.length === 0) {
      addToast("Please select a vendor and add items", "warning");
      return;
    }

    if (formData.items.some(item => !item.product_id || item.quantity <= 0 || item.purchase_price <= 0)) {
      addToast("Please fill in all item details", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vendor_id: formData.vendor_id,
        items: formData.items,
        expected_delivery: formData.expected_delivery || undefined,
        notes: formData.notes,
      };

      if (editingId) {
        await put(`/api/purchase-orders/${editingId}`, payload);
        addToast("Purchase order updated successfully!", "success");
      } else {
        await post("/api/purchase-orders", payload);
        addToast("Purchase order created successfully!", "success");
      }
      resetForm();
      setShowForm(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving PO:", error);
      addToast("Failed to save purchase order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePO = async (id: string) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      try {
        await deleteRequest(`/api/purchase-orders/${id}`);
        addToast("Purchase order deleted successfully!", "success");
        await fetchData();
      } catch (error) {
        console.error("Error deleting PO:", error);
        addToast("Failed to delete purchase order", "error");
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedPO) return;
    try {
      setUpdatingStatus(true);
      await put(`/api/purchase-orders/${selectedPO._id}/status`, { status: newStatus });
      addToast("Purchase order status updated successfully!", "success");
      await fetchData();
      setShowDetailsModal(false);
      setSelectedPO(null);
    } catch (error) {
      console.error("Error updating status:", error);
      addToast("Failed to update purchase order status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || paymentForm.amount <= 0) {
      addToast("Please enter a valid payment amount", "warning");
      return;
    }

    try {
      setRecordingPayment(true);
      const updatedPO = await post(`/api/purchase-orders/${selectedPO._id}/payment`, {
        amount: paymentForm.amount,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      });

      addToast(`Payment of Rs ${paymentForm.amount.toFixed(2)} recorded successfully!`, "success");
      setSelectedPO(updatedPO);
      setPaymentForm({ amount: 0, payment_method: 'bank_transfer', reference: '', notes: '' });
      setShowPaymentForm(false);
      await fetchData();
    } catch (error) {
      console.error("Error recording payment:", error);
      addToast("Failed to record payment", "error");
    } finally {
      setRecordingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-600",
      sent: "bg-blue-600",
      confirmed: "bg-indigo-600",
      received: "bg-green-600",
      invoiced: "bg-purple-600",
      paid: "bg-emerald-600",
    };
    return colors[status] || "bg-gray-600";
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v._id === vendorId)?.name || "Unknown";
  };

  const getProductName = (productId: string) => {
    return products.find(p => p._id === productId)?.name || "Unknown";
  };

  // Filter POs based on search term
  const filteredPOs = purchaseOrders.filter(po => {
    const searchLower = searchTerm.toLowerCase();
    return (
      po.po_number.toLowerCase().includes(searchLower) ||
      getVendorName(po.vendor_id).toLowerCase().includes(searchLower) ||
      po.status.toLowerCase().includes(searchLower) ||
      po.payment_status.toLowerCase().includes(searchLower) ||
      po.total_amount.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-400">Loading purchase orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Purchase Orders</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </Button>
      </div>

      {/* Search Field */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <Input
          type="text"
          placeholder="Search by PO number, vendor, status, or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
        />
        {searchTerm && (
          <p className="text-xs text-slate-400 mt-2">
            Found {filteredPOs.length} of {purchaseOrders.length} purchase orders
          </p>
        )}
      </div>

      {/* Purchase Orders List */}
      <div className="grid gap-4">
        {purchaseOrders.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400">No purchase orders yet. Create one to get started!</p>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-400">No purchase orders match your search.</p>
          </div>
        ) : (
          filteredPOs.map((po) => (
            <div
              key={po._id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">{po.po_number}</h3>
                    <span className={`text-xs px-2 py-1 rounded text-white ${getStatusColor(po.status)}`}>
                      {po.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      po.payment_status === 'paid' ? 'bg-green-900 text-green-300' :
                      po.payment_status === 'partial' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {po.payment_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-2">
                    <div>Vendor: <span className="text-white">{getVendorName(po.vendor_id)}</span></div>
                    <div>Total: <span className="text-white font-semibold">Rs {po.total_amount.toFixed(2)}</span></div>
                    <div>Order Date: <span className="text-white">{new Date(po.order_date).toLocaleDateString()}</span></div>
                    {po.expected_delivery && (
                      <div>Expected: <span className="text-white">{new Date(po.expected_delivery).toLocaleDateString()}</span></div>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="bg-slate-700/50 rounded p-2 mb-2">
                    <p className="text-xs text-slate-400 mb-1">Items ({po.items.length}):</p>
                    <div className="space-y-1">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="text-xs text-slate-300">
                          {getProductName(item.product_id)} - {item.quantity} × Rs {item.purchase_price.toFixed(2)} = Rs {item.line_total.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      setShowDetailsModal(true);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    title="View & Update Status"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePO(po._id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    title="Delete PO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create PO Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h3 className="text-xl font-bold text-white">Create Purchase Order</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vendor *
                </label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                >
                  <option value="">Select a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name} ({vendor.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expected Delivery Date
                </label>
                <Input
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Items Section */}
              <div className="border-t border-slate-600 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">Items *</h4>
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
                    <div key={index} className="bg-slate-700/50 p-3 rounded space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-slate-400">Product</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                            className="w-full bg-slate-600 border border-slate-500 text-white rounded px-2 py-1 text-sm"
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Quantity</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                            className="bg-slate-600 border-slate-500 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Price</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchase_price}
                            onChange={(e) => handleItemChange(index, "purchase_price", parseFloat(e.target.value))}
                            className="bg-slate-600 border-slate-500 text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">
                          Line Total: Rs {(item.quantity * item.purchase_price).toFixed(2)}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-slate-700/50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Total Amount:</span>
                    <span className="text-lg font-bold text-green-400">Rs {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
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
                  {submitting ? "Creating..." : "Create PO"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Details Modal */}
      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h3 className="text-xl font-bold text-white">Purchase Order Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPO(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* PO Header Info */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">PO Number</p>
                    <p className="text-lg font-semibold text-white">{selectedPO.po_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Vendor</p>
                    <p className="text-lg font-semibold text-white">{getVendorName(selectedPO.vendor_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Order Date</p>
                    <p className="text-sm text-white">{new Date(selectedPO.order_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-green-400">Rs {selectedPO.total_amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="border-t border-slate-600 pt-4">
                <p className="text-sm font-semibold text-slate-300 mb-3">Update Status</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['draft', 'sent', 'confirmed', 'received', 'invoiced', 'paid'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={updatingStatus || selectedPO.status === status}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        selectedPO.status === status
                          ? `${getStatusColor(status)} text-white opacity-100`
                          : `bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50`
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Status & History */}
              <div className="border-t border-slate-600 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-300">Payment Status</p>
                  <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                  >
                    {showPaymentForm ? 'Cancel' : '+ Record Payment'}
                  </button>
                </div>

                {/* Payment Summary */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-slate-700/50 p-2 rounded">
                    <p className="text-xs text-slate-400">Total Amount</p>
                    <p className="text-sm font-semibold text-white">Rs {selectedPO.total_amount.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <p className="text-xs text-slate-400">Amount Paid</p>
                    <p className="text-sm font-semibold text-green-400">Rs {selectedPO.amount_paid.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-700/50 p-2 rounded">
                    <p className="text-xs text-slate-400">Remaining</p>
                    <p className="text-sm font-semibold text-yellow-400">Rs {(selectedPO.total_amount - selectedPO.amount_paid).toFixed(2)}</p>
                  </div>
                </div>

                {/* Payment Status Badge */}
                <div className="mb-3">
                  <span className={`text-xs px-3 py-1 rounded font-medium ${
                    selectedPO.payment_status === 'paid' ? 'bg-green-900 text-green-300' :
                    selectedPO.payment_status === 'partial' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {selectedPO.payment_status.charAt(0).toUpperCase() + selectedPO.payment_status.slice(1)}
                  </span>
                </div>

                {/* Payment Form */}
                {showPaymentForm && (
                  <form onSubmit={handleRecordPayment} className="bg-slate-700/50 p-3 rounded mb-3 space-y-2">
                    <div>
                      <label className="text-xs text-slate-400">Amount *</label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                        placeholder="Enter payment amount"
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Payment Method</label>
                      <select
                        value={paymentForm.payment_method}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        className="w-full bg-slate-600 border border-slate-500 text-white rounded px-2 py-1 text-sm"
                      >
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Reference (Optional)</label>
                      <Input
                        type="text"
                        value={paymentForm.reference}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                        placeholder="e.g., Check #, Transaction ID"
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Notes (Optional)</label>
                      <textarea
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        placeholder="Additional notes..."
                        className="w-full bg-slate-600 border border-slate-500 text-white rounded px-2 py-1 text-sm"
                        rows={2}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={recordingPayment}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded disabled:opacity-50 transition-colors"
                    >
                      {recordingPayment ? 'Recording...' : 'Record Payment'}
                    </button>
                  </form>
                )}

                {/* Payment History */}
                {selectedPO.payment_history && selectedPO.payment_history.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">Payment History</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedPO.payment_history.map((payment, idx) => (
                        <div key={idx} className="bg-slate-700/30 p-2 rounded border border-slate-600">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-green-400">Rs {payment.amount.toFixed(2)}</span>
                            <span className="text-xs text-slate-400">{new Date(payment.payment_date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            <p>Method: {payment.payment_method?.replace('_', ' ').toUpperCase() || 'Other'}</p>
                            {payment.reference && <p>Ref: {payment.reference}</p>}
                            {payment.notes && <p>Notes: {payment.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-slate-600 pt-4">
                <p className="text-sm font-semibold text-slate-300 mb-3">Items ({selectedPO.items.length})</p>
                <div className="space-y-2">
                  {selectedPO.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-700/50 p-3 rounded">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{getProductName(item.product_id)}</p>
                          <p className="text-xs text-slate-400">{item.quantity} × Rs {item.purchase_price.toFixed(2)}</p>
                        </div>
                        <p className="text-sm font-semibold text-green-400">Rs {item.line_total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Info */}
              {(selectedPO.expected_delivery || selectedPO.actual_delivery) && (
                <div className="border-t border-slate-600 pt-4">
                  <p className="text-sm font-semibold text-slate-300 mb-2">Delivery</p>
                  <div className="space-y-1 text-sm text-slate-400">
                    {selectedPO.expected_delivery && (
                      <p>Expected: <span className="text-white">{new Date(selectedPO.expected_delivery).toLocaleDateString()}</span></p>
                    )}
                    {selectedPO.actual_delivery && (
                      <p>Actual: <span className="text-white">{new Date(selectedPO.actual_delivery).toLocaleDateString()}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPO.notes && (
                <div className="border-t border-slate-600 pt-4">
                  <p className="text-sm font-semibold text-slate-300 mb-2">Notes</p>
                  <p className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded">{selectedPO.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-700 p-6 flex gap-2">
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPO(null);
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
