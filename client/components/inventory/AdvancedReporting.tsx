import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Loader,
  Eye,
  X,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElectronApi } from "@/hooks/useElectronApi";
import { showNotification } from "@/utils";

interface AdvancedReportingProps {
  onClose: () => void;
}

export default function AdvancedReporting({ onClose }: AdvancedReportingProps) {
  const [reportType, setReportType] = useState<"inventory" | "transactions" | "expiry" | "stock-alerts" | "warehouses">("inventory");
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { post } = useElectronApi();

  const reportConfigs = {
    inventory: {
      title: "Inventory Report",
      description: "Complete inventory status and product details",
      icon: BarChart3,
      endpoint: "/api/inventory/reports/inventory",
    },
    transactions: {
      title: "Transaction Report",
      description: "All inventory movements and transactions",
      icon: FileText,
      endpoint: "/api/inventory/reports/transactions",
    },
    expiry: {
      title: "Expiry Report",
      description: "Product expiry dates and status",
      icon: Calendar,
      endpoint: "/api/inventory/reports/expiry",
    },
    "stock-alerts": {
      title: "Stock Alert Report",
      description: "Low stock and out of stock alerts",
      icon: Filter,
      endpoint: "/api/inventory/reports/stock-alerts",
    },
    warehouses: {
      title: "Warehouse Report",
      description: "Warehouse capacity and utilization",
      icon: BarChart3,
      endpoint: "/api/inventory/reports/warehouses",
    },
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const payload: any = {
        format,
      };

      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;

      const config = reportConfigs[reportType];
      const data = await post(config.endpoint, payload);

      if (format === "csv") {
        // Handle CSV download
        const element = document.createElement("a");
        const file = new Blob([data], { type: "text/csv" });
        element.href = URL.createObjectURL(file);
        element.download = `${reportType}-report.csv`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showNotification.success("Report downloaded successfully!");
      } else {
        setReportData(data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      showNotification.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === "number") {
      if (value > 1000000) {
        return `Rs ${(value / 1000000).toFixed(2)}M`;
      } else if (value > 1000) {
        return `Rs ${(value / 1000).toFixed(2)}K`;
      }
      return `Rs ${value.toFixed(2)}`;
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7" />
          Advanced Reporting
        </h3>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(reportConfigs).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setReportType(key as any)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              reportType === key
                ? "bg-blue-900/30 border-blue-500"
                : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
            }`}
          >
            <div className="flex items-start gap-3">
              <config.icon className="w-5 h-5 mt-1 text-blue-400" />
              <div>
                <h4 className="font-semibold text-white">{config.title}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {config.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Report Options */}
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-white">Report Options</h4>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Export Format
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat("json")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                format === "json"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-600 text-slate-300 hover:bg-slate-700"
              }`}
            >
              JSON (Preview)
            </button>
            <button
              onClick={() => setFormat("csv")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                format === "csv"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-600 text-slate-300 hover:bg-slate-700"
              }`}
            >
              CSV (Download)
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      {/* Report Preview */}
      {showPreview && reportData && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Report Preview
            </h4>
            <button
              onClick={() => setShowPreview(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Report Header */}
          <div className="space-y-2 text-sm">
            <p className="text-white font-semibold">{reportData.title}</p>
            <p className="text-slate-400">
              Generated: {new Date(reportData.generated_at).toLocaleString()}
            </p>
            {reportData.period && (
              <p className="text-slate-400">
                Period: {new Date(reportData.period.start).toLocaleDateString()} to{" "}
                {new Date(reportData.period.end).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Summary */}
          {reportData.summary && (
            <div className="border-t border-slate-600 pt-4">
              <h5 className="font-semibold text-white mb-3">Summary</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(reportData.summary).map(([key, value]: [string, any]) => {
                  if (typeof value === "object") return null;
                  return (
                    <div key={key} className="bg-slate-600/30 rounded p-2">
                      <p className="text-xs text-slate-400 capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-white font-semibold">
                        {typeof value === "number" ? formatValue(value) : value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Table */}
          {reportData.products && (
            <div className="border-t border-slate-600 pt-4">
              <h5 className="font-semibold text-white mb-3">Products</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left text-slate-400 py-2">Name</th>
                      <th className="text-left text-slate-400 py-2">SKU</th>
                      <th className="text-right text-slate-400 py-2">Price</th>
                      <th className="text-right text-slate-400 py-2">Stock</th>
                      <th className="text-right text-slate-400 py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.products.slice(0, 10).map((p: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-700">
                        <td className="text-white py-2">{p.name}</td>
                        <td className="text-slate-400 py-2">{p.sku}</td>
                        <td className="text-right text-white py-2">
                          Rs {p.price?.toFixed(2)}
                        </td>
                        <td className="text-right text-white py-2">{p.stock}</td>
                        <td className="text-right text-green-400 py-2">
                          Rs {p.value?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportData.products.length > 10 && (
                <p className="text-xs text-slate-400 mt-2">
                  Showing 10 of {reportData.products.length} products
                </p>
              )}
            </div>
          )}

          {/* Transactions Table */}
          {reportData.transactions && (
            <div className="border-t border-slate-600 pt-4">
              <h5 className="font-semibold text-white mb-3">Transactions</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left text-slate-400 py-2">Type</th>
                      <th className="text-right text-slate-400 py-2">Qty</th>
                      <th className="text-right text-slate-400 py-2">Value</th>
                      <th className="text-left text-slate-400 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.slice(0, 10).map((t: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-700">
                        <td className="text-white py-2 capitalize">{t.type}</td>
                        <td className="text-right text-white py-2">{t.quantity}</td>
                        <td className="text-right text-green-400 py-2">
                          Rs {t.value?.toFixed(2)}
                        </td>
                        <td className="text-slate-400 py-2">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Download Button */}
          <Button
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob([JSON.stringify(reportData, null, 2)], {
                type: "application/json",
              });
              element.href = URL.createObjectURL(file);
              element.download = `${reportType}-report.json`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Use JSON format for detailed preview and analysis. Use CSV format for spreadsheet import and sharing.
        </p>
      </div>
    </div>
  );
}
