import { RotateCcw, Trash2 } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface DraftOrder {
  id: string;
  customer: string;
  items: CartItem[];
  createdAt: string;
  total: number;
}

interface ResumeOrderModalProps {
  isDarkTheme: boolean;
  draftOrders: DraftOrder[];
  onResume: (draft: DraftOrder) => void;
  onClose: () => void;
}

export default function ResumeOrderModal({
  isDarkTheme,
  draftOrders,
  onResume,
  onClose,
}: ResumeOrderModalProps) {
  const deleteDraft = (id: string) => {
    const saved = localStorage.getItem("draftOrders");
    if (saved) {
      const drafts = JSON.parse(saved) as DraftOrder[];
      const updated = drafts.filter((d) => d.id !== id);
      localStorage.setItem("draftOrders", JSON.stringify(updated));
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg border shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Resume Draft Order</h2>
          <button
            onClick={onClose}
            className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {draftOrders.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw className={`w-12 h-12 mx-auto mb-4 opacity-50 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
              <p className={`font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                No draft orders saved
              </p>
              <p className={`text-sm mt-2 ${isDarkTheme ? 'text-slate-500' : 'text-slate-600'}`}>
                Save an order as draft to resume it later
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftOrders.map((draft) => (
                <div
                  key={draft.id}
                  className={`p-4 border rounded-lg transition-colors ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {draft.customer}
                      </h3>
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        {draft.items.length} items • {draft.createdAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        Rs {draft.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {draft.items.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                      >
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>
                          Rs {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {draft.items.length > 3 && (
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        +{draft.items.length - 3} more items
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onResume(draft)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 inline mr-2" />
                      Resume
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t p-6 ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
