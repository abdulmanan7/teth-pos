import { useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastManagerContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Create context
import { createContext, useContext } from "react";
const ToastContext = createContext<ToastManagerContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 4000) => {
      const id = Date.now().toString();
      const newToast: ToastMessage = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: "text-green-800",
          title: "text-green-900 font-semibold",
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          text: "text-red-800",
          title: "text-red-900 font-semibold",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          text: "text-yellow-800",
          title: "text-yellow-900 font-semibold",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          text: "text-blue-800",
          title: "text-blue-900 font-semibold",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`${styles.bg} border rounded-lg p-4 shadow-lg flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-300`}
    >
      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`${styles.title} text-sm`}>{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
