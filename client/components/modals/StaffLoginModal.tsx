import { X, Lock, LogOut, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { Staff, StaffLoginResponse } from "@shared/api";

interface StaffLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (staff: StaffLoginResponse) => void;
  currentStaff: StaffLoginResponse | null;
}

export default function StaffLoginModal({
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
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-400" />
            Staff Session
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {currentStaff ? (
            // Logged In State
            <div className="space-y-4">
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <p className="text-green-400 font-semibold text-lg">
                  ✓ Logged In
                </p>
                <p className="text-white text-2xl font-bold mt-2">
                  {currentStaff.name}
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  Role: <span className="font-semibold">{currentStaff.role}</span>
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  Session ID: {currentStaff.sessionId.slice(0, 8)}...
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setShowChangePin(!showChangePin)}
                  className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  {showChangePin ? "Cancel" : "Change PIN"}
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>

              {/* Change PIN Form */}
              {showChangePin && (
                <form onSubmit={handleChangePin} className="space-y-3 pt-4 border-t border-slate-600">
                  <h3 className="text-white font-semibold">Change PIN</h3>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Old PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current PIN"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
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
                <label className="block text-sm text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2 bg-slate-700 border-2 border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
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
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-lg text-center text-4xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !emailInput || pinInput.length < 4}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
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
