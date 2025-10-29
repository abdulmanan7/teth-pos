import { useState } from "react";

interface StaffMember {
  id: number;
  name: string;
  role: string;
}

interface PaymentModalProps {
  total: number;
  customer: string;
  staff: StaffMember | null;
  onPayment: (method: string) => void;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", icon: "💵", description: "Pay with cash", svgIcon: "cash" },
  { id: "debit", name: "Debit Card", icon: "💳", description: "Debit card payment", svgIcon: "card" },
  { id: "credit", name: "Credit Card", icon: "💳", description: "Credit card payment", svgIcon: "card" },
  { id: "check", name: "Check", icon: "📋", description: "Check payment", svgIcon: "check" },
  { id: "transfer", name: "Bank Transfer", icon: "🏦", description: "Bank transfer", svgIcon: "transfer" },
];

export default function PaymentModalComponent({
  total,
  customer,
  staff,
  onPayment,
  onClose,
}: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>(total.toFixed(2));
  const [selectedMethod, setSelectedMethod] = useState<string>("cash");
  const paymentAmountNum = parseFloat(paymentAmount) || 0;
  const change = Math.max(0, paymentAmountNum - total);
  const isValidPayment = paymentAmountNum >= total;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
              <circle cx="17" cy="17" r="3"></circle>
            </svg>
            <h2 className="text-2xl font-bold text-white">Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Order Summary */}
          <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Total Amount:</span>
              <span className="text-green-400 font-bold text-lg">${total.toFixed(2)}</span>
            </div>
            {paymentAmount && (
              <>
                <div className="flex justify-between text-slate-400 text-sm border-t border-slate-600 pt-2">
                  <span>Amount Paid:</span>
                  <span className="text-white font-bold">${paymentAmountNum.toFixed(2)}</span>
                </div>
                {isValidPayment && (
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Change to Return:</span>
                    <span className="text-yellow-400 font-bold text-lg">${change.toFixed(2)}</span>
                  </div>
                )}
                {!isValidPayment && (
                  <div className="flex justify-between text-slate-400 text-sm">
                    <span>Still Due:</span>
                    <span className="text-red-400 font-bold">${(total - paymentAmountNum).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-2">
            <label className="text-white font-semibold text-sm">Enter Payment Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <label className="text-white font-semibold text-sm">Select Payment Method</label>
            <div className="space-y-2 max-h-48 overflow-auto">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-3 border-2 rounded-lg transition-all text-left flex items-center gap-2 ${
                    selectedMethod === method.id
                      ? "border-blue-500 bg-blue-600/20"
                      : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
                    {method.svgIcon === "card" && (
                      <>
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </>
                    )}
                    {method.svgIcon === "cash" && (
                      <>
                        <circle cx="12" cy="12" r="1"></circle>
                        <path d="M3 6h18"></path>
                        <rect x="1" y="6" width="22" height="12" rx="2" ry="2"></rect>
                      </>
                    )}
                    {method.svgIcon === "check" && (
                      <>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </>
                    )}
                    {method.svgIcon === "transfer" && (
                      <>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="19 12 12 19 5 12"></polyline>
                      </>
                    )}
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{method.name}</p>
                    <p className="text-xs text-slate-400">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-400 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 p-3 bg-slate-700/20 rounded space-y-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Staff: <span className="text-white font-medium">{staff?.name}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span>Customer: <span className="text-white font-medium">{customer}</span></span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 p-6 space-y-2">
          <button
            onClick={() => {
              if (!selectedMethod) {
                alert("Please select a payment method");
                return;
              }
              if (!isValidPayment) {
                alert("Payment amount must be at least $" + total.toFixed(2));
                return;
              }
              onPayment(selectedMethod);
            }}
            disabled={!selectedMethod || !isValidPayment}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Payment
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
