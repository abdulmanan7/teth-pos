import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { ChartOfAccount, ChartOfAccountType, ChartOfAccountSubType } from "@shared/api";

interface ChartOfAccountsManagerProps {
  isDarkTheme: boolean;
}

export default function ChartOfAccountsManager({ isDarkTheme }: ChartOfAccountsManagerProps) {
  const { get, post, put, delete: deleteRequest } = useElectronApi();
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [types, setTypes] = useState<ChartOfAccountType[]>([]);
  const [subTypes, setSubTypes] = useState<ChartOfAccountSubType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type_id: "",
    sub_type_id: "",
    description: "",
    is_enabled: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, typesData, subTypesData] = await Promise.all([
        get("/api/accounting/accounts"),
        get("/api/accounting/types"),
        get("/api/accounting/subtypes"),
      ]);
      
      setAccounts(accountsData);
      setTypes(typesData);
      setSubTypes(subTypesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      addToast("Failed to load accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await put(`/api/accounting/accounts/${editingId}`, formData);
        addToast("Account updated successfully", "success");
      } else {
        await post("/api/accounting/accounts", formData);
        addToast("Account created successfully", "success");
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error saving account:", error);
      addToast("Failed to save account", "error");
    }
  };

  const handleEdit = (account: ChartOfAccount) => {
    // Extract IDs from populated objects if necessary
    const typeId = typeof account.type_id === 'object' ? (account.type_id as any)._id : account.type_id;
    const subTypeId = typeof account.sub_type_id === 'object' ? (account.sub_type_id as any)._id : account.sub_type_id;
    
    setFormData({
      name: account.name,
      code: account.code,
      type_id: typeId.toString(),
      sub_type_id: subTypeId.toString(),
      description: account.description || "",
      is_enabled: account.is_enabled,
    });
    setEditingId(account._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      await deleteRequest(`/api/accounting/accounts/${id}`);
      addToast("Account deleted successfully", "success");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      addToast(error.response?.data?.error || "Failed to delete account", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type_id: "",
      sub_type_id: "",
      description: "",
      is_enabled: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.includes(searchTerm);
    const matchesType = !selectedType || account.type_id === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeName = (typeId: string | any) => {
    // Handle populated object (when API returns full object instead of just ID)
    if (typeof typeId === 'object' && typeId !== null) {
      return typeId.name || "Unknown";
    }
    // Handle string ID
    const type = types.find((t) => t._id === typeId || t._id.toString() === typeId);
    return type?.name || "Unknown";
  };

  const getSubTypeName = (subTypeId: string | any) => {
    // Handle populated object (when API returns full object instead of just ID)
    if (typeof subTypeId === 'object' && subTypeId !== null) {
      return subTypeId.name || "Unknown";
    }
    // Handle string ID
    const subType = subTypes.find((st) => st._id === subTypeId || st._id.toString() === subTypeId);
    return subType?.name || "Unknown";
  };

  const filteredSubTypes = subTypes.filter((st) => 
    st.type_id === formData.type_id || st.type_id.toString() === formData.type_id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Chart of Accounts
          </h3>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Manage your accounting accounts
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-3 w-4 h-4 ${
              isDarkTheme ? "text-slate-400" : "text-slate-600"
            }`}
          />
          <Input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${
              isDarkTheme
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-white border-slate-300 text-slate-900"
            }`}
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDarkTheme
              ? "bg-slate-700 border-slate-600 text-white"
              : "bg-white border-slate-300 text-slate-900"
          }`}
        >
          <option value="">All Types</option>
          {types.map((type) => (
            <option key={type._id} value={type._id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* Accounts List */}
      <div className="space-y-2">
        {filteredAccounts.length === 0 ? (
          <div
            className={`text-center py-12 ${
              isDarkTheme ? "text-slate-400" : "text-slate-600"
            }`}
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No accounts found</p>
          </div>
        ) : (
          filteredAccounts.map((account) => (
            <div
              key={account._id}
              className={`p-4 rounded-lg border ${
                isDarkTheme
                  ? "bg-slate-700/30 border-slate-600"
                  : "bg-slate-100 border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-mono px-2 py-1 rounded ${
                        isDarkTheme
                          ? "bg-slate-600 text-slate-300"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {account.code}
                    </span>
                    <h4
                      className={`font-semibold ${
                        isDarkTheme ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {account.name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        account.is_enabled
                          ? isDarkTheme
                            ? "bg-green-900/40 text-green-300"
                            : "bg-green-100 text-green-700"
                          : isDarkTheme
                          ? "bg-red-900/40 text-red-300"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {account.is_enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div
                    className={`text-sm ${
                      isDarkTheme ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    <span className="font-medium">{getTypeName(account.type_id)}</span>
                    {" • "}
                    <span>{getSubTypeName(account.sub_type_id)}</span>
                  </div>
                  {account.description && (
                    <p
                      className={`text-sm mt-2 ${
                        isDarkTheme ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {account.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account._id)}
                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
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
          <div
            className={`rounded-lg border shadow-xl max-w-2xl w-full ${
              isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`flex items-center justify-between p-6 border-b ${
                isDarkTheme ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                {editingId ? "Edit Account" : "Add New Account"}
              </h3>
              <button
                onClick={resetForm}
                className={`transition-colors ${
                  isDarkTheme ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkTheme ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Account Code *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 1060"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className={
                      isDarkTheme
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkTheme ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Account Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Cash"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={
                      isDarkTheme
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkTheme ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Account Type *
                  </label>
                  <select
                    value={formData.type_id}
                    onChange={(e) =>
                      setFormData({ ...formData, type_id: e.target.value, sub_type_id: "" })
                    }
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkTheme
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="">Select type</option>
                    {types.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkTheme ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Sub Type *
                  </label>
                  <select
                    value={formData.sub_type_id}
                    onChange={(e) => setFormData({ ...formData, sub_type_id: e.target.value })}
                    required
                    disabled={!formData.type_id}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkTheme
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="">Select sub type</option>
                    {filteredSubTypes.map((subType) => (
                      <option key={subType._id} value={subType._id}>
                        {subType.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkTheme ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Description
                </label>
                <textarea
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkTheme
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="is_enabled"
                  className={`text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}
                >
                  Account is active
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 ${
                    isDarkTheme
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-900"
                  }`}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {editingId ? "Update Account" : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
