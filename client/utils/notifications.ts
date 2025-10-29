/**
 * Notification utility for consistent toast messages across the app
 * Uses the ToastManager component for beautiful notifications
 */

// Store reference to toast function (set by ToastProvider)
let toastFunction: ((message: string, type: "success" | "error" | "info" | "warning", duration?: number) => void) | null = null;

export const setToastFunction = (fn: (message: string, type: "success" | "error" | "info" | "warning", duration?: number) => void) => {
  toastFunction = fn;
};

const toast = (message: string, type: "success" | "error" | "info" | "warning" = "info", duration?: number) => {
  if (toastFunction) {
    toastFunction(message, type, duration);
  } else {
    // Fallback to alert if toast not initialized
    alert(message);
  }
};

export const showNotification = {
  /**
   * Show login required message
   */
  loginRequired: (action: string) => {
    toast(`Please login first to ${action}`, "warning", 3000);
  },

  /**
   * Show empty cart message
   */
  emptyCart: () => {
    toast("Please add items to cart", "warning", 3000);
  },

  /**
   * Show empty draft message
   */
  emptyDraft: () => {
    toast("Please add items to draft", "warning", 3000);
  },

  /**
   * Show error message
   */
  error: (message: string) => {
    toast(`Error: ${message}`, "error", 4000);
  },

  /**
   * Show success message
   */
  success: (message: string) => {
    toast(message, "success", 3000);
  },

  /**
   * Show info message
   */
  info: (message: string) => {
    toast(message, "info", 3000);
  },

  /**
   * Show order completion message
   */
  orderComplete: (orderNumber: string, customer: string, total: string, staff: string) => {
    toast(
      `Order #${orderNumber} completed! Customer: ${customer}, Total: Rs ${total}`,
      "success",
      5000
    );
  },

  /**
   * Show draft saved message
   */
  draftSaved: () => {
    toast("Order saved as draft! Ready for next customer.", "success", 3000);
  },
};
