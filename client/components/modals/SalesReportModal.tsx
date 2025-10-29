import { X, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function SalesReportModal({ onClose }: { onClose: () => void }) {
  const totalRevenue = SALES_DATA.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = SALES_DATA.reduce((sum, item) => sum + item.orders, 0);
  const avgRevenue = (totalRevenue / SALES_DATA.length).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Sales Report</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Key Metrics */}
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">
            Last 5 Days Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} trend="+12.5%" />
            <MetricBox
              label="Total Orders"
              value={totalOrders.toString()}
              trend="+8.2%"
            />
            <MetricBox label="Avg Daily Revenue" value={`$${avgRevenue}`} trend="+5.1%" />
            <MetricBox label="Avg Order Value" value="$137.04" trend="+2.3%" />
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-lg font-bold text-white mb-4">Daily Breakdown</h3>
          <div className="space-y-3">
            {SALES_DATA.map((day, index) => (
              <div
                key={index}
                className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-white text-lg">{day.date}</h4>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ${day.revenue.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
                  <div>
                    <p className="text-slate-400 mb-1">Orders</p>
                    <p className="font-semibold">{day.orders}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Avg Order Value</p>
                    <p className="font-semibold">
                      ${day.avgOrderValue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Top Product</p>
                    <p className="font-semibold text-blue-400">
                      {day.topProduct}
                    </p>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="mt-3 h-2 bg-slate-600 rounded-full overflow-hidden">
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
        <div className="border-t border-slate-700 p-6 flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
  label: string;
  value: string;
  trend: string;
}

function MetricBox({ label, value, trend }: MetricBoxProps) {
  return (
    <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
      <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">
        {label}
      </p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-green-400 font-semibold">{trend}</p>
    </div>
  );
}
