import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Package, Scan, CheckCircle, Minus, Plus, Save, X, User, Calendar, Box, Barcode
} from "lucide-react";
import { useNotifications } from "@/utils/notifications";
import { formatCurrencyNew } from "@/utils";
import { useElectronApi } from "@/hooks/useElectronApi";

interface PurchaseOrder {
  _id: string;
  po_number: string;
  vendor: { _id: string; name: string };
  items: Array<{
    product: { _id: string; name: string };
    quantity: number;
    unit_price: number;
  }>;
  status: string;
  order_date: string;
  total_amount: number;
}

interface ReceivingItem {
  product_id: string;
  product_name: string;
  sku: string;
  barcodes: string[]; // Array of barcodes for each received item
  ordered_quantity: number;
  received_quantity: number;
  damaged_quantity: number;
  unit_price: number;
  expiry_date?: string;
  lot_number?: string;
}

export default function GoodsReceiptPage() {
  const navigate = useNavigate();
  const notify = useNotifications();
  const { get, post } = useElectronApi();
  const [isDarkTheme] = useState(() => localStorage.getItem("theme") === "dark" || !localStorage.getItem("theme"));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lotNumbers, setLotNumbers] = useState<any[]>([]);
  // Serial numbers removed - not needed for this workflow

  useEffect(() => {
    fetchPendingPOs();
    fetchLotNumbers();
  }, []);

  const fetchPendingPOs = async () => {
    try {
      const data = await get("/api/purchase-orders/enriched?status=received");
      setPurchaseOrders(data);
    } catch (error) {
      notify.error("Failed to load purchase orders");
    }
  };

  const fetchLotNumbers = async () => {
    try {
      const data = await get("/api/inventory/lot-numbers");
      setLotNumbers(data);
    } catch (error) {
      console.error("Failed to load lot numbers:", error);
    }
  };

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const items: ReceivingItem[] = po.items
      .filter((item) => item && item.product && item.quantity > 0)
      .map((item) => ({
        product_id: item.product._id || "",
        product_name: item.product.name || "Unknown Product",
        sku: item.product._id || "", // Use product ID as SKU fallback
        barcodes: [],
        ordered_quantity: Number(item.quantity) || 0,
        received_quantity: 0,
        damaged_quantity: 0,
        unit_price: Number(item.unit_price) || 0,
      }));
    setReceivingItems(items);
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const itemIndex = receivingItems.findIndex(
      (item) => item.sku === scanInput
    );
    if (itemIndex !== -1) {
      const updatedItems = [...receivingItems];
      if (updatedItems[itemIndex].received_quantity < updatedItems[itemIndex].ordered_quantity) {
        updatedItems[itemIndex].received_quantity += 1;
        // Add barcode to array
        updatedItems[itemIndex].barcodes.push(scanInput.trim());
        setReceivingItems(updatedItems);
        notify.success(`Scanned: ${updatedItems[itemIndex].product_name} (${updatedItems[itemIndex].received_quantity}/${updatedItems[itemIndex].ordered_quantity})`);
      } else {
        notify.warning("All items already received");
      }
    } else {
      notify.error("Product not found in this PO");
    }
    setScanInput("");
  };

  // Generate barcode range (e.g., "0001-00100" generates 0001 to 0100)
  const generateBarcodeRange = (itemIndex: number, rangeInput: string) => {
    const parts = rangeInput.split("-");
    if (parts.length !== 2) {
      notify.error("Invalid format. Use: 0001-00100");
      return;
    }
    
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    
    if (isNaN(start) || isNaN(end) || start > end) {
      notify.error("Invalid range. Start must be less than or equal to end.");
      return;
    }
    
    const count = end - start + 1;
    const updatedItems = [...receivingItems];
    const item = updatedItems[itemIndex];
    
    // Check if we have enough quantity
    if (count > item.ordered_quantity) {
      notify.error(`Range count (${count}) exceeds ordered quantity (${item.ordered_quantity})`);
      return;
    }
    
    // Generate barcodes
    const barcodes: string[] = [];
    const padLength = parts[0].length;
    for (let i = start; i <= end; i++) {
      barcodes.push(String(i).padStart(padLength, "0"));
    }
    
    item.barcodes = barcodes;
    item.received_quantity = count;
    setReceivingItems(updatedItems);
    notify.success(`Generated ${count} barcodes (${parts[0]} to ${parts[1]})`);
  };

  // Add single barcode
  const handleAddBarcode = (itemIndex: number, barcode: string) => {
    if (!barcode.trim()) return;
    const updatedItems = [...receivingItems];
    if (updatedItems[itemIndex].received_quantity < updatedItems[itemIndex].ordered_quantity) {
      updatedItems[itemIndex].barcodes.push(barcode.trim());
      updatedItems[itemIndex].received_quantity += 1;
      setReceivingItems(updatedItems);
      notify.success("Barcode added");
    } else {
      notify.warning("All items already received");
    }
  };

  // Remove barcode
  const handleRemoveBarcode = (itemIndex: number, barcodeIndex: number) => {
    const updatedItems = [...receivingItems];
    updatedItems[itemIndex].barcodes.splice(barcodeIndex, 1);
    updatedItems[itemIndex].received_quantity = Math.max(0, updatedItems[itemIndex].received_quantity - 1);
    setReceivingItems(updatedItems);
  };

  const updateReceivedQty = (index: number, delta: number) => {
    const updatedItems = [...receivingItems];
    const newQty = updatedItems[index].received_quantity + delta;
    if (newQty >= 0 && newQty <= updatedItems[index].ordered_quantity) {
      updatedItems[index].received_quantity = newQty;
      setReceivingItems(updatedItems);
    }
  };

  const updateDamagedQty = (index: number, delta: number) => {
    const updatedItems = [...receivingItems];
    const newQty = updatedItems[index].damaged_quantity + delta;
    const maxDamaged = updatedItems[index].received_quantity;
    if (newQty >= 0 && newQty <= maxDamaged) {
      updatedItems[index].damaged_quantity = newQty;
      setReceivingItems(updatedItems);
    }
  };

  // Serial number functions removed - not needed for this workflow

  const handleCompleteReceipt = async () => {
    if (!selectedPO) return;
    const hasReceivedItems = receivingItems.some((item) => item.received_quantity > 0);
    if (!hasReceivedItems) {
      notify.warning("Please receive at least one item");
      return;
    }
    setLoading(true);
    try {
      const grData = {
        po_id: selectedPO._id,
        items: receivingItems
          .filter((item) => item.received_quantity > 0)
          .map((item, index) => ({
            po_item_index: index,
            product_id: item.product_id,
            received_quantity: item.received_quantity,
            damaged_quantity: item.damaged_quantity,
            expiry_date: item.expiry_date || undefined,
            lot_number: item.lot_number || undefined,
            barcodes: item.barcodes.length > 0 ? item.barcodes : undefined,
          })),
        notes: `Received by staff at ${new Date().toLocaleString()}`,
      };
      await post("/api/goods-receipts", grData);
      notify.success("Goods receipt completed successfully!");
      setSelectedPO(null);
      setReceivingItems([]);
      fetchPendingPOs();
    } catch (error: any) {
      notify.error(error.message || "Failed to create goods receipt");
    } finally {
      setLoading(false);
    }
  };

  const totalOrdered = receivingItems.reduce((sum, item) => sum + item.ordered_quantity, 0);
  const totalReceived = receivingItems.reduce((sum, item) => sum + item.received_quantity, 0);
  const totalDamaged = receivingItems.reduce((sum, item) => sum + item.damaged_quantity, 0);
  const receiptValue = receivingItems.reduce((sum, item) => sum + item.received_quantity * item.unit_price, 0);

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/")} className={`p-2 rounded-lg ${isDarkTheme ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Goods Receipt</h1>
                <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Receive inventory from purchase orders</p>
              </div>
            </div>
            {selectedPO && (
              <div className={`text-right ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="text-sm font-medium">PO: {selectedPO.po_number}</div>
                <div className="text-xs">{selectedPO.vendor.name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!selectedPO ? (
          <div className={`${isDarkTheme ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Select Purchase Order</h2>
            <div className="space-y-3">
              {purchaseOrders.length === 0 ? (
                <div className={`text-center py-8 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending purchase orders</p>
                </div>
              ) : (
                purchaseOrders.map((po) => (
                  <button key={po._id} onClick={() => handleSelectPO(po)}
                    className={`w-full text-left p-4 rounded-lg border ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{po.po_number}</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{po.status}</span>
                        </div>
                        <div className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'} space-y-1`}>
                          <div className="flex items-center gap-2"><User className="w-4 h-4" />{po.vendor.name}</div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Order: {new Date(po.order_date).toLocaleDateString()}</div>
                          <div className="flex items-center gap-2"><Box className="w-4 h-4" />{po.items.length} items</div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrencyNew(po.total_amount)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className={`${isDarkTheme ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <div className="flex items-center gap-3 mb-4">
                  <Scan className="w-5 h-5 text-blue-400" />
                  <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Scan Products</h3>
                </div>
                <form onSubmit={handleScan} className="flex gap-2">
                  <input type="text" value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Scan barcode or enter SKU..." autoFocus
                    className={`flex-1 px-4 py-3 rounded-lg border ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Scan</button>
                </form>
              </div>

              <div className={`${isDarkTheme ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Items to Receive</h3>
                <div className="space-y-3">
                  {receivingItems.map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${item.received_quantity === item.ordered_quantity ? (isDarkTheme ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200') : (isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200')}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.product_name}</h4>
                            {item.received_quantity === item.ordered_quantity && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <div className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>SKU: {item.sku} • Barcodes: {item.barcodes.length}</div>
                        </div>
                        <div className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{formatCurrencyNew(item.unit_price)} each</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`text-xs font-medium mb-2 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Received</label>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateReceivedQty(index, -1)} className={`p-2 rounded ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}><Minus className="w-4 h-4" /></button>
                            <div className={`flex-1 text-center font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.received_quantity} / {item.ordered_quantity}</div>
                            <button onClick={() => updateReceivedQty(index, 1)} className={`p-2 rounded ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div>
                          <label className={`text-xs font-medium mb-2 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Damaged</label>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateDamagedQty(index, -1)} className={`p-2 rounded ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}><Minus className="w-4 h-4" /></button>
                            <div className={`flex-1 text-center font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{item.damaged_quantity}</div>
                            <button onClick={() => updateDamagedQty(index, 1)} className={`p-2 rounded ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>

                      {item.received_quantity > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600 space-y-3">
                          {/* Barcode Range Input */}
                          <div>
                            <label className={`text-xs font-medium mb-1 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Barcode Range (e.g., 0001-00100)</label>
                            <div className="flex gap-2">
                              <input type="text" placeholder="0001-00100" onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  generateBarcodeRange(index, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                                className={`flex-1 px-3 py-2 rounded border text-sm ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`} />
                              <button onClick={(e) => {
                                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                generateBarcodeRange(index, input.value);
                                input.value = '';
                              }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">Generate</button>
                            </div>
                          </div>

                          {/* Barcode List */}
                          {item.barcodes.length > 0 && (
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Scanned Barcodes ({item.barcodes.length})</label>
                              <div className={`max-h-32 overflow-y-auto rounded border ${isDarkTheme ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-300'} p-2 space-y-1`}>
                                {item.barcodes.map((barcode, bIdx) => (
                                  <div key={bIdx} className="flex items-center justify-between text-sm">
                                    <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>{barcode}</span>
                                    <button onClick={() => handleRemoveBarcode(index, bIdx)} className="text-red-500 hover:text-red-700">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Other Fields */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Expiry Date</label>
                              <input type="date" value={item.expiry_date || ""} onChange={(e) => { const updated = [...receivingItems]; updated[index].expiry_date = e.target.value; setReceivingItems(updated); }}
                                className={`w-full px-3 py-2 rounded border text-sm ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                            </div>
                            <div>
                              <label className={`text-xs font-medium mb-1 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Lot Number</label>
                              <select value={item.lot_number || ""} onChange={(e) => { const updated = [...receivingItems]; updated[index].lot_number = e.target.value; setReceivingItems(updated); }}
                                className={`w-full px-3 py-2 rounded border text-sm ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                                <option value="">Select or enter lot number</option>
                                {lotNumbers.map((lot) => (
                                  <option key={lot._id} value={lot.lot_number}>{lot.lot_number}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {/* Manual Lot Number Input */}
                          <div>
                            <label className={`text-xs font-medium mb-1 block ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>Or Enter New Lot Number</label>
                            <input type="text" value={item.lot_number || ""} onChange={(e) => { const updated = [...receivingItems]; updated[index].lot_number = e.target.value; setReceivingItems(updated); }} placeholder="Enter new lot number manually"
                              className={`w-full px-3 py-2 rounded border text-sm ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`${isDarkTheme ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <h3 className={`font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Receipt Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Ordered:</span><span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{totalOrdered} items</span></div>
                  <div className="flex justify-between"><span className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Received:</span><span className={`font-semibold ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>{totalReceived} items</span></div>
                  <div className="flex justify-between"><span className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Damaged:</span><span className={`font-semibold ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>{totalDamaged} items</span></div>
                  <div className={`pt-3 border-t ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="flex justify-between"><span className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Value:</span><span className={`text-lg font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{formatCurrencyNew(receiptValue)}</span></div>
                  </div>
                </div>
              </div>

              <div className={`${isDarkTheme ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
                <h3 className={`font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>{totalReceived} of {totalOrdered} items</span>
                    <span className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button onClick={handleCompleteReceipt} disabled={loading || totalReceived === 0}
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />{loading ? "Processing..." : "Complete Receipt"}
                </button>
                <button onClick={() => { setSelectedPO(null); setReceivingItems([]); }}
                  className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}>
                  <X className="w-5 h-5" />Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Serial modal removed - not needed for this workflow */}
    </div>
  );
}
