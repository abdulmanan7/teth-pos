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
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        sandbox: true,
      },
    });

    const startUrl = isDev
      ? "http://localhost:5173"
      : `file://${path.resolve(__dirname, "spa/index.html")}`;

    console.log("__dirname:", __dirname);
    console.log("Loading URL:", startUrl);
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
    // Dynamically import the built server to avoid bundling mongoose
    // The server is built to dist/server/node-build.mjs
    const distPath = path.join(__dirname, "../dist/server");
    const module = await import(path.join(distPath, "node-build.mjs"));
    const createServer = module.createServer;
    
    if (!createServer) {
      throw new Error("createServer not found in server module");
    }
    
    const expressApp = await createServer();
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
