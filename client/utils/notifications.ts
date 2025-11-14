/**
 * Notification utility for consistent toast messages across the app
 * Uses the ToastManager component for beautiful notifications
 *
 * Usage: Call useNotifications() hook in React components
 * No need to click - toasts auto-dismiss after duration
 *
 * Example:
 * const notify = useNotifications();
 * notify.success("Order completed!");
 * notify.error("Failed to save");
 */

import { useToast } from "@/components/ToastManager";

/**
 * Hook to use notifications in React components
 * Provides simple methods for success, error, warning, and info messages
 */
export const useNotifications = () => {
  const { addToast } = useToast();

  return {
    /**
     * Show login required message
     */
    loginRequired: (action: string) => {
      addToast(`Please login first to ${action}`, "warning", 3000);
    },

    /**
     * Show empty cart message
     */
    emptyCart: () => {
      addToast("Please add items to cart", "warning", 3000);
    },

    /**
     * Show empty draft message
     */
    emptyDraft: () => {
      addToast("Please add items to draft", "warning", 3000);
    },

    /**
     * Show error message
     */
    error: (message: string) => {
      addToast(`Error: ${message}`, "error", 4000);
    },

    /**
     * Show success message
     */
    success: (message: string) => {
      addToast(message, "success", 3000);
    },

    /**
     * Show info message
     */
    info: (message: string) => {
      addToast(message, "info", 3000);
    },

    /**
     * Show warning message
     */
    warning: (message: string) => {
      addToast(message, "warning", 3000);
    },

    /**
     * Show order completion message
     */
    orderComplete: (
      orderNumber: string,
      customer: string,
      total: string,
      staff: string,
    ) => {
      addToast(
        `Order #${orderNumber} completed! Customer: ${customer}, Total: Rs ${total}`,
        "success",
        5000,
      );
    },

    /**
     * Show draft saved message
     */
    draftSaved: () => {
      addToast(
        "Order saved as draft! Ready for next customer.",
        "success",
        3000,
      );
    },
  };
};
