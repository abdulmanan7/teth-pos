/**
 * Custom hook for authentication checks
 */

import { useCallback } from "react";
import { showNotification } from "@/utils/notifications";

export interface UseAuthCheckProps {
  currentStaff: any;
  setActiveModal: (modal: string | null) => void;
}

/**
 * Hook to check authentication and redirect to login if needed
 */
export const useAuthCheck = ({
  currentStaff,
  setActiveModal,
}: UseAuthCheckProps) => {
  /**
   * Check if user is authenticated, show alert and redirect if not
   */
  const requireAuth = useCallback(
    (action: string): boolean => {
      if (!currentStaff) {
        showNotification.loginRequired(action);
        setActiveModal("security");
        return false;
      }
      return true;
    },
    [currentStaff, setActiveModal]
  );

  /**
   * Check if cart has items
   */
  const requireCartItems = useCallback(
    (items: any[]): boolean => {
      if (items.length === 0) {
        showNotification.emptyCart();
        return false;
      }
      return true;
    },
    []
  );

  /**
   * Check both auth and cart items
   */
  const requireAuthAndCart = useCallback(
    (items: any[], action: string): boolean => {
      if (!requireAuth(action)) return false;
      if (!requireCartItems(items)) return false;
      return true;
    },
    [requireAuth, requireCartItems]
  );

  return {
    requireAuth,
    requireCartItems,
    requireAuthAndCart,
    isAuthenticated: !!currentStaff,
  };
};
