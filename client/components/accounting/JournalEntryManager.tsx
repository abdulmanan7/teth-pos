import { useState, useEffect } from "react";
import { Plus, Trash2, Loader, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { JournalEntry, ChartOfAccount } from "@shared/api";

interface JournalEntryManagerProps {
  isDarkTheme: boolean;
}

interface JournalItemForm {
  account_id: string;
  description: string;
  debit: number;
  credit: number;
}

export default function JournalEntryManager({ isDarkTheme }: JournalEntryManagerProps) {
  const { get, post, delete: deleteRequest } = useElectronApi();
  const { addToast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
  });
  const [items, setItems] = useState<JournalItemForm[]>([
    { account_id: "", description: "", debit: 0, credit: 0 },
    { account_id: "", description: "", debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entriesData, accountsData] = await Promise.all([
        get("/api/accounting/journal-entries"),
        get("/api/accounting/accounts?is_enabled=true"),
      ]);
      setEntries(entriesData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      addToast("Failed to load journal entries", "error");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { account_id: "", description: "", debit: 0, credit: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 2) {
      addToast("Journal entry must have at least 2 items", "warning");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof JournalItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const totalDebit = items.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = items.reduce((sum, item) => sum + (item.credit || 0), 0);
    return { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { totalDebit, totalCredit, balanced } = calculateTotals();

    if (!balanced) {
      addToast(`Debits (${totalDebit.toFixed(2)}) must equal Credits (${totalCredit.toFixed(2)})`, "error");
      return;
    }

    try {
      await post("/api/accounting/journal-entries", {
        ...formData,
        items: items.map((item) => ({
          ...item,
          debit: item.debit || 0,
          credit: item.credit || 0,
        })),
      });
      addToast("Journal entry created successfully", "success");
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error creating journal entry:", error);
      addToast("Failed to create journal entry", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await deleteRequest(`/api/accounting/journal-entries/${id}`);
      addToast("Journal entry deleted successfully", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      addToast("Failed to delete journal entry", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      reference: "",
      description: "",
    });
    setItems([
      { account_id: "", description: "", debit: 0, credit: 0 },
      { account_id: "", description: "", debit: 0, credit: 0 },
    ]);
    setShowForm(false);
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a._id === accountId);
    return account ? `${account.code} - ${account.name}` : "Unknown";
  };

  const { totalDebit, totalCredit, balanced } = calculateTotals();

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
            Journal Entries
          </h3>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Create manual accounting entries
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div
            className={`text-center py-12 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
          >
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No journal entries found</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry._id}
              className={`p-4 rounded-lg border ${
                isDarkTheme
                  ? "bg-slate-700/30 border-slate-600"
                  : "bg-slate-100 border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`text-sm font-mono font-semibold ${
                        isDarkTheme ? "text-blue-400" : "text-blue-600"
                      }`}
                    >
                      {entry.journal_number}
                    </span>
                    <span
                      className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`font-medium ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {entry.description}
                  </p>
                  {entry.reference && (
                    <p
                      className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Ref: {entry.reference}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Total
                    </p>
                    <p
                      className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                    >
                      Rs.{entry.total_debit.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry._id)}
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

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto ${
              isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`flex items-center justify-between p-6 border-b sticky top-0 ${
                isDarkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              }`}
            >
              <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                New Journal Entry
              </h3>
              <button
                onClick={resetForm}
                className={`transition-colors ${
                  isDarkTheme
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Entry Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkTheme ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    Reference
                  </label>
                  <Input
                    type="text"
                    placeholder="Optional reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
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
                    Description *
                  </label>
                  <Input
                    type="text"
                    placeholder="Entry description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className={
                      isDarkTheme
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4
                    className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}
                  >
                    Line Items
                  </h4>
                  <Button
                    type="button"
                    onClick={addItem}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Add Line
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        isDarkTheme
                          ? "bg-slate-700/30 border-slate-600"
                          : "bg-slate-100 border-slate-300"
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                          <label
                            className={`block text-xs font-medium mb-1 ${
                              isDarkTheme ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Account *
                          </label>
                          <select
                            value={item.account_id}
                            onChange={(e) => updateItem(index, "account_id", e.target.value)}
                            required
                            className={`w-full px-2 py-1.5 text-sm rounded border ${
                              isDarkTheme
                                ? "bg-slate-700 border-slate-600 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            }`}
                          >
                            <option value="">Select account</option>
                            {accounts.map((account) => (
                              <option key={account._id} value={account._id}>
                                {account.code} - {account.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label
                            className={`block text-xs font-medium mb-1 ${
                              isDarkTheme ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Description
                          </label>
                          <Input
                            type="text"
                            placeholder="Line description"
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            className={`text-sm ${
                              isDarkTheme
                                ? "bg-slate-700 border-slate-600 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            }`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label
                            className={`block text-xs font-medium mb-1 ${
                              isDarkTheme ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Debit
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.debit || ""}
                            onChange={(e) =>
                              updateItem(index, "debit", parseFloat(e.target.value) || 0)
                            }
                            className={`text-sm ${
                              isDarkTheme
                                ? "bg-slate-700 border-slate-600 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            }`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label
                            className={`block text-xs font-medium mb-1 ${
                              isDarkTheme ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Credit
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.credit || ""}
                            onChange={(e) =>
                              updateItem(index, "credit", parseFloat(e.target.value) || 0)
                            }
                            className={`text-sm ${
                              isDarkTheme
                                ? "bg-slate-700 border-slate-600 text-white"
                                : "bg-white border-slate-300 text-slate-900"
                            }`}
                          />
                        </div>
                        <div className="col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div
                className={`p-4 rounded-lg border ${
                  balanced
                    ? isDarkTheme
                      ? "bg-green-900/20 border-green-600"
                      : "bg-green-50 border-green-300"
                    : isDarkTheme
                    ? "bg-red-900/20 border-red-600"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        balanced
                          ? isDarkTheme
                            ? "text-green-300"
                            : "text-green-700"
                          : isDarkTheme
                          ? "text-red-300"
                          : "text-red-700"
                      }`}
                    >
                      {balanced ? "✓ Balanced" : "⚠ Not Balanced"}
                    </p>
                    <p
                      className={`text-xs ${
                        balanced
                          ? isDarkTheme
                            ? "text-green-400"
                            : "text-green-600"
                          : isDarkTheme
                          ? "text-red-400"
                          : "text-red-600"
                      }`}
                    >
                      Debits must equal Credits
                    </p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p
                        className={`text-xs ${
                          isDarkTheme ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        Total Debit
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          isDarkTheme ? "text-white" : "text-slate-900"
                        }`}
                      >
                        Rs.{totalDebit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs ${
                          isDarkTheme ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        Total Credit
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          isDarkTheme ? "text-white" : "text-slate-900"
                        }`}
                      >
                        Rs.{totalCredit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
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
                <Button
                  type="submit"
                  disabled={!balanced}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Journal Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
