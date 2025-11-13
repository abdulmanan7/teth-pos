import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

interface ErrorLog {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  details?: string;
}

// In-memory log storage for demo purposes
// In production, this would read from actual log files or database
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
  }
];

export const getErrorLogs: RequestHandler = (req, res) => {
  try {
    // In a real production environment, you would:
    // 1. Read from actual log files (e.g., Winston logs, PM2 logs)
    // 2. Query from a database collection
    // 3. Read from system journal logs
    
    let logs: ErrorLog[] = [];
    
    // Try to read from a log file if it exists
    const logFilePath = path.join(process.cwd(), 'logs', 'error.log');
    
    if (fs.existsSync(logFilePath)) {
      try {
        const logContent = fs.readFileSync(logFilePath, 'utf-8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        logs = lines.map(line => {
          try {
            const parsed = JSON.parse(line);
            return {
              timestamp: parsed.timestamp || new Date().toISOString(),
              level: parsed.level || 'INFO',
              message: parsed.message || 'Unknown error',
              details: parsed.details || parsed.stack
            };
          } catch {
            // Fallback for non-JSON log lines
            return {
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: line,
              details: undefined
            };
          }
        }).slice(-50); // Get last 50 entries
      } catch (error) {
        console.error('Error reading log file:', error);
        logs = mockLogs;
      }
    } else {
      // Use mock logs if no log file exists
      logs = mockLogs;
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error("Failed to fetch error logs:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch error logs" 
    });
  }
};

// Helper function to log errors (to be used by other parts of the application)
export const logError = (level: 'ERROR' | 'WARN' | 'INFO', message: string, details?: string) => {
  const logEntry: ErrorLog = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details
  };
  
  // In production, you would write this to a file or database
  const logDir = path.join(process.cwd(), 'logs');
  
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFilePath = path.join(logDir, 'error.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFilePath, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
    // Fallback to console logging
    console.log(`[${level}] ${message}`, details || '');
  }
};
