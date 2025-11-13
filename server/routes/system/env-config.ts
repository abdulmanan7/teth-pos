import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EnvConfig {
  VITE_PUBLIC_BUILDER_KEY: string;
  PING_MESSAGE: string;
  MONGODB_URI: string;
  VITE_PUBLIC_CURRENCY_SYMBOL: string;
  VITE_PUBLIC_CURRENCY_CODE: string;
  CURRENCY_SYMBOL: string;
  CURRENCY_CODE: string;
}

// Parse .env file content into an object
const parseEnvFile = (content: string): Partial<EnvConfig> => {
  const config: Partial<EnvConfig> = {};
  const lines = content.split('\n');
  
  lines.forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }
    
    // Parse key=value pairs
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Only include known environment variables
      if (key in config || key === 'VITE_PUBLIC_BUILDER_KEY' || key === 'PING_MESSAGE' || 
          key === 'MONGODB_URI' || key === 'VITE_PUBLIC_CURRENCY_SYMBOL' || 
          key === 'VITE_PUBLIC_CURRENCY_CODE' || key === 'CURRENCY_SYMBOL' || 
          key === 'CURRENCY_CODE') {
        (config as any)[key] = value;
      }
    }
  });
  
  return config;
};

// Convert config object back to .env file format
const formatEnvFile = (config: Partial<EnvConfig>, originalContent: string): string => {
  const lines = originalContent.split('\n');
  const result: string[] = [];
  
  // Create a map of new values for quick lookup
  const newValues = new Map<string, string>();
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined) {
      newValues.set(key, value);
    }
  });
  
  // Process each line
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Keep comments and empty lines as-is
    if (trimmedLine.startsWith('#') || !trimmedLine) {
      result.push(line);
      return;
    }
    
    // Parse key=value pairs
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const originalQuotes = match[2].trim();
      
      // Update known environment variables
      if (newValues.has(key)) {
        const newValue = newValues.get(key)!;
        // Preserve original quote style if possible
        if ((originalQuotes.startsWith('"') && originalQuotes.endsWith('"')) || 
            (originalQuotes.startsWith("'") && originalQuotes.endsWith("'"))) {
          const quote = originalQuotes[0];
          result.push(`${key}=${quote}${newValue}${quote}`);
        } else if (originalQuotes.includes(' ') || originalQuotes.includes('#')) {
          // Add quotes if value contains spaces or special characters
          result.push(`${key}="${newValue}"`);
        } else {
          result.push(`${key}=${newValue}`);
        }
        // Remove from map to track which ones we've updated
        newValues.delete(key);
      } else {
        // Keep unknown variables as-is
        result.push(line);
      }
    } else {
      // Keep malformed lines as-is
      result.push(line);
    }
  });
  
  // Add any new variables that weren't in the original file
  newValues.forEach((value, key) => {
    result.push(`${key}=${value}`);
  });
  
  return result.join('\n');
};

// GET /api/system/env-config - Read current .env configuration
export const getEnvConfig: RequestHandler = (req, res) => {
  try {
    // Use process.cwd() to get the project root where .env file is located
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      return res.status(404).json({ 
        success: false, 
        message: ".env file not found" 
      });
    }
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const config = parseEnvFile(envContent);
    
    res.json({
      success: true,
      config: {
        VITE_PUBLIC_BUILDER_KEY: config.VITE_PUBLIC_BUILDER_KEY || "",
        PING_MESSAGE: config.PING_MESSAGE || "",
        MONGODB_URI: config.MONGODB_URI || "",
        VITE_PUBLIC_CURRENCY_SYMBOL: config.VITE_PUBLIC_CURRENCY_SYMBOL || "",
        VITE_PUBLIC_CURRENCY_CODE: config.VITE_PUBLIC_CURRENCY_CODE || "",
        CURRENCY_SYMBOL: config.CURRENCY_SYMBOL || "",
        CURRENCY_CODE: config.CURRENCY_CODE || "",
      }
    });
  } catch (error) {
    console.error("Error reading .env file:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to read .env file" 
    });
  }
};

// POST /api/system/env-config - Update .env configuration
export const updateEnvConfig: RequestHandler = (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid configuration data" 
      });
    }
    
    // Use process.cwd() to get the project root where .env file is located
    const envPath = path.join(process.cwd(), '.env');
    
    // Read existing .env file
    let originalContent = "";
    if (fs.existsSync(envPath)) {
      originalContent = fs.readFileSync(envPath, 'utf-8');
    } else {
      // Create a new .env file with header comment if it doesn't exist
      originalContent = "# .env is better suited for public variables, ie, variables that should not commited\n";
      originalContent += "# For secret variables is better to use DevServerControl tool with set_env_variable: [\"KEY\", \"SECRET\"]\n\n";
    }
    
    // Validate and sanitize the configuration
    const validConfig: Partial<EnvConfig> = {};
    const allowedKeys = [
      'VITE_PUBLIC_BUILDER_KEY',
      'PING_MESSAGE', 
      'MONGODB_URI',
      'VITE_PUBLIC_CURRENCY_SYMBOL',
      'VITE_PUBLIC_CURRENCY_CODE',
      'CURRENCY_SYMBOL',
      'CURRENCY_CODE'
    ];
    
    allowedKeys.forEach(key => {
      if (config[key] !== undefined && typeof config[key] === 'string') {
        // Basic validation
        if (key === 'MONGODB_URI') {
          // Validate MongoDB URI format
          try {
            new URL(config[key]);
            validConfig[key as keyof EnvConfig] = config[key];
          } catch {
            // If it's not a valid URL, still allow it (might be a connection string)
            validConfig[key as keyof EnvConfig] = config[key];
          }
        } else {
          validConfig[key as keyof EnvConfig] = config[key];
        }
      }
    });
    
    // Generate new .env content
    const newContent = formatEnvFile(validConfig, originalContent);
    
    // Write back to .env file
    fs.writeFileSync(envPath, newContent, 'utf-8');
    
    res.json({
      success: true,
      message: "Environment configuration updated successfully",
      config: validConfig
    });
    
  } catch (error) {
    console.error("Error updating .env file:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update .env file" 
    });
  }
};
