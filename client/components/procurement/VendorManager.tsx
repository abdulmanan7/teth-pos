import { X, Plus, Edit2, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import { formatCurrencyNew } from "@/utils";
import { useNotifications } from "@/utils/notifications";

interface Vendor {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  payment_terms?: string;
  is_active: boolean;
  rating: number;
  total_purchases: number;
  total_spent: number;
  notes?: string;
}

interface VendorManagerProps {
  isDarkTheme?: boolean;
}

export default function VendorManager({ isDarkTheme = true }: VendorManagerProps) {
  const notify = useNotifications();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    contact_person: "",
    payment_terms: "Net 30",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await get("/api/vendors");
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      notify.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      contact_person: "",
      payment_terms: "Net 30",
      notes: "",
    });
    setEditingId(null);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      code: vendor.code,
      email: vendor.email,
      phone: vendor.phone || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      zip_code: vendor.zip_code || "",
      contact_person: vendor.contact_person || "",
      payment_terms: vendor.payment_terms || "Net 30",
      notes: vendor.notes || "",
    });
    setEditingId(vendor._id);
    setShowForm(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.email) {
      notify.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await put(`/api/vendors/${editingId}`, formData);
        notify.success("Vendor updated successfully!");
      } else {
        await post("/api/vendors", formData);
        notify.success("Vendor added successfully!");
      }
      resetForm();
      setShowForm(false);
      await fetchVendors();
    } catch (error) {
      console.error("Error saving vendor:", error);
      notify.error("Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteRequest(`/api/vendors/${id}`);
        notify.success("Vendor deleted successfully!");
        await fetchVendors();
      } catch (error) {
        console.error("Error deleting vendor:", error);
        notify.error("Failed to delete vendor");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Vendor Management</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Vendors List */}
      <div className="grid gap-4">
        {vendors.length === 0 ? (
          <div className={`text-center py-8 rounded-lg border ${isDarkTheme ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
            <p className={isDarkTheme ? 'text-slate-400' : 'text-slate-600'}>No vendors yet. Add one to get started!</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor._id}
              className={`border rounded-lg p-4 transition-colors ${isDarkTheme ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-300 hover:border-slate-400'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{vendor.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${isDarkTheme ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                      {vendor.code}
                    </span>
                    {vendor.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-yellow-400">{vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className={`grid grid-cols-2 gap-2 text-sm mb-2 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    <div>Email: <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{vendor.email}</span></div>
                    <div>Phone: <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{vendor.phone || "N/A"}</span></div>
                    {vendor.contact_person && (
                      <div>Contact: <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{vendor.contact_person}</span></div>
                    )}
                    {vendor.city && (
                      <div>City: <span className={isDarkTheme ? 'text-white' : 'text-slate-900'}>{vendor.city}</span></div>
                    )}
                  </div>

                  <div className={`grid grid-cols-3 gap-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    <div>
                      <p className={isDarkTheme ? 'text-slate-500' : 'text-slate-600'}>Total Purchases</p>
                      <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{vendor.total_purchases}</p>
                    </div>
                    <div>
                      <p className={isDarkTheme ? 'text-slate-500' : 'text-slate-600'}>Total Spent</p>
                      <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{formatCurrencyNew(vendor.total_spent)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Status</p>
                      <p className={`font-semibold ${vendor.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditVendor(vendor)}
                    className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-900'}`}
                    title="Edit vendor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVendor(vendor._id)}
                    className={`p-2 rounded transition-colors ${isDarkTheme ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-900'}`}
                    title="Delete vendor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className={`rounded-lg border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
              <h3 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                {editingId ? "Edit Vendor" : "Add New Vendor"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Vendor Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Fresh Farms Co"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Vendor Code *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., FF-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1-555-0123"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Address
                </label>
                <Input
                  type="text"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    City
                  </label>
                  <Input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    State
                  </label>
                  <Input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Zip Code
                  </label>
                  <Input
                    type="text"
                    placeholder="Zip code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Contact Person
                  </label>
                  <Input
                    type="text"
                    placeholder="John Smith"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Payment Terms
                  </label>
                  <Input
                    type="text"
                    placeholder="Net 30"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full rounded px-3 py-2 text-sm ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-500'}`}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${isDarkTheme ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 disabled:opacity-50 ${isDarkTheme ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {submitting ? "Saving..." : editingId ? "Update Vendor" : "Add Vendor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
