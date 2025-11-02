import { useState, useEffect } from "react";
import { Save, Loader, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandingConfig {
  _id?: string;
  storeName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website?: string;
  taxId?: string;
  businessLicense?: string;
  description?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BrandingManagerProps {
  isDarkTheme?: boolean;
  onClose?: () => void;
}

export default function BrandingManager({ isDarkTheme = true, onClose }: BrandingManagerProps) {
  const [config, setConfig] = useState<BrandingConfig>({
    storeName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    taxId: "",
    businessLicense: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchBrandingConfig();
  }, []);

  const fetchBrandingConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/branding/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Error fetching branding config:", error);
      setMessage({ type: "error", text: "Failed to load branding configuration" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch("/api/branding/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setMessage({ type: "success", text: "Branding configuration saved successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to save branding configuration" });
      }
    } catch (error) {
      console.error("Error saving branding config:", error);
      setMessage({ type: "error", text: "Error saving configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BrandingConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
          Store Branding & Configuration
        </h3>
        <p className={`text-sm mt-1 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          Configure your store information and branding details
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? isDarkTheme
                ? "bg-green-900/30 border border-green-600 text-green-400"
                : "bg-green-100 border border-green-300 text-green-700"
              : isDarkTheme
              ? "bg-red-900/30 border border-red-600 text-red-400"
              : "bg-red-100 border border-red-300 text-red-700"
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className={`border rounded-lg p-6 ${isDarkTheme ? "bg-slate-700/30 border-slate-600" : "bg-slate-100 border-slate-300"}`}>
          <h4 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Basic Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Store Name *
              </label>
              <input
                type="text"
                value={config.storeName}
                onChange={(e) => handleChange("storeName", e.target.value)}
                placeholder="Enter store name"
                className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                  isDarkTheme
                    ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                    : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Phone *
                </label>
                <input
                  type="tel"
                  value={config.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                    isDarkTheme
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                    isDarkTheme
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Website
              </label>
              <input
                type="url"
                value={config.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://example.com"
                className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                  isDarkTheme
                    ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                    : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter store description"
                rows={3}
                className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm resize-none ${
                  isDarkTheme
                    ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                    : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className={`border rounded-lg p-6 ${isDarkTheme ? "bg-slate-700/30 border-slate-600" : "bg-slate-100 border-slate-300"}`}>
          <h4 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Address Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Street Address *
              </label>
              <input
                type="text"
                value={config.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter street address"
                className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                  isDarkTheme
                    ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                    : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  City *
                </label>
                <input
                  type="text"
                  value={config.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Enter city"
                  className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                    isDarkTheme
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  State *
                </label>
                <input
                  type="text"
                  value={config.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="Enter state"
                  className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                    isDarkTheme
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={config.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  placeholder="Enter ZIP code"
                  className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                    isDarkTheme
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Country *
                </label>
                <input
                  type="text"
                  value={config.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Enter country"
                  className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                    isDarkTheme
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                      : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className={`border rounded-lg p-6 ${isDarkTheme ? "bg-slate-700/30 border-slate-600" : "bg-slate-100 border-slate-300"}`}>
          <h4 className={`text-lg font-semibold mb-4 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
            Business Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Tax ID
              </label>
              <input
                type="text"
                value={config.taxId}
                onChange={(e) => handleChange("taxId", e.target.value)}
                placeholder="Enter tax ID"
                className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                  isDarkTheme
                    ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                    : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Business License
              </label>
              <input
                type="text"
                value={config.businessLicense}
                onChange={(e) => handleChange("businessLicense", e.target.value)}
                placeholder="Enter business license number"
                className={`w-full rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm ${
                  isDarkTheme
                    ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400"
                    : "bg-white border border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
      >
        {saving ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Configuration
          </>
        )}
      </Button>
    </div>
  );
}
