import { useState, useEffect } from "react";
import { Loader, BarChart2, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";

interface FinancialReportsProps {
  isDarkTheme: boolean;
}

type ReportType = "trial-balance" | "income-statement" | "balance-sheet";

export default function FinancialReports({ isDarkTheme }: FinancialReportsProps) {
  const { get } = useElectronApi();
  const { addToast } = useToast();
  const [activeReport, setActiveReport] = useState<ReportType>("trial-balance");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start_date: "",
    end_date: new Date().toISOString().split("T")[0],
  });

  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = `/api/accounting/reports/${activeReport}`;
      const params = new URLSearchParams();
      
      if (activeReport === "income-statement") {
        if (dateRange.start_date) params.append("start_date", dateRange.start_date);
        if (dateRange.end_date) params.append("end_date", dateRange.end_date);
      } else {
        if (dateRange.end_date) params.append("end_date", dateRange.end_date);
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const data = await get(url);
      console.log(`${activeReport} data:`, data);
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      addToast("Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const reports = [
    { id: "trial-balance" as ReportType, label: "Trial Balance", icon: BarChart2 },
    { id: "income-statement" as ReportType, label: "Income Statement", icon: TrendingUp },
    { id: "balance-sheet" as ReportType, label: "Balance Sheet", icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
          Financial Reports
        </h3>
        <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          View financial statements and reports
        </p>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeReport === report.id
                  ? "bg-blue-600 text-white"
                  : isDarkTheme
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {report.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Filter */}
      <div className={`p-4 rounded-lg border ${isDarkTheme ? "bg-slate-700/30 border-slate-600" : "bg-slate-100 border-slate-300"}`}>
        <div className="flex items-center gap-3">
          {activeReport === "income-statement" && (
            <Input
              type="date"
              placeholder="Start Date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className={`text-sm ${isDarkTheme ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`}
            />
          )}
          <Input
            type="date"
            placeholder="End Date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
            className={`text-sm ${isDarkTheme ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`}
          />
          <Button onClick={fetchReport} className="bg-blue-600 hover:bg-blue-700 text-white">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : reportData ? (
        <div className={`rounded-lg border ${isDarkTheme ? "border-slate-600" : "border-slate-300"}`}>
          {/* Trial Balance */}
          {activeReport === "trial-balance" && (
            <div>
              <div className={`p-4 border-b ${isDarkTheme ? "bg-slate-700 border-slate-600" : "bg-slate-200 border-slate-300"}`}>
                <h4 className={`font-bold text-lg ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Trial Balance
                </h4>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  As of {dateRange.end_date || "Today"}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkTheme ? "bg-slate-700" : "bg-slate-100"}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Code</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Account</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Type</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Debit</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.trial_balance?.map((item: any, index: number) => (
                      <tr key={index} className={`border-t ${isDarkTheme ? "border-slate-700" : "border-slate-200"}`}>
                        <td className={`px-4 py-2 text-sm font-mono ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>{item.code}</td>
                        <td className={`px-4 py-2 text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>{item.name}</td>
                        <td className={`px-4 py-2 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>{item.type}</td>
                        <td className={`px-4 py-2 text-sm text-right ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                          {item.total_debit > 0 ? `Rs.${item.total_debit.toFixed(2)}` : "-"}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right ${isDarkTheme ? "text-red-400" : "text-red-600"}`}>
                          {item.total_credit > 0 ? `Rs.${item.total_credit.toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                    <tr className={`border-t-2 font-bold ${isDarkTheme ? "border-slate-600 bg-slate-700" : "border-slate-400 bg-slate-100"}`}>
                      <td colSpan={3} className={`px-4 py-3 text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>TOTAL</td>
                      <td className={`px-4 py-3 text-sm text-right ${isDarkTheme ? "text-green-400" : "text-green-600"}`}>
                        Rs.{reportData.totals?.total_debit.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right ${isDarkTheme ? "text-red-400" : "text-red-600"}`}>
                        Rs.{reportData.totals?.total_credit.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Income Statement */}
          {activeReport === "income-statement" && (
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <h4 className={`font-bold text-lg ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Income Statement
                </h4>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  {dateRange.start_date ? `${dateRange.start_date} to ` : ""}
                  {dateRange.end_date || "Today"}
                </p>
              </div>

              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${isDarkTheme ? "bg-slate-700/30" : "bg-slate-100"}`}>
                  <div className="flex justify-between mb-2">
                    <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Revenue</span>
                    <span className={`font-bold text-green-500`}>Rs.{reportData.total_income?.toFixed(2)}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDarkTheme ? "bg-slate-700/30" : "bg-slate-100"}`}>
                  <div className="flex justify-between mb-2">
                    <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Cost of Goods Sold</span>
                    <span className={`font-bold text-red-500`}>Rs.{reportData.total_cogs?.toFixed(2)}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${isDarkTheme ? "bg-blue-900/20 border-blue-600" : "bg-blue-50 border-blue-300"}`}>
                  <div className="flex justify-between">
                    <span className={`font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Gross Profit</span>
                    <span className={`font-bold ${reportData.gross_profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      Rs.{reportData.gross_profit?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDarkTheme ? "bg-slate-700/30" : "bg-slate-100"}`}>
                  <div className="flex justify-between mb-2">
                    <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Operating Expenses</span>
                    <span className={`font-bold text-red-500`}>Rs.{reportData.total_expenses?.toFixed(2)}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${isDarkTheme ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300"}`}>
                  <div className="flex justify-between">
                    <span className={`font-bold text-lg ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Net Income</span>
                    <span className={`font-bold text-lg ${reportData.net_income >= 0 ? "text-green-500" : "text-red-500"}`}>
                      Rs.{reportData.net_income?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {activeReport === "balance-sheet" && (
            <div className="p-6 space-y-6">
              <div className="text-center mb-6">
                <h4 className={`font-bold text-lg ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                  Balance Sheet
                </h4>
                <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  As of {dateRange.end_date || "Today"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Assets */}
                <div>
                  <h5 className={`font-bold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Assets</h5>
                  <div className={`p-4 rounded-lg ${isDarkTheme ? "bg-slate-700/30" : "bg-slate-100"}`}>
                    <div className="flex justify-between">
                      <span className={isDarkTheme ? "text-slate-300" : "text-slate-700"}>Total Assets</span>
                      <span className={`font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                        Rs.{reportData.total_assets?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h5 className={`font-bold mb-3 ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Liabilities & Equity</h5>
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg ${isDarkTheme ? "bg-slate-700/30" : "bg-slate-100"}`}>
                      <div className="flex justify-between text-sm">
                        <span className={isDarkTheme ? "text-slate-300" : "text-slate-700"}>Liabilities</span>
                        <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                          Rs.{reportData.total_liabilities?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${isDarkTheme ? "bg-slate-700/30" : "bg-slate-100"}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={isDarkTheme ? "text-slate-300" : "text-slate-700"}>Equity</span>
                          <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                            Rs.{((reportData.total_equity || 0) - (reportData.net_income || 0)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className={`${isDarkTheme ? "text-slate-400" : "text-slate-600"} pl-3`}>+ Net Income</span>
                          <span className={`font-semibold ${(reportData.net_income || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            Rs.{(reportData.net_income || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-1 border-t border-slate-600">
                          <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Total Equity</span>
                          <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                            Rs.{(reportData.total_equity || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${isDarkTheme ? "bg-blue-900/20 border-blue-600" : "bg-blue-50 border-blue-300"}`}>
                      <div className="flex justify-between">
                        <span className={`font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Total</span>
                        <span className={`font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                          Rs.{reportData.total_liabilities_and_equity?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div className={`p-4 rounded-lg border-2 text-center ${
                Math.abs(reportData.total_assets - reportData.total_liabilities_and_equity) < 0.01
                  ? isDarkTheme ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300"
                  : isDarkTheme ? "bg-red-900/20 border-red-600" : "bg-red-50 border-red-300"
              }`}>
                <p className={`font-semibold ${
                  Math.abs(reportData.total_assets - reportData.total_liabilities_and_equity) < 0.01
                    ? "text-green-500"
                    : "text-red-500"
                }`}>
                  {Math.abs(reportData.total_assets - reportData.total_liabilities_and_equity) < 0.01
                    ? "✓ Balance Sheet is Balanced"
                    : "⚠ Balance Sheet is Not Balanced"}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`text-center py-12 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Generate Report" to view the report</p>
        </div>
      )}
    </div>
  );
}
