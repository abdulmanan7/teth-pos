import { X, Search, Plus, MapPin, Phone, Mail, Loader, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { Customer } from "@shared/api";
import { formatCurrencyNew } from "@/utils";

export default function CustomersModal({ isDarkTheme, onClose }: { isDarkTheme: boolean; onClose: () => void }) {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
  });
  const { get, post, put, delete: deleteRequest } = useElectronApi();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await get("/api/customers");
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email) {
      addToast("Please fill in name and email", "warning");
      return;
    }

    try {
      setFormLoading(true);
      if (editingId) {
        await put(`/api/customers/${editingId}`, formData);
        addToast("Customer updated successfully!", "success");
      } else {
        await post("/api/customers", formData);
        addToast("Customer added successfully!", "success");
      }
      setFormData({ name: "", email: "", phone: "", city: "", address: "" });
      setEditingId(null);
      setShowForm(false);
      await fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      addToast("Failed to save customer", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      address: "",
    });
    setEditingId(customer._id);
    setShowForm(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteRequest(`/api/customers/${id}`);
        addToast("Customer deleted successfully!", "success");
        await fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        addToast("Failed to delete customer", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", city: "", address: "" });
    setEditingId(null);
  };

  const filtered = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Customers</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className={`p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-3 w-5 h-5 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isDarkTheme ? 'pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'pl-10 bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.length === 0 ? (
                <div className={`text-center py-12 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  <p>No customers found</p>
                </div>
              ) : (
                filtered.map((customer) => (
                  <div
                    key={customer._id}
                    className={`p-4 border rounded-lg transition-colors ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {customer.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                          ID: {customer._id.slice(-3)}
                        </span>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className={`p-1.5 rounded transition-colors ${isDarkTheme ? 'hover:bg-slate-600 text-blue-400' : 'hover:bg-slate-200 text-blue-600'}`}
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className={`p-1.5 rounded transition-colors ${isDarkTheme ? 'hover:bg-slate-600 text-red-400' : 'hover:bg-slate-200 text-red-600'}`}
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Mail className={`w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
                        <span className="text-sm">{customer.email}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Phone className={`w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
                        <span className="text-sm">{customer.phone}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                        <MapPin className={`w-4 h-4 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`} />
                        <span className="text-sm">{customer.city}</span>
                      </div>
                      <div className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        Joined {new Date(customer.joinDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 pt-3 border-t ${isDarkTheme ? 'border-slate-600' : 'border-slate-300'}`}>
                      <div>
                        <p className={`text-xs mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Total Orders</p>
                        <p className="text-lg font-bold text-blue-400">
                          {customer.totalOrders}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Total Spent</p>
                        <p className="text-lg font-bold text-green-400">
                          {formatCurrencyNew(customer.totalSpent)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Customer Form */}
        {showForm && (
          <div className={`border-t p-6 ${isDarkTheme ? 'border-slate-700 bg-slate-700/20' : 'border-slate-200 bg-slate-50'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Customer name"
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    City
                  </label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
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
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                  className={isDarkTheme ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className={isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {formLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingId ? 'Update Customer' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className={`border-t p-6 flex justify-between ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <Button
            onClick={onClose}
            className={isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Cancel" : "Add Customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
