import type { Order } from "@shared/api";

export interface BrandingConfigForReceipt {
  storeName: string;
  phone: string;
  city: string;
  email?: string;
}

/**
 * Generate thermal receipt HTML for printing
 * Optimized for 88mm thermal printers (Black Copper 97 model printer)
 */
export function generateThermalReceiptHTML(
  order: Order,
  branding: BrandingConfigForReceipt,
): string {
  const RECEIPT_WIDTH = 420; // 88mm at 96dpi

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(amount);
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

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${order.orderNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: monospace;
          width: ${RECEIPT_WIDTH}px;
          padding: 16px;
          background: white;
          color: black;
        }
        .receipt {
          width: 100%;
          text-align: center;
          font-size: 11px;
          line-height: 1.4;
        }
        .logo {
          width: 100px;
          height: auto;
          margin: 0 auto 12px;
          display: block;
        }
        .store-info {
          margin-bottom: 12px;
          border-bottom: 1px dashed black;
          padding-bottom: 8px;
        }
        .store-name {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .store-detail {
          font-size: 10px;
        }
        .receipt-title {
          font-weight: bold;
          font-size: 12px;
          margin: 8px 0;
        }
        .receipt-details {
          margin-bottom: 12px;
          font-size: 10px;
          border-bottom: 1px dashed black;
          padding-bottom: 8px;
          text-align: left;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .items-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 8px;
          border-bottom: 1px solid black;
          padding-bottom: 4px;
        }
        .item-col-name {
          flex: 1;
          text-align: left;
        }
        .item-col-qty {
          width: 40px;
          text-align: center;
        }
        .item-col-price {
          width: 50px;
          text-align: right;
        }
        .item-col-total {
          width: 50px;
          text-align: right;
        }
        .items-list {
          margin-bottom: 12px;
        }
        .item {
          margin-bottom: 6px;
          font-size: 10px;
        }
        .item-name {
          text-align: left;
          margin-bottom: 2px;
        }
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #666;
        }
        .totals {
          border-top: 1px solid black;
          border-bottom: 1px dashed black;
          padding: 8px 0;
          margin-bottom: 12px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
        }
        .footer {
          font-size: 9px;
          color: #666;
          margin-bottom: 8px;
        }
        .timestamp {
          font-size: 8px;
          color: #999;
          border-top: 1px dashed black;
          padding-top: 8px;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .receipt {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Logo - Inline SVG for reliable printing -->
        <svg width="120" height="30" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo">
          <g clipPath="url(#clip0_101_2)">
            <path d="M12 0H24V12H36V24H24V36H12V24H0V12H12V0Z" fill="black"/>
            <path d="M24 24H36V36H24V24Z" fill="black"/>
            <path d="M12 12H24V24H12V12Z" fill="black"/>
          </g>
          <text x="50" y="35" font-family="Arial, sans-serif" font-weight="bold" font-size="36" fill="black">teth</text>
          <defs>
            <clipPath id="clip0_101_2">
              <rect width="36" height="36" fill="white"/>
            </clipPath>
          </defs>
        </svg>

        <!-- Store Information -->
        <div class="store-info">
          <div class="store-name">${branding.storeName}</div>
          <div class="store-detail">${branding.phone}</div>
          <div class="store-detail">${branding.city}</div>
          ${branding.email ? `<div class="store-detail">${branding.email}</div>` : ""}
        </div>

        <!-- Receipt Title -->
        <div class="receipt-title">SALES RECEIPT</div>

        <!-- Receipt Details -->
        <div class="receipt-details">
          <div class="detail-row">
            <span>Receipt #:</span>
            <span>${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span>Date:</span>
            <span>${formatDate(order.createdAt)}</span>
          </div>
          <div class="detail-row">
            <span>Customer:</span>
            <span>${order.customer}</span>
          </div>
          ${
            order.staffName
              ? `
            <div class="detail-row">
              <span>Cashier:</span>
              <span>${order.staffName}</span>
            </div>
          `
              : ""
          }
        </div>

        <!-- Items Header -->
        <div class="items-header">
          <span class="item-col-name">Item</span>
          <span class="item-col-qty">Qty</span>
          <span class="item-col-price">Price</span>
          <span class="item-col-total">Total</span>
        </div>

        <!-- Items -->
        <div class="items-list">
          ${order.items
            .map(
              (item) => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                <span></span>
                <span class="item-col-qty">${item.quantity}</span>
                <span class="item-col-price">${formatCurrency(item.price)}</span>
                <span class="item-col-total">${formatCurrency(item.price * item.quantity)}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>

        <!-- Totals -->
        <div class="totals">
          <div class="total-row">
            <span>TOTAL:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
          ${
            order.paymentMethod
              ? `
            <div class="payment-row">
              <span>Payment:</span>
              <span>${order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}</span>
            </div>
          `
              : ""
          }
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>Thank you for your purchase!</div>
          <div>Please visit us again</div>
        </div>

        <!-- Timestamp -->
        <div class="timestamp">${formatDate(new Date())}</div>
      </div>
    </body>
    </html>
  `;

  return receiptHTML;
}

/**
 * Print thermal receipt
 */
export function printThermalReceipt(html: string) {
  const printWindow = window.open("", "", "height=600,width=400");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }
}
