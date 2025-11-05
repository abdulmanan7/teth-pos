import { useEffect, useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ToastManager";
import type { Order } from "@shared/api";

interface ThermalReceiptProps {
  order: Order;
  brandingConfig?: {
    storeName: string;
    phone: string;
    city: string;
    email?: string;
  };
  onClose: () => void;
}

export default function ThermalReceipt({ order, brandingConfig, onClose }: ThermalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Black Copper 97 model thermal printer width (88mm = ~420px at 96dpi)
  const RECEIPT_WIDTH = 420;

  useEffect(() => {
    // Auto-print on component mount
    setTimeout(() => {
      handlePrint();
    }, 500);
  }, []);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "", "height=600,width=500");
      if (printWindow) {
        // Get the full HTML including styles
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Receipt ${order.orderNumber}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', Courier, monospace; 
                width: ${RECEIPT_WIDTH}px; 
                padding: 16px; 
                background: white; 
                color: black;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @media print {
                body { width: 80mm; padding: 8px; }
                @page { size: 80mm auto; margin: 0; }
              }
            </style>
          </head>
          <body>
            ${receiptRef.current.innerHTML}
          </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const formatCurrency = (amount: number) => {
    // Format as Rs.100.00 instead of Rs 100.00
    return `Rs.${amount.toFixed(2)}`;
  };

  const formatDate = (date: string | Date | undefined) => {
    try {
      if (!date) return "N/A";
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "N/A";
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "N/A";
    }
  };

  // Validate order data
  if (!order || !order.orderNumber) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
          <p className="text-red-600 font-bold mb-4">Error: Invalid order data</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const deriveNumber = (value: any, fallback: number = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const itemSubtotalSum = Array.isArray(order.items)
    ? order.items.reduce((sum, item) => {
        const base = deriveNumber(item.subtotal, item.price * item.quantity);
        return sum + base;
      }, 0)
    : 0;

  const subtotal = deriveNumber(order.subtotal, itemSubtotalSum);
  const itemDiscountTotal = deriveNumber(order.itemDiscountTotal);
  const checkoutDiscountAmount = deriveNumber(order.checkoutDiscountAmount);
  const subtotalAfterDiscount = deriveNumber(
    (order as any).subtotalAfterDiscount,
    subtotal - itemDiscountTotal
  );
  const preTaxTotal = deriveNumber(
    (order as any).totalBeforeTax,
    subtotalAfterDiscount - checkoutDiscountAmount
  );
  const taxAmount = deriveNumber(order.taxAmount, deriveNumber((order as any).tax));
  const grandTotal = deriveNumber(order.total, preTaxTotal + taxAmount);

  const hasItemDiscounts = itemDiscountTotal > 0.009;
  const hasCheckoutDiscount = checkoutDiscountAmount > 0.009;
  const hasTax = taxAmount > 0.009;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-slate-900">Receipt Preview</h2>
          <button
            onClick={() => {
              addToast("Order completed successfully!", "success", 5000);
              onClose();
            }}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="overflow-auto max-h-[75vh] p-6">
          <div
            ref={receiptRef}
            style={{
              width: `${RECEIPT_WIDTH}px`,
              margin: "0 auto",
              fontFamily: "monospace",
              fontSize: "11px",
              lineHeight: "1.4",
              color: "black",
              backgroundColor: "white",
              padding: "16px",
              textAlign: "center",
            }}
          >
            {/* Logo - Inline SVG for reliable printing */}
            <div style={{ marginBottom: "12px", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <svg width="120" height="30" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Icon */}
                <g clipPath="url(#clip0_101_2)">
                  <path d="M12 0H24V12H36V24H24V36H12V24H0V12H12V0Z" fill="black"/>
                  <path d="M24 24H36V36H24V24Z" fill="black"/>
                  <path d="M12 12H24V24H12V12Z" fill="black"/>
                </g>
                {/* Wordmark */}
                <text x="50" y="35" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="36" fill="black">teth</text>
                <defs>
                  <clipPath id="clip0_101_2">
                    <rect width="36" height="36" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>

            {/* Store Information */}
            {brandingConfig && (
              <div style={{ marginBottom: "12px", borderBottom: "1px dashed black", paddingBottom: "8px", textAlign: "center" }}>
                <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}>
                  {brandingConfig.storeName}
                </div>
                <div style={{ fontSize: "10px" }}>{brandingConfig.phone}</div>
                <div style={{ fontSize: "10px" }}>{brandingConfig.city}</div>
                {brandingConfig.email && <div style={{ fontSize: "10px" }}>{brandingConfig.email}</div>}
              </div>
            )}

            {/* Receipt Title */}
            <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "8px" }}>
              SALES RECEIPT
            </div>

            {/* Receipt Details */}
            <div style={{ marginBottom: "12px", fontSize: "10px", borderBottom: "1px dashed black", paddingBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Receipt #:</span>
                <span>{order.orderNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Date:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Customer:</span>
                <span>{order.customer}</span>
              </div>
              {order.staffName && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span>Cashier:</span>
                  <span>{order.staffName}</span>
                </div>
              )}
            </div>

            {/* Items Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "10px",
                marginBottom: "8px",
                borderBottom: "1px solid black",
                paddingBottom: "4px",
              }}
            >
              <span style={{ flex: 1, textAlign: "left" }}>Item</span>
              <span style={{ width: "40px", textAlign: "center" }}>Qty</span>
              <span style={{ width: "50px", textAlign: "right" }}>Price</span>
              <span style={{ width: "50px", textAlign: "right" }}>Total</span>
            </div>

            {/* Items */}
            <div style={{ marginBottom: "12px" }}>
              {order.items && order.items.length > 0 ? order.items.map((item, index) => {
                const quantity = deriveNumber(item.quantity, 1);
                const unitPrice = deriveNumber(item.price);
                const rawSubtotal = deriveNumber(item.subtotal, unitPrice * quantity);
                const lineDiscount = deriveNumber(item.discountAmount);
                const lineTotal = deriveNumber(item.totalAfterDiscount, rawSubtotal - lineDiscount);
                const effectiveUnitPrice = quantity > 0 ? lineTotal / quantity : unitPrice;

                return (
                  <div key={index} style={{ marginBottom: "6px", fontSize: "10px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "#222",
                      }}
                    >
                      <span style={{ flex: 1, textAlign: "left", fontWeight: "bold" }}>{item.name}</span>
                      <span style={{ width: "40px", textAlign: "center" }}>{quantity % 1 === 0 ? quantity : quantity.toFixed(2)}</span>
                      <span style={{ width: "50px", textAlign: "right" }}>{formatCurrency(effectiveUnitPrice)}</span>
                      <span style={{ width: "50px", textAlign: "right" }}>{formatCurrency(lineTotal)}</span>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: "center", fontSize: "10px", color: "#666" }}>
                  No items
                </div>
              )}
            </div>

            {/* Totals */}
            <div
              style={{
                borderTop: "1px solid black",
                borderBottom: "1px dashed black",
                paddingTop: "8px",
                paddingBottom: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  marginBottom: "3px",
                }}
              >
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {hasItemDiscounts && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      marginBottom: "3px",
                      color: "#b91c1c",
                    }}
                  >
                    <span>Item Discounts</span>
                    <span>-{formatCurrency(itemDiscountTotal)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                      marginBottom: "3px",
                    }}
                  >
                    <span>After Item Discounts</span>
                    <span>{formatCurrency(subtotalAfterDiscount)}</span>
                  </div>
                </>
              )}
              {hasCheckoutDiscount && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    marginBottom: "3px",
                    color: "#b91c1c",
                  }}
                >
                  <span>
                    Checkout Discount
                    {order.checkoutDiscount?.type === "percentage"
                      ? ` (${order.checkoutDiscount.value}%)`
                      : ""}
                  </span>
                  <span>-{formatCurrency(checkoutDiscountAmount)}</span>
                </div>
              )}
              {(hasItemDiscounts || hasCheckoutDiscount) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    marginBottom: "3px",
                  }}
                >
                  <span>Taxable Amount</span>
                  <span>{formatCurrency(preTaxTotal)}</span>
                </div>
              )}
              {hasTax && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    marginBottom: "3px",
                  }}
                >
                  <span>Tax</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                <span>TOTAL DUE</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
              {order.paymentMethod && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                  <span>Payment:</span>
                  <span style={{ textTransform: "capitalize" }}>{order.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ fontSize: "9px", color: "#666", marginBottom: "8px" }}>
              <div style={{ marginBottom: "4px" }}>Thank you for your purchase!</div>
              <div>Please visit us again</div>
            </div>

            {/* Timestamp */}
            <div style={{ fontSize: "8px", color: "#999", borderTop: "1px dashed black", paddingTop: "8px" }}>
              {formatDate(new Date())}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t p-4 flex gap-2">
          <Button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
          <Button
            onClick={() => {
              addToast("Order completed successfully!", "success", 5000);
              onClose();
            }}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
