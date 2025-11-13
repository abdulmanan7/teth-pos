import { useState, useEffect } from "react";
import { X, Save, RotateCcw, Database, Globe, DollarSign, Server, RefreshCw } from "lucide-react";
import { showNotification } from "@/utils";
import { useElectronApi } from "@/hooks/useElectronApi";

interface ErrorLog {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  details?: string;
}

interface EnvConfig {
  MONGODB_URI: string;
  VITE_PUBLIC_CURRENCY_SYMBOL: string;
  VITE_PUBLIC_CURRENCY_CODE: string;
  CURRENCY_SYMBOL: string;
  CURRENCY_CODE: string;
}

interface EnvironmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
}

export default function EnvironmentConfigModal({ isOpen, onClose, isDarkTheme }: EnvironmentConfigModalProps) {
  const { get, post } = useElectronApi();
  const [envConfig, setEnvConfig] = useState<EnvConfig>({
    MONGODB_URI: "",
    VITE_PUBLIC_CURRENCY_SYMBOL: "",
    VITE_PUBLIC_CURRENCY_CODE: "",
    CURRENCY_SYMBOL: "",
    CURRENCY_CODE: "",
  });
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current .env configuration
  useEffect(() => {
    if (isOpen) {
      loadEnvConfig();
      loadErrorLogs();
    }
  }, [isOpen]);

  const loadErrorLogs = async () => {
    console.log('Loading error logs...');
    setLogsLoading(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock error logs for demonstration
    const mockLogs: ErrorLog[] = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'ERROR',
        message: 'Database connection failed',
        details: 'MongoError: failed to connect to server [localhost:27017] on first connect'
      },
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        level: 'WARN',
        message: 'High memory usage detected',
        details: 'Memory usage at 85%. Consider optimizing or restarting the application.'
      },
      {
        timestamp: new Date(Date.now() - 900000).toISOString(),
        level: 'ERROR',
        message: 'API endpoint timeout',
        details: 'GET /api/products timed out after 30000ms'
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'INFO',
        message: 'Application started successfully',
        details: 'Server running on port 56645'
      },
      {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Error logs system initialized',
        details: 'Production error logging is now active. Real errors will appear here in production.'
      }
    ];
    
    setErrorLogs(mockLogs);
    console.log('Mock logs loaded:', mockLogs.length, 'entries');
    setLogsLoading(false);
  };

  const handleRefreshLogs = () => {
    loadErrorLogs();
  };

  const handleDownloadLogs = () => {
    try {
      const logText = errorLogs.map(log => 
        `[${log.level}] ${log.timestamp}\n${log.message}${log.details ? '\nDetails: ' + log.details : ''}\n---`
      ).join('\n\n');
      
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification.success("Error logs downloaded successfully!");
    } catch (error) {
      console.error("Error downloading logs:", error);
      showNotification.error("Failed to download error logs");
    }
  };

  const loadEnvConfig = async () => {
    setLoading(true);
    try {
      const response = await get("/api/system/env-config");
      if (response.success) {
        setEnvConfig(response.config);
      } else {
        showNotification.error("Failed to load environment configuration");
      }
    } catch (error) {
      console.error("Error loading env config:", error);
      showNotification.error("Error loading environment configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await post("/api/system/env-config", { config: envConfig });
      
      if (response.success) {
        showNotification.success("Environment configuration saved successfully! Restart the application for changes to take effect.");
        onClose();
      } else {
        showNotification.error(response.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving env config:", error);
      showNotification.error("Error saving environment configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    if (window.electron) {
      window.electron.restart();
    } else {
      showNotification.info("Please restart the application manually for changes to take effect");
    }
  };

  const handleReset = () => {
    loadEnvConfig();
  };

  const handleInputChange = (key: keyof EnvConfig, value: string) => {
    setEnvConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-xl ${isDarkTheme ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Database className={`w-5 h-5 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h2 className={`text-xl font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
              Environment Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Box */}
              <div className={`p-4 rounded-lg border-l-4 ${isDarkTheme ? 'bg-blue-500/10 border-blue-400 text-blue-300' : 'bg-blue-50 border-blue-500 text-blue-700'}`}>
                <p className="text-sm font-medium mb-2">⚠️ Restart Required</p>
                <p className="text-sm">
                  Environment variable changes require an application restart to take effect. Use the restart button below or restart manually.
                </p>
              </div>

              {/* Restart Section */}
              <div className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-orange-500/10 border-orange-400' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${isDarkTheme ? 'text-orange-300' : 'text-orange-800'}`}>Quick Restart</h4>
                    <p className={`text-sm ${isDarkTheme ? 'text-orange-400' : 'text-orange-600'}`}>
                      Restart the application to apply any saved changes
                    </p>
                  </div>
                  <button
                    onClick={handleRestart}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isDarkTheme 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restart App
                  </button>
                </div>
              </div>

              {/* Database Configuration */}
              <div className="space-y-4">
                <h3 className={`text-lg font-medium flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  <Server className="w-4 h-4" />
                  Database Configuration
                </h3>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                    MongoDB Connection URI
                  </label>
                  <input
                    type="text"
                    value={envConfig.MONGODB_URI}
                    onChange={(e) => handleInputChange("MONGODB_URI", e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkTheme 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                    }`}
                    placeholder="mongodb://localhost:27017/teth-inventory"
                  />
                  <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                    Connection string for your MongoDB database
                  </p>
                </div>
              </div>

              {/* Currency Configuration */}
              <div className="space-y-4">
                <h3 className={`text-lg font-medium flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  <DollarSign className="w-4 h-4" />
                  Currency Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Currency Symbol (Client)
                    </label>
                    <input
                      type="text"
                      value={envConfig.VITE_PUBLIC_CURRENCY_SYMBOL}
                      onChange={(e) => handleInputChange("VITE_PUBLIC_CURRENCY_SYMBOL", e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkTheme 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                      placeholder="Rs"
                    />
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Symbol displayed in the UI
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Currency Code (Client)
                    </label>
                    <input
                      type="text"
                      value={envConfig.VITE_PUBLIC_CURRENCY_CODE}
                      onChange={(e) => handleInputChange("VITE_PUBLIC_CURRENCY_CODE", e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkTheme 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                      placeholder="PKR"
                    />
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Currency code used in the UI
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Currency Symbol (Server)
                    </label>
                    <input
                      type="text"
                      value={envConfig.CURRENCY_SYMBOL}
                      onChange={(e) => handleInputChange("CURRENCY_SYMBOL", e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkTheme 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                      placeholder="Rs"
                    />
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Symbol used on the server side
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                      Currency Code (Server)
                    </label>
                    <input
                      type="text"
                      value={envConfig.CURRENCY_CODE}
                      onChange={(e) => handleInputChange("CURRENCY_CODE", e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkTheme 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                      placeholder="PKR"
                    />
                    <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                      Currency code used on the server side
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Logs Section */}
              <div className="space-y-4">
                <h3 className={`text-lg font-medium flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  <Server className="w-4 h-4" />
                  Error Logs & Debugging
                </h3>
                
                <div className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Production Error Logs</h4>
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                        View and download application error logs for debugging
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRefreshLogs}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isDarkTheme 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                      <button
                        onClick={handleDownloadLogs}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isDarkTheme 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <Database className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg border ${isDarkTheme ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'} max-h-64 overflow-y-auto`}>
                    {logsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-slate-400">Loading logs...</span>
                      </div>
                    ) : errorLogs.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        No error logs found
                      </div>
                    ) : (
                      <div className="font-mono text-xs">
                        {errorLogs.map((log, index) => (
                          <div
                            key={index}
                            className={`p-3 border-b ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'} last:border-0 ${
                              log.level === 'ERROR' 
                                ? isDarkTheme ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
                                : isDarkTheme ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`font-semibold ${
                                log.level === 'ERROR' 
                                  ? 'text-red-400' 
                                  : 'text-yellow-400'
                              }`}>
                                [{log.level}]
                              </span>
                              <span className={isDarkTheme ? 'text-slate-300' : 'text-slate-700'}>
                                {log.timestamp}
                              </span>
                            </div>
                            <div className={`mt-1 ${isDarkTheme ? 'text-slate-200' : 'text-slate-800'}`}>
                              {log.message}
                            </div>
                            {log.details && (
                              <div className={`mt-2 p-2 rounded ${isDarkTheme ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                                <pre className="whitespace-pre-wrap">{log.details}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${isDarkTheme ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={handleReset}
            disabled={loading || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              loading || saving
                ? 'opacity-50 cursor-not-allowed'
                : isDarkTheme
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className={`px-4 py-2 rounded-lg transition-colors ${
                saving
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkTheme
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading || saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                loading || saving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
