import { X, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyNew } from "@/utils";

interface SalesMetric {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  topProduct: string;
}

const SALES_DATA: SalesMetric[] = [
  {
    date: "Jan 15",
    revenue: 2450,
    orders: 18,
    avgOrderValue: 136.11,
    topProduct: "Premium Coffee Beans",
  },
  {
    date: "Jan 14",
    revenue: 1980,
    orders: 14,
    avgOrderValue: 141.43,
    topProduct: "Chocolate Cake",
  },
  {
    date: "Jan 13",
    revenue: 2890,
    orders: 21,
    avgOrderValue: 137.62,
    topProduct: "Fresh Croissant",
  },
  {
    date: "Jan 12",
    revenue: 2150,
    orders: 16,
    avgOrderValue: 134.38,
    topProduct: "Turkey Club",
  },
  {
    date: "Jan 11",
    revenue: 3120,
    orders: 23,
    avgOrderValue: 135.65,
    topProduct: "Organic Tea",
  },
];

export default function SalesReportModal({ isDarkTheme, onClose }: { isDarkTheme: boolean; onClose: () => void }) {
  const totalRevenue = SALES_DATA.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = SALES_DATA.reduce((sum, item) => sum + item.orders, 0);
  const avgRevenue = (totalRevenue / SALES_DATA.length).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg border shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Sales Report</h2>
          <button
            onClick={onClose}
            className={`transition-colors p-1 ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Key Metrics */}
        <div className={`p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
            Last 5 Days Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox isDarkTheme={isDarkTheme} label="Total Revenue" value={`Rs ${totalRevenue.toLocaleString()}`} trend="+12.5%" />
            <MetricBox
              isDarkTheme={isDarkTheme}
              label="Total Orders"
              value={totalOrders.toString()}
              trend="+8.2%"
            />
            <MetricBox isDarkTheme={isDarkTheme} label="Avg Daily Revenue" value={`Rs ${avgRevenue}`} trend="+5.1%" />
            <MetricBox isDarkTheme={isDarkTheme} label="Avg Order Value" value="Rs 137.04" trend="+2.3%" />
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="flex-1 overflow-auto p-6">
          <h3 className={`text-lg font-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Daily Breakdown</h3>
          <div className="space-y-3">
            {SALES_DATA.map((day, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-colors ${isDarkTheme ? 'bg-slate-700/30 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className={`font-bold text-lg ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{day.date}</h4>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrencyNew(day.revenue)}
                  </p>
                </div>

                <div className={`grid grid-cols-3 gap-4 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  <div>
                    <p className={`mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Orders</p>
                    <p className="font-semibold">{day.orders}</p>
                  </div>
                  <div>
                    <p className={`mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Avg Order Value</p>
                    <p className="font-semibold">
                      {formatCurrencyNew(day.avgOrderValue)}
                    </p>
                  </div>
                  <div>
                    <p className={`mb-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>Top Product</p>
                    <p className="font-semibold text-blue-400">
                      {day.topProduct}
                    </p>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDarkTheme ? 'bg-slate-600' : 'bg-slate-300'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all"
                    style={{
                      width: `${(day.revenue / 3500) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t p-6 flex justify-between ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <Button
            onClick={onClose}
            className={isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}
          >
            Close
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MetricBoxProps {
  isDarkTheme: boolean;
  label: string;
  value: string;
  trend: string;
}

function MetricBox({ isDarkTheme, label, value, trend }: MetricBoxProps) {
  return (
    <div className={`p-4 border rounded-lg ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
      <p className={`text-xs mb-2 uppercase font-semibold ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold mb-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-green-400 font-semibold">{trend}</p>
    </div>
  );
}
