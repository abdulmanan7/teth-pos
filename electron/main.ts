import { app, BrowserWindow, ipcMain, protocol } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "http";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let expressServer: Server | null = null;

const isDev = process.env.NODE_ENV === "development";

async function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      fullscreen: true,
      icon: path.join(__dirname, "../client/assets/logo4.svg"),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        sandbox: true,
      },
    });

    let startUrl: string;

    if (isDev) {
      startUrl = "http://localhost:5173";
    } else if (app.isPackaged) {
      // Production: spa is in resources folder
      startUrl = `file://${path.join(process.resourcesPath, "spa", "index.html")}`;
    } else {
      // Built but not packaged - __dirname is already in dist directory
      startUrl = `file://${path.join(__dirname, "spa", "index.html")}`;
    }

    await mainWindow.loadURL(startUrl);

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (error) {
    console.error("Error creating window:", error);
    process.exit(1);
  }
}

async function startExpressServer() {
  try {
    console.log("Starting Express server...");
    
    // Dynamically import the built server to avoid bundling mongoose
    // In development: dist/server/node-build.mjs
    // In production (packaged): resources/server/node-build.mjs
    let serverPath: string;

    if (app.isPackaged) {
      // Production: server is in resources folder
      serverPath = path.join(process.resourcesPath, "server", "node-build.mjs");
    } else {
      // Development: server is in dist folder
      serverPath = path.join(__dirname, "../dist/server/node-build.mjs");
    }

    console.log("Server path:", serverPath);

    const module = await import(serverPath);
    const createServer = module.createServer;

    if (!createServer) {
      throw new Error("createServer not found in server module");
    }

    console.log("Creating Express app...");
    const expressApp = await createServer();
    console.log("Express app created successfully");
    
    expressServer = expressApp.listen(0, "127.0.0.1", () => {
      const address = expressServer?.address();
      if (address && typeof address !== "string") {
        const port = address.port;
        process.env.API_PORT = port.toString();
        console.log(`Express server running on port ${port}`);
      }
    });
  } catch (error) {
    console.error("Failed to start Express server:", error);
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "Server Error",
      `Failed to start the server: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

app.on("ready", async () => {
  await startExpressServer();
  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers for API calls
ipcMain.handle("api:call", async (_event, { method, path: apiPath, body }) => {
  const address = expressServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("Server not ready");
  }

  const port = address.port;
  const url = `http://127.0.0.1:${port}${apiPath}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
});

// Generic IPC handler for any API endpoint
ipcMain.handle("api:get", async (_event, apiPath: string) => {
  return ipcMain.emit("api:call", null, { method: "GET", path: apiPath });
});

ipcMain.handle("api:post", async (_event, apiPath: string, body: any) => {
  return ipcMain.emit("api:call", null, {
    method: "POST",
    path: apiPath,
    body,
  });
});

ipcMain.handle("app:restart", async () => {
  // Restart the application
  app.relaunch();
  app.exit();
});
