import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Star, Loader, AlertCircle, CheckCircle2 } from "lucide-react";
import { useElectronApi } from "@/hooks/useElectronApi";
import type { TaxRateConfig, CreateTaxRatePayload, UpdateTaxRatePayload } from "@shared/api";

interface TaxRatesManagerProps {
  isDarkTheme: boolean;
}

type FormState = {
  name: string;
  ratePercent: string;
  description: string;
  isDefault: boolean;
};

const emptyForm: FormState = {
  name: "",
  ratePercent: "0",
  description: "",
  isDefault: false,
};

const formatPercent = (value: number) => (value * 100).toFixed(2);

export default function TaxRatesManager({ isDarkTheme }: TaxRatesManagerProps) {
  const { get, post, put, delete: destroy } = useElectronApi();
  const [taxRates, setTaxRates] = useState<TaxRateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const data = await get("/api/tax-rates");
      setTaxRates(Array.isArray(data) ? (data as TaxRateConfig[]) : []);
    } catch (err) {
      setError("Failed to load tax rates");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setSubmitting(false);
  };

  const handleCreateNew = () => {
    setError(null);
    setSuccess(null);
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (rate: TaxRateConfig) => {
    setError(null);
    setSuccess(null);
    setEditingId(rate._id);
    setFormData({
      name: rate.name,
      ratePercent: formatPercent(rate.rate),
      description: rate.description || "",
      isDefault: rate.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tax rate?")) return;
    try {
      await destroy(`/api/tax-rates/${id}`);
      setSuccess("Tax rate deleted");
      await fetchRates();
    } catch (err: any) {
      setError(err?.message || "Failed to delete tax rate");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await post(`/api/tax-rates/${id}/default`, {});
      setSuccess("Default tax rate updated");
      await fetchRates();
    } catch (err: any) {
      setError(err?.message || "Failed to set default tax rate");
    }
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    const parsedRate = Number(formData.ratePercent);
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      setError("Enter a valid tax rate");
      return;
    }

    const payload: CreateTaxRatePayload | UpdateTaxRatePayload = {
      name: formData.name.trim(),
      rate: parsedRate / 100,
      description: formData.description.trim() || undefined,
      isDefault: formData.isDefault,
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await put(`/api/tax-rates/${editingId}`, payload);
        setSuccess("Tax rate updated");
      } else {
        await post("/api/tax-rates", payload);
        setSuccess("Tax rate created");
      }
      resetForm();
      await fetchRates();
    } catch (err: any) {
      setError(err?.message || "Failed to save tax rate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className={`flex items-start gap-2 p-3 rounded border ${isDarkTheme ? "border-red-500/40 bg-red-900/40 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={`flex items-center gap-2 p-3 rounded border ${isDarkTheme ? "border-green-500/40 bg-green-900/40 text-green-200" : "border-green-200 bg-green-50 text-green-700"}`}>
          <CheckCircle2 className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-xl font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Tax Rates</h3>
          <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Manage tax configurations shown at checkout.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 rounded px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Tax Rate
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : taxRates.length === 0 ? (
        <div className={`py-12 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          No tax rates configured yet.
        </div>
      ) : (
        <div className={`border rounded-lg overflow-hidden ${isDarkTheme ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <table className="w-full text-sm">
            <thead className={isDarkTheme ? "bg-slate-700/50 text-slate-200" : "bg-slate-100 text-slate-600"}>
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-center px-4 py-3 font-semibold">Rate</th>
                <th className="text-left px-4 py-3 font-semibold">Description</th>
                <th className="text-center px-4 py-3 font-semibold">Default</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxRates.map((rate) => (
                <tr
                  key={rate._id}
                  className={isDarkTheme ? "border-t border-slate-700" : "border-t border-slate-200"}
                >
                  <td className={`px-4 py-3 ${isDarkTheme ? "text-slate-200" : "text-slate-800"}`}>{rate.name}</td>
                  <td className={`px-4 py-3 text-center ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                    {formatPercent(rate.rate)}%
                  </td>
                  <td className={`px-4 py-3 ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                    {rate.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rate.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-500">
                        <Star className="w-3 h-3" fill="currentColor" /> Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(rate._id)}
                        className={`text-xs font-medium underline ${isDarkTheme ? "text-blue-300 hover:text-blue-200" : "text-blue-600 hover:text-blue-500"}`}
                      >
                        Set Default
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rate)}
                        className="p-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rate._id)}
                        className="p-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleFormSubmit}
          className={`space-y-4 border rounded-lg p-5 ${isDarkTheme ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-200"}`}
        >
          <h4 className={`text-lg font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            {editingId ? "Edit Tax Rate" : "Add Tax Rate"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={`w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkTheme ? "bg-slate-700 border border-slate-600 text-white" : "bg-white border border-slate-300 text-slate-900"}`}
                placeholder="e.g. Standard VAT"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={formData.ratePercent}
                onChange={(e) => setFormData((prev) => ({ ...prev, ratePercent: e.target.value }))}
                className={`w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkTheme ? "bg-slate-700 border border-slate-600 text-white" : "bg-white border border-slate-300 text-slate-900"}`}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              className={`w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkTheme ? "bg-slate-700 border border-slate-600 text-white" : "bg-white border border-slate-300 text-slate-900"}`}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
            />
            <span className={isDarkTheme ? "text-slate-300" : "text-slate-700"}>Set as default tax rate</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${isDarkTheme ? "bg-slate-700 hover:bg-slate-600 text-slate-200" : "bg-slate-200 hover:bg-slate-300 text-slate-800"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
