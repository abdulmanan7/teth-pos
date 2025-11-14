import { X, Calculator, BookOpen, FileText, BarChart2, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ChartOfAccountsManager from "@/components/accounting/ChartOfAccountsManager";
import JournalEntryManager from "@/components/accounting/JournalEntryManager";
import TransactionHistoryViewer from "@/components/accounting/TransactionHistoryViewer";
import FinancialReports from "@/components/accounting/FinancialReports";
import { useElectronApi } from "@/hooks/useElectronApi";
import { useNotifications } from "@/utils/notifications";

interface AccountingModalProps {
  isDarkTheme: boolean;
  onClose: () => void;
}

type AccountingTab = 'accounts' | 'journal' | 'transactions' | 'reports' | 'settings';

export default function AccountingModal({ isDarkTheme, onClose }: AccountingModalProps) {
  const notify = useNotifications();
  const { post } = useElectronApi();
  const [activeTab, setActiveTab] = useState<AccountingTab>('accounts');

  const tabs = [
    { id: 'accounts' as AccountingTab, label: 'Chart of Accounts', icon: BookOpen },
    { id: 'journal' as AccountingTab, label: 'Journal Entries', icon: FileText },
    { id: 'transactions' as AccountingTab, label: 'Transactions', icon: Calculator },
    { id: 'reports' as AccountingTab, label: 'Reports', icon: BarChart2 },
    { id: 'settings' as AccountingTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg border shadow-xl w-full max-w-7xl h-[90vh] flex flex-col ${isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-blue-600' : 'bg-blue-100'}`}>
              <Calculator className={`w-6 h-6 ${isDarkTheme ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                Accounting System
              </h2>
              <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                Double Entry Bookkeeping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 px-6 pt-4 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-colors ${
                  isActive
                    ? isDarkTheme
                      ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                      : 'bg-slate-100 text-slate-900 border-b-2 border-blue-600'
                    : isDarkTheme
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'accounts' && <ChartOfAccountsManager isDarkTheme={isDarkTheme} />}
          {activeTab === 'journal' && <JournalEntryManager isDarkTheme={isDarkTheme} />}
          {activeTab === 'transactions' && <TransactionHistoryViewer isDarkTheme={isDarkTheme} />}
          {activeTab === 'reports' && <FinancialReports isDarkTheme={isDarkTheme} />}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Accounting Settings
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                    <h4 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      Initialize Chart of Accounts
                    </h4>
                    <p className={`text-sm mb-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Set up the default chart of accounts with standard account types and categories.
                      This only needs to be done once.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          const data = await post('/api/accounting/initialize', {});
                          notify.success(data.message || 'Chart of accounts initialized successfully!');
                        } catch (error) {
                          console.error('Error initializing accounts:', error);
                          notify.error('Error initializing accounts');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Initialize Accounts
                    </Button>
                  </div>

                  <div className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                    <h4 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                      Accounting Information
                    </h4>
                    <div className={`space-y-2 text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      <p>• <strong>Double Entry System:</strong> Every transaction has equal debits and credits</p>
                      <p>• <strong>Automatic Entries:</strong> Orders automatically create accounting entries</p>
                      <p>• <strong>Account Types:</strong> Assets, Liabilities, Equity, Income, COGS, Expenses</p>
                      <p>• <strong>Reports:</strong> Trial Balance, Income Statement, Balance Sheet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t p-6 flex justify-end ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <Button
            onClick={onClose}
            className={isDarkTheme ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
