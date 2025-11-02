import { X, Plus, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";

interface ReturnItem {
  productId: string;
  productName: string;
  originalPrice: number;
  quantity: number;
  reason: "defective" | "wrong_item" | "not_as_described" | "changed_mind" | "other";
  notes?: string;
}

interface ReplacementItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  type: "same" | "cheaper" | "expensive";
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: string;
  total: number;
  items: any[];
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

export default function ReturnsModal({ isDarkTheme, onClose }: { isDarkTheme: boolean; onClose: () => void }) {
  const { addToast } = useToast();
  const { get, post } = useElectronApi();
  const [tab, setTab] = useState<"create" | "list">("list");
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Create return form state
  const [orderSearch, setOrderSearch] = useState("");
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState("");
  const [returnType, setReturnType] = useState<"refund" | "replacement">("refund");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [replacementItems, setReplacementItems] = useState<ReplacementItem[]>([]);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [notes, setNotes] = useState("");
  const [productSearches, setProductSearches] = useState<{ [key: number]: string }>({});
  const [replacementSearches, setReplacementSearches] = useState<{ [key: number]: string }>({});
  const [showProductDropdowns, setShowProductDropdowns] = useState<{ [key: number]: boolean }>({});
  const [showReplacementDropdowns, setShowReplacementDropdowns] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchData();
  }, []);

  // Reset form when order changes
  useEffect(() => {
    if (selectedOrder) {
      setReturnItems([]);
      setReplacementItems([]);
      setPriceAdjustment(0);
      setProductSearches({});
      setReplacementSearches({});
      setShowProductDropdowns({});
      setShowReplacementDropdowns({});
      setNotes("");
      setRefundMethod("cash");
    }
  }, [selectedOrder]);

  // Reset replacement items and price adjustment when return type changes
  useEffect(() => {
    setReplacementItems([]);
    setPriceAdjustment(0);
    setReplacementSearches({});
    setShowReplacementDropdowns({});
  }, [returnType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [returnsData, statsData, ordersData, productsData] = await Promise.all([
        get("/api/returns"),
        get("/api/returns/stats"),
        get("/api/orders"),
        get("/api/products"),
      ]);
      setReturns(returnsData);
      setStats(statsData);
      setAllOrders(ordersData);
      setAllProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = allOrders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const handleAddReturnItem = () => {
    setReturnItems([
      ...returnItems,
      {
        productId: "",
        productName: "",
        originalPrice: 0,
        quantity: 1,
        reason: "changed_mind",
      },
    ]);
  };

  const handleRemoveReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const handleAddReplacementItem = () => {
    // Auto-set quantity to match the first returned item (for same product exchanges)
    const defaultQty = returnItems.length > 0 ? returnItems[0].quantity : 1;
    setReplacementItems([
      ...replacementItems,
      {
        productId: "",
        productName: "",
        quantity: defaultQty,
        price: 0,
        type: "same",
      },
    ]);
  };

  const handleRemoveReplacementItem = (index: number) => {
    setReplacementItems(replacementItems.filter((_, i) => i !== index));
  };

  const calculateAutoAdjustment = () => {
    // Auto-calculate price adjustment based on replacement items
    const returnTotal = returnItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
    const replacementTotal = replacementItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // Auto adjustment = difference between what customer is returning vs what they're getting
    return returnTotal - replacementTotal;
  };

  const calculateTotals = () => {
    const returnTotal = returnItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
    const replacementTotal = replacementItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const netAdjustment = returnTotal - replacementTotal + priceAdjustment;
    return { returnTotal, replacementTotal, netAdjustment };
  };

  const handleCreateReturn = async () => {
    if (!selectedOrder || returnItems.length === 0) {
      addToast("Please select an order and add returned items", "warning");
      return;
    }

    try {
      const { returnTotal, replacementTotal, netAdjustment } = calculateTotals();

      const returnData = {
        originalOrderId: selectedOrder._id,
        originalOrderNumber: selectedOrder.orderNumber,
        customer: selectedOrder.customer,
        items: returnItems,
        returnType,
        refundMethod: returnType === "refund" ? refundMethod : undefined,
        replacementItems: returnType !== "refund" ? replacementItems : [],
        priceAdjustment,
        notes,
        originalTotal: returnTotal,
        totalRefund: returnType === "refund" ? returnTotal : 0,
        totalExchange: returnType !== "refund" ? replacementTotal : 0,
        netAdjustment,
      };

      const response = await post("/api/returns", returnData);

      if (response.success) {
        addToast("Return request created successfully!", "success");
        setTab("list");
        setOrderSearch("");
        setSelectedOrder(null);
        setReturnItems([]);
        setReplacementItems([]);
        setPriceAdjustment(0);
        setNotes("");
        fetchData();
      } else {
        addToast(`Error: ${response.error}`, "error");
      }
    } catch (error: any) {
      addToast(`Error: ${error.message}`, "error");
    }
  };

  const { returnTotal, replacementTotal, netAdjustment } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Returns Management</h2>
          <button
            onClick={onClose}
            className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDarkTheme ? 'border-slate-700 bg-slate-700/30' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={() => setTab("list")}
            className={`flex-1 px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2 ${
              tab === "list"
                ? isDarkTheme ? "text-white border-b-2 border-blue-500" : "text-slate-900 border-b-2 border-blue-500"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            Returns List
          </button>
          <button
            onClick={() => setTab("create")}
            className={`flex-1 px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2 ${
              tab === "create"
                ? isDarkTheme ? "text-white border-b-2 border-blue-500" : "text-slate-900 border-b-2 border-blue-500"
                : isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Return
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {tab === "list" ? (
            <div className="space-y-4">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-5 gap-4 mb-6">
                  <div className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                    <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Total Returns</p>
                    <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{stats.totalReturns}</p>
                  </div>
                  <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                    <p className="text-yellow-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pendingReturns}</p>
                  </div>
                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                    <p className="text-blue-400 text-sm">Approved</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.approvedReturns}</p>
                  </div>
                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                    <p className="text-green-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-green-400">{stats.completedReturns}</p>
                  </div>
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <p className="text-red-400 text-sm">Rejected</p>
                    <p className="text-2xl font-bold text-red-400">{stats.rejectedReturns}</p>
                  </div>
                </div>
              )}

              {/* Returns List */}
              {loading ? (
                <p className={`text-center ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Loading returns...</p>
              ) : returns.length === 0 ? (
                <p className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>No returns found</p>
              ) : (
                <div className="space-y-3">
                  {returns.map((ret: any) => (
                    <div
                      key={ret._id}
                      className={`p-4 rounded-lg border transition-colors ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{ret.returnNumber}</p>
                          <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Order: {ret.originalOrderNumber}</p>
                          <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Customer: {ret.customer}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-semibold px-2 py-1 rounded capitalize ${
                            ret.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            ret.status === "approved" ? "bg-blue-500/20 text-blue-400" :
                            ret.status === "completed" ? "bg-green-500/20 text-green-400" :
                            ret.status === "rejected" ? "bg-red-500/20 text-red-400" :
                            "bg-slate-500/20 text-slate-400"
                          }`}>{ret.status}</span>
                          <p className={`text-lg font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            Rs {ret.netAdjustment.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs mb-3 ${isDarkTheme ? 'text-slate-500' : 'text-slate-600'}`}>
                        {ret.items.length} item(s) • {ret.returnType}
                      </div>
                      
                      {/* Action Buttons */}
                      {ret.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await post(`/api/returns/${ret._id}/approve`, { approvedBy: "Staff" });
                                addToast("Return approved successfully", "success");
                                fetchData();
                              } catch (error) {
                                addToast("Error approving return", "error");
                              }
                            }}
                            className={`flex-1 text-white text-sm px-3 py-2 rounded transition-colors font-medium flex items-center justify-center gap-1 ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt("Enter rejection reason:");
                              if (!reason) return;
                              try {
                                await post(`/api/returns/${ret._id}/reject`, { reason });
                                addToast("Return rejected successfully", "success");
                                fetchData();
                              } catch (error) {
                                addToast("Error rejecting return", "error");
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded transition-colors font-medium flex items-center justify-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {ret.status === "approved" && (
                        <button
                          onClick={async () => {
                            try {
                              await post(`/api/returns/${ret._id}/complete`, { processedBy: "Staff" });
                              addToast("Return completed successfully", "success");
                              fetchData();
                            } catch (error) {
                              addToast("Error completing return", "error");
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded transition-colors font-medium flex items-center justify-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Complete Return
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {/* Return Type & Order Summary */}
              {selectedOrder && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-blue-400 font-semibold uppercase">Order Details</p>
                      <p className="text-white font-semibold">{selectedOrder.orderNumber}</p>
                      <p className="text-sm text-slate-300">{selectedOrder.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-400 font-semibold uppercase">Return Type</p>
                      <p className={`text-lg font-bold ${returnType === "refund" ? "text-red-400" : "text-emerald-400"}`}>
                        {returnType === "refund" ? "Refund" : "Exchange"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Order Total: Rs {selectedOrder.total.toFixed(2)} • Items: {selectedOrder.items.length}
                  </div>
                </div>
              )}

              {/* Order Info */}
              <div className="space-y-3">
                <div>
                  <label className={`font-semibold text-sm block mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Select Order</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => {
                          setOrderSearch(e.target.value);
                          setShowOrderDropdown(true);
                        }}
                        onFocus={() => setShowOrderDropdown(true)}
                        placeholder="Search order number or customer..."
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                      />
                    </div>
                    {showOrderDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-10 max-h-64 overflow-auto ${isDarkTheme ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}>
                        {filteredOrders.length === 0 ? (
                          <div className={`p-3 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>No orders found</div>
                        ) : (
                          filteredOrders.map((order) => (
                            <button
                              key={order._id}
                              onClick={() => {
                                setSelectedOrder(order);
                                setOrderSearch(`${order.orderNumber} - ${order.customer}`);
                                setShowOrderDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 border-b last:border-0 transition-colors ${isDarkTheme ? 'hover:bg-slate-600 border-slate-600 text-white' : 'hover:bg-slate-100 border-slate-300 text-slate-900'}`}
                            >
                              <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{order.orderNumber}</p>
                              <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{order.customer} • Rs {order.total.toFixed(2)}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`font-semibold text-sm block mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Return Type</label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value as any)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                  >
                    <option value="refund">💵 Refund (Cash Back)</option>
                    <option value="replacement">🔄 Replacement (Same Product)</option>
                  </select>
                </div>

                {returnType === "refund" && (
                  <div>
                    <label className={`font-semibold text-sm block mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Refund Method</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="check">Check</option>
                      <option value="transfer">Bank Transfer</option>
                      <option value="store_credit">Store Credit</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Returned Items */}
              <div className="border-t border-slate-600 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold">Returned Items</h3>
                  <button
                    onClick={handleAddReturnItem}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {returnItems.map((item, idx) => {
                    const orderProducts = selectedOrder?.items || [];
                    const filteredReturnProducts = orderProducts.filter((p: any) =>
                      p.name.toLowerCase().includes((productSearches[idx] || "").toLowerCase())
                    );
                    
                    // Find the selected product to get max available quantity
                    const selectedProduct = orderProducts.find((p: any) => p.productId === item.productId);
                    const maxQuantity = selectedProduct?.quantity || 0;
                    const availableQty = Math.max(0, maxQuantity - (item.quantity > maxQuantity ? item.quantity - maxQuantity : 0));

                    return (
                    <div key={idx} className="bg-slate-700/30 p-3 rounded border border-slate-600 space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Product</label>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            value={productSearches[idx] || ""}
                            onChange={(e) => {
                              setProductSearches({ ...productSearches, [idx]: e.target.value });
                              setShowProductDropdowns({ ...showProductDropdowns, [idx]: true });
                            }}
                            onFocus={() => setShowProductDropdowns({ ...showProductDropdowns, [idx]: true })}
                            placeholder="Search from order items..."
                            className="w-full pl-7 pr-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          />
                          {showProductDropdowns[idx] && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-600 border border-slate-500 rounded shadow-lg z-10 max-h-40 overflow-auto">
                              {filteredReturnProducts.length === 0 ? (
                                <div className="p-2 text-slate-400 text-xs">No items found in order</div>
                              ) : (
                                filteredReturnProducts.map((p: any, pidx: number) => (
                                  <button
                                    key={pidx}
                                    onClick={() => {
                                      const updated = [...returnItems];
                                      updated[idx].productId = p.productId;
                                      updated[idx].productName = p.name;
                                      updated[idx].originalPrice = p.price;
                                      updated[idx].quantity = Math.min(1, p.quantity); // Set to 1 or max available
                                      setReturnItems(updated);
                                      setProductSearches({ ...productSearches, [idx]: p.name });
                                      setShowProductDropdowns({ ...showProductDropdowns, [idx]: false });
                                    }}
                                    className="w-full text-left px-2 py-1 hover:bg-slate-500 border-b border-slate-500 last:border-0 text-white text-sm transition-colors"
                                  >
                                    {p.name} - Rs {p.price.toFixed(2)} (Qty: {p.quantity})
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-300 block mb-1">Price</label>
                          <input
                            type="number"
                            value={item.originalPrice}
                            disabled
                            className="w-full px-2 py-1 bg-slate-700 border border-slate-500 rounded text-slate-400 text-sm opacity-60"
                          />
                        </div>
                        <div className="w-20">
                          <label className="text-xs font-semibold text-slate-300 block mb-1">Qty {maxQuantity > 0 && <span className="text-slate-400">/ {maxQuantity}</span>}</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              const updated = [...returnItems];
                              // Restrict to max available quantity
                              updated[idx].quantity = Math.min(Math.max(1, newQty), maxQuantity);
                              setReturnItems(updated);
                            }}
                            min="1"
                            max={maxQuantity}
                            className={`w-full px-2 py-1 bg-slate-600 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${item.quantity > maxQuantity ? "border-red-500" : "border-slate-500"}`}
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => handleRemoveReturnItem(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Return Reason</label>
                        <select
                          value={item.reason}
                          onChange={(e) => {
                            const updated = [...returnItems];
                            updated[idx].reason = e.target.value as any;
                            setReturnItems(updated);
                          }}
                          className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="defective">Defective</option>
                          <option value="wrong_item">Wrong Item</option>
                          <option value="not_as_described">Not as Described</option>
                          <option value="changed_mind">Changed Mind</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Replacement Items (if replacement) */}
              {returnType === "replacement" && (
                <div className="border-t border-slate-600 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">Replacement/Exchange Items</h3>
                    <button
                      onClick={handleAddReplacementItem}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {replacementItems.map((item, idx) => {
                      // Get the returned item to determine if it's "same product" type
                      const returnedItem = returnItems[idx];
                      const returnedItemPrice = returnedItem?.originalPrice || 0;
                      
                      // Filter products based on type
                      let filteredReplacementProducts = allProducts.filter((p) =>
                        p.name.toLowerCase().includes((replacementSearches[idx] || "").toLowerCase())
                      );

                      // If type is "same", only show the same product that was returned
                      if (returnedItem && returnedItem.productId) {
                        // Auto-detect type based on price comparison
                        let autoType = "same";
                        if (item.price > 0 && returnedItemPrice > 0) {
                          if (item.price < returnedItemPrice) {
                            autoType = "cheaper";
                          } else if (item.price > returnedItemPrice) {
                            autoType = "expensive";
                          }
                        }

                        // If auto-detected type is "same", restrict to same product
                        if (autoType === "same") {
                          filteredReplacementProducts = filteredReplacementProducts.filter(
                            (p) => p._id === returnedItem.productId
                          );
                        }
                      }

                      // Get the returned item price to compare
                      let autoType = "same";
                      if (item.price > 0 && returnedItemPrice > 0) {
                        if (item.price < returnedItemPrice) {
                          autoType = "cheaper";
                        } else if (item.price > returnedItemPrice) {
                          autoType = "expensive";
                        }
                      }

                      return (
                      <div key={idx} className="bg-slate-700/30 p-3 rounded border border-slate-600 space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Replacement Product {autoType === "same" && <span className="text-blue-400">(Same Product Only)</span>}
                          </label>
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input
                              type="text"
                              value={replacementSearches[idx] || ""}
                              onChange={(e) => {
                                setReplacementSearches({ ...replacementSearches, [idx]: e.target.value });
                                setShowReplacementDropdowns({ ...showReplacementDropdowns, [idx]: true });
                              }}
                              onFocus={() => setShowReplacementDropdowns({ ...showReplacementDropdowns, [idx]: true })}
                              placeholder={autoType === "same" ? "Only same product available..." : "Search from inventory..."}
                              className="w-full pl-7 pr-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                            {showReplacementDropdowns[idx] && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-600 border border-slate-500 rounded shadow-lg z-10 max-h-40 overflow-auto">
                                {filteredReplacementProducts.length === 0 ? (
                                  <div className="p-2 text-slate-400 text-xs">
                                    {autoType === "same" ? "Same product not available" : "No products found"}
                                  </div>
                                ) : (
                                  filteredReplacementProducts.map((p) => (
                                    <button
                                      key={p._id}
                                      onClick={() => {
                                        const updated = [...replacementItems];
                                        updated[idx].productId = p._id;
                                        updated[idx].productName = p.name;
                                        updated[idx].price = p.price;
                                        setReplacementItems(updated);
                                        setReplacementSearches({ ...replacementSearches, [idx]: p.name });
                                        setShowReplacementDropdowns({ ...showReplacementDropdowns, [idx]: false });
                                        // Auto-calculate price adjustment when replacement item is selected
                                        if (returnType === "replacement") {
                                          const newAdjustment = calculateAutoAdjustment();
                                          setPriceAdjustment(newAdjustment);
                                        }
                                      }}
                                      className="w-full text-left px-2 py-1 hover:bg-slate-500 border-b border-slate-500 last:border-0 text-white text-sm transition-colors"
                                    >
                                      {p.name} - Rs {p.price.toFixed(2)}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Price</label>
                            <input
                              type="number"
                              value={item.price}
                              disabled
                              className="w-full px-2 py-1 bg-slate-700 border border-slate-500 rounded text-slate-400 text-sm opacity-60"
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Qty {returnedItem && <span className="text-slate-400">/ {returnedItem.quantity}</span>}</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 1;
                                const updated = [...replacementItems];
                                // Restrict to returned item quantity for same product
                                if (autoType === "same" && returnedItem) {
                                  updated[idx].quantity = Math.min(Math.max(1, newQty), returnedItem.quantity);
                                } else {
                                  updated[idx].quantity = Math.max(1, newQty);
                                }
                                setReplacementItems(updated);
                              }}
                              min="1"
                              max={autoType === "same" && returnedItem ? returnedItem.quantity : undefined}
                              className={`w-full px-2 py-1 bg-slate-600 border rounded text-white text-sm focus:outline-none focus:border-blue-500 ${item.quantity > (returnedItem?.quantity || 0) && autoType === "same" ? "border-red-500" : "border-slate-500"}`}
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => handleRemoveReplacementItem(idx)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">Type (Auto-detected)</label>
                          <div className="px-2 py-1 bg-slate-700 border border-slate-500 rounded text-white text-sm">
                            {autoType === "same" && "Same Price"}
                            {autoType === "cheaper" && "Cheaper Alternative"}
                            {autoType === "expensive" && "Premium Alternative"}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Adjustment */}
              <div className={`border-t pt-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                <div className="flex justify-between items-center mb-2">
                  <label className={`font-semibold text-sm ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {returnType === "refund" ? "Refund Deduction" : "Price Adjustment"}
                  </label>
                  {returnType === "replacement" && (
                    <button
                      onClick={() => setPriceAdjustment(0)}
                      className={`text-xs ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={priceAdjustment}
                  onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
                <div className="text-xs text-slate-400 mt-2 space-y-1">
                  {returnType === "refund" ? (
                    <>
                      <p>Refund Amount: Rs {returnItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0).toFixed(2)}</p>
                      <p className="text-red-400 font-semibold">Deduction: Rs {priceAdjustment.toFixed(2)}</p>
                      <p className="text-emerald-400 font-semibold">Final Refund: Rs {(returnItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0) - priceAdjustment).toFixed(2)}</p>
                      <p className="text-slate-500">Enter deduction amount (e.g., 2.50 to deduct Rs 2.50 from refund)</p>
                    </>
                  ) : (
                    <>
                      <p>Returned Total: Rs {returnItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0).toFixed(2)}</p>
                      <p>Replacement Total: Rs {replacementItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
                      <p className="text-blue-400 font-semibold">Auto Value: Rs {calculateAutoAdjustment().toFixed(2)}</p>
                      <p className="text-slate-500">Positive = customer pays more, Negative = customer gets credit</p>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className={`border-t pt-4 ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                <label className={`font-semibold text-sm block mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              {/* Summary */}
              <div className={`p-4 rounded-lg border space-y-3 ${isDarkTheme ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                <div className={`text-xs font-semibold uppercase tracking-wide ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Summary</div>
                
                <div className="space-y-2">
                  {returnType === "refund" ? (
                    <>
                      <div className={`flex justify-between ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="flex items-center gap-1">
                          <span className="text-red-400">↓</span> Returned Items ({returnItems.length}):
                        </span>
                        <span className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Rs {returnTotal.toFixed(2)}</span>
                      </div>
                      
                      {priceAdjustment > 0 && (
                        <div className={`flex justify-between ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400">✂</span> Deduction:
                          </span>
                          <span className="font-bold text-red-400">-Rs {priceAdjustment.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  ) : returnType === "replacement" ? (
                    <>
                      <div className={`flex justify-between ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="flex items-center gap-1">
                          <span className="text-red-400">↓</span> Returned Items ({returnItems.length}):
                        </span>
                        <span className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Rs {returnTotal.toFixed(2)}</span>
                      </div>
                      
                      <div className={`flex justify-between ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="flex items-center gap-1">
                          <span className="text-blue-400">↑</span> Replacement Items ({replacementItems.length}):
                        </span>
                        <span className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Rs {replacementTotal.toFixed(2)}</span>
                      </div>
                      
                      {priceAdjustment !== 0 && (
                        <div className={`flex justify-between ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400">⚙</span> Adjustment:
                          </span>
                          <span className={`font-bold ${priceAdjustment > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {priceAdjustment > 0 ? "+" : ""}{priceAdjustment.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
                
                <div className={`border-t pt-3 flex justify-between items-center ${isDarkTheme ? 'border-slate-500' : 'border-slate-300'}`}>
                  <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    {returnType === "refund" ? "Final Refund:" : "Net Amount:"}
                  </span>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      returnType === "refund" 
                        ? "text-emerald-400" 
                        : netAdjustment > 0 
                          ? "text-emerald-400" 
                          : netAdjustment < 0 
                            ? "text-red-400" 
                            : "text-slate-300"
                    }`}>
                      {returnType === "refund" 
                        ? `Rs ${(returnTotal - priceAdjustment).toFixed(2)}`
                        : netAdjustment > 0
                          ? `Rs ${netAdjustment.toFixed(2)}`
                          : `${netAdjustment < 0 ? "-" : ""}Rs ${Math.abs(netAdjustment).toFixed(2)}`
                      }
                    </div>
                    <div className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      {returnType === "refund" && "Amount to refund customer"}
                      {returnType === "replacement" && (
                        <>
                          {netAdjustment > 0 && "Customer gets refund"}
                          {netAdjustment < 0 && "Customer pays additional"}
                          {netAdjustment === 0 && "No adjustment needed"}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === "create" && (
          <div className={`border-t p-6 flex gap-3 justify-end ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateReturn}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
