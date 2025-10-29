import { X, Plus, Edit2, Trash2, Loader, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { Staff } from "@shared/api";

interface StaffManagementModalProps {
  onClose: () => void;
}

export default function StaffManagementModal({ onClose }: StaffManagementModalProps) {
  const { get, post, put, delete: deleteRequest } = useElectronApi();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    role: "Cashier" as "Cashier" | "Manager" | "Supervisor" | "Admin",
    pin: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await get("/api/staff");
      setStaff(data);
    } catch (err) {
      setError("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "Cashier",
      pin: "",
      email: "",
      phone: "",
      notes: "",
    });
    setEditingId(null);
    setError("");
  };

  const handleEdit = (s: Staff) => {
    setFormData({
      name: s.name,
      role: s.role,
      pin: "",
      email: s.email || "",
      phone: s.phone || "",
      notes: s.notes || "",
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.role) {
      setError("Name and role are required");
      return;
    }

    if (!editingId && !formData.pin) {
      setError("PIN is required for new staff");
      return;
    }

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 6)) {
      setError("PIN must be 4-6 digits");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        role: formData.role,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
        ...(formData.pin && { pin: formData.pin }),
      };

      if (editingId) {
        await put(`/api/staff/${editingId}`, payload);
        setSuccess("Staff updated successfully");
      } else {
        await post("/api/staff", payload);
        setSuccess("Staff added successfully");
      }

      resetForm();
      setShowForm(false);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || "Failed to save staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        await deleteRequest(`/api/staff/${id}`);
        setSuccess("Staff deleted successfully");
        await fetchStaff();
      } catch (err: any) {
        setError(err.message || "Failed to delete staff");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Staff Management</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
              <p className="text-green-400 text-sm">✓ {success}</p>
            </div>
          )}

          {showForm ? (
            // Form
            <form onSubmit={handleSubmit} className="space-y-4 bg-slate-700/30 p-4 rounded-lg border border-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Staff name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {editingId ? "New PIN (leave blank to keep current)" : "PIN *"}
                  </label>
                  <input
                    type="password"
                    placeholder="4-6 digits"
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData({ ...formData, pin: e.target.value })
                    }
                    maxLength={6}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="staff@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          ) : (
            // Staff List
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No staff members yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staff.map((s) => (
                    <div
                      key={s._id}
                      className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{s.name}</h3>
                        <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                          <p>Role: {s.role}</p>
                          <p>
                            Status:{" "}
                            <span
                              className={
                                s.status === "active"
                                  ? "text-green-400"
                                  : s.status === "inactive"
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }
                            >
                              {s.status}
                            </span>
                          </p>
                          {s.email && <p>Email: {s.email}</p>}
                          {s.phone && <p>Phone: {s.phone}</p>}
                          <p>
                            Transactions: {s.total_transactions} | Sales: $
                            {s.total_sales.toFixed(2)}
                          </p>
                          {s.is_logged_in && (
                            <p className="text-blue-400 font-semibold">
                              ✓ Currently Logged In
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showForm && (
          <div className="border-t border-slate-700 p-6 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
