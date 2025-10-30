import { X, Lock, LogOut, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { Staff, StaffLoginResponse } from "@shared/api";

interface StaffLoginModalProps {
  isDarkTheme: boolean;
  onClose: () => void;
  onLoginSuccess: (staff: StaffLoginResponse) => void;
  currentStaff: StaffLoginResponse | null;
}

export default function StaffLoginModal({
  isDarkTheme,
  onClose,
  onLoginSuccess,
  currentStaff,
}: StaffLoginModalProps) {
  const { post } = useElectronApi();
  const [emailInput, setEmailInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [changePinLoading, setChangePinLoading] = useState(false);
  const [changePinError, setChangePinError] = useState("");
  const [changePinSuccess, setChangePinSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailInput || !emailInput.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    if (!pinInput || pinInput.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    try {
      setLoading(true);
      const response = await post("/api/staff/login", { 
        email: emailInput,
        pin: pinInput 
      });
      onLoginSuccess(response);
      setEmailInput("");
      setPinInput("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid email or PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!currentStaff) return;

    try {
      setLoading(true);
      await post("/api/staff/logout", { staffId: currentStaff._id });
      onLoginSuccess(null);
      setPinInput("");
      setEmailInput("");
      // Clear staff session from localStorage
      localStorage.removeItem("currentStaff");
      onClose();
    } catch (err: any) {
      setError(err.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError("");
    setChangePinSuccess(false);

    if (!oldPin || oldPin.length < 4) {
      setChangePinError("Old PIN must be at least 4 digits");
      return;
    }

    if (!newPin || newPin.length < 4) {
      setChangePinError("New PIN must be at least 4 digits");
      return;
    }

    if (newPin !== confirmPin) {
      setChangePinError("New PINs do not match");
      return;
    }

    if (oldPin === newPin) {
      setChangePinError("New PIN must be different from old PIN");
      return;
    }

    try {
      setChangePinLoading(true);
      await post("/api/staff/change-pin", {
        staffId: currentStaff?._id,
        oldPin,
        newPin,
      });
      setChangePinSuccess(true);
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setTimeout(() => {
        setShowChangePin(false);
        setChangePinSuccess(false);
      }, 2000);
    } catch (err: any) {
      setChangePinError(err.message || "Failed to change PIN");
    } finally {
      setChangePinLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg border shadow-xl max-w-md w-full ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            <Lock className="w-6 h-6 text-blue-400" />
            Staff Session
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {currentStaff ? (
            // Logged In State
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${isDarkTheme ? 'bg-green-900/30 border-green-600' : 'bg-green-50 border-green-300'}`}>
                <p className={`font-semibold text-lg ${isDarkTheme ? 'text-green-400' : 'text-green-700'}`}>
                  ✓ Logged In
                </p>
                <p className={`text-2xl font-bold mt-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  {currentStaff.name}
                </p>
                <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Role: <span className="font-semibold">{currentStaff.role}</span>
                </p>
                <p className={`text-xs mt-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  Session ID: {currentStaff.sessionId.slice(0, 8)}...
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setShowChangePin(!showChangePin)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
                >
                  {showChangePin ? "Cancel" : "Change PIN"}
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isDarkTheme ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  <LogOut className="w-4 h-4" />
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>

              {/* Change PIN Form */}
              {showChangePin && (
                <form onSubmit={handleChangePin} className={`space-y-3 pt-4 border-t ${isDarkTheme ? 'border-slate-600' : 'border-slate-200'}`}>
                  <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Change PIN</h3>

                  <div>
                    <label className={`block text-sm mb-1 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Old PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current PIN"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      className={`w-full px-3 py-2 border rounded text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      New PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new PIN"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />
                  </div>

                  {changePinError && (
                    <div className="bg-red-900/30 border border-red-600 rounded p-2 flex gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">{changePinError}</p>
                    </div>
                  )}

                  {changePinSuccess && (
                    <div className="bg-green-900/30 border border-green-600 rounded p-2">
                      <p className="text-green-400 text-sm">
                        ✓ PIN changed successfully
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={changePinLoading}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    {changePinLoading ? "Updating..." : "Update PIN"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            // Login State
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  autoFocus
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  PIN (4-6 digits)
                </label>
                <input
                  type="password"
                  placeholder="0000"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !loading && emailInput && pinInput.length >= 4) {
                      handleLogin(e as any);
                    }
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-center text-4xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkTheme ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                  maxLength={6}
                />
              </div>

              {error && (
                <div className={`border rounded-lg p-3 flex gap-2 ${isDarkTheme ? 'bg-red-900/30 border-red-600' : 'bg-red-50 border-red-300'}`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} />
                  <p className={`text-sm ${isDarkTheme ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !emailInput || pinInput.length < 4}
                className={`w-full px-4 py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="text-center text-slate-400 text-xs">
                Enter your email and 4-6 digit PIN to login
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
