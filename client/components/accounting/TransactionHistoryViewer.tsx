import { useState, useEffect } from "react";
import { Loader, Calculator, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useToast } from "@/components/ToastManager";
import type { TransactionLine, ChartOfAccount } from "@shared/api";

interface TransactionHistoryViewerProps {
  isDarkTheme: boolean;
}

export default function TransactionHistoryViewer({ isDarkTheme }: TransactionHistoryViewerProps) {
  const { get } = useElectronApi();
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    account_id: "",
    start_date: "",
    end_date: "",
    reference: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchAccounts = async () => {
    try {
      const data = await get("/api/accounting/accounts");
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.account_id) params.append("account_id", filters.account_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.reference) params.append("reference", filters.reference);

      const data = await get(`/api/accounting/transactions?${params.toString()}`);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      addToast("Failed to load transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (accountId: string | any) => {
    // Handle populated object (when API returns full object instead of just ID)
    if (typeof accountId === 'object' && accountId !== null) {
      return `${accountId.code} - ${accountId.name}`;
    }
    // Handle string ID
    const account = accounts.find((a) => a._id === accountId || a._id.toString() === accountId);
    return account ? `${account.code} - ${account.name}` : "Unknown";
  };

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
      <div>
        <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
          Transaction History
        </h3>
        <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
          View all accounting transactions
        </p>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-lg border ${isDarkTheme ? "bg-slate-700/30 border-slate-600" : "bg-slate-100 border-slate-300"}`}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" />
          <h4 className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>Filters</h4>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <select
            value={filters.account_id}
            onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
            className={`px-3 py-2 rounded border text-sm ${isDarkTheme ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`}
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className={`text-sm ${isDarkTheme ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className={`text-sm ${isDarkTheme ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`}
          />
          <select
            value={filters.reference}
            onChange={(e) => setFilters({ ...filters, reference: e.target.value })}
            className={`px-3 py-2 rounded border text-sm ${isDarkTheme ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300 text-slate-900"}`}
          >
            <option value="">All Types</option>
            <option value="Order">Order</option>
            <option value="PurchaseOrder">Purchase Order</option>
            <option value="JournalEntry">Journal Entry</option>
            <option value="Payment">Payment</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-lg border overflow-hidden ${isDarkTheme ? "border-slate-600" : "border-slate-300"}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkTheme ? "bg-slate-700" : "bg-slate-200"}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Date</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Account</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Type</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Description</th>
                <th className={`px-4 py-3 text-right text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Debit</th>
                <th className={`px-4 py-3 text-right text-xs font-semibold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-12 text-center ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions found</p>
                  </td>
                </tr>
              ) : (
                transactions.map((txn, index) => (
                  <tr
                    key={txn._id}
                    className={`border-t ${isDarkTheme ? "border-slate-700 hover:bg-slate-700/30" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <td className={`px-4 py-3 text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                      {getAccountName(txn.account_id)}
                    </td>
                    <td className={`px-4 py-3 text-sm`}>
                      <span className={`px-2 py-1 rounded text-xs ${isDarkTheme ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                        {txn.reference}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      {txn.description || "-"}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${txn.debit > 0 ? (isDarkTheme ? "text-green-400" : "text-green-600") : (isDarkTheme ? "text-slate-600" : "text-slate-400")}`}>
                      {txn.debit > 0 ? `Rs.${txn.debit.toFixed(2)}` : "-"}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${txn.credit > 0 ? (isDarkTheme ? "text-red-400" : "text-red-600") : (isDarkTheme ? "text-slate-600" : "text-slate-400")}`}>
                      {txn.credit > 0 ? `Rs.${txn.credit.toFixed(2)}` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className={`p-4 rounded-lg border ${isDarkTheme ? "bg-slate-700/30 border-slate-600" : "bg-slate-100 border-slate-300"}`}>
          <div className="flex justify-between items-center">
            <span className={`font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
              Total Transactions: {transactions.length}
            </span>
            <div className="flex gap-6">
              <div className="text-right">
                <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Total Debits</p>
                <p className={`font-bold text-green-500`}>
                  Rs.{transactions.reduce((sum, t) => sum + t.debit, 0).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Total Credits</p>
                <p className={`font-bold text-red-500`}>
                  Rs.{transactions.reduce((sum, t) => sum + t.credit, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
