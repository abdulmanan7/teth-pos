const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  api: {
    call: (method: string, path: string, body?: any) =>
      ipcRenderer.invoke("api:call", { method, path, body }),
    get: (path: string) => ipcRenderer.invoke("api:get", path),
    post: (path: string, body: any) =>
      ipcRenderer.invoke("api:post", path, body),
  },
});

declare global {
  interface Window {
    electron: {
      api: {
        call: (method: string, path: string, body?: any) => Promise<any>;
        get: (path: string) => Promise<any>;
        post: (path: string, body: any) => Promise<any>;
      };
    };
  }
}
