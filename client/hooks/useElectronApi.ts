import { useCallback } from "react";

export function useElectronApi() {
  const isElectron = typeof window !== "undefined" && (window as any).electron;

  const apiCall = useCallback(
    async (method: string, path: string, body?: any) => {
      if (isElectron) {
        console.log("[useElectronApi] Using Electron IPC for:", method, path);
        return (window as any).electron.api.call(method, path, body);
      } else {
        console.log("[useElectronApi] Using fetch for:", method, path);
        const options: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(path, options);
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        return response.json();
      }
    },
    [isElectron]
  );

  const get = useCallback(
    (path: string) => apiCall("GET", path),
    [apiCall]
  );

  const post = useCallback(
    (path: string, body: any) => apiCall("POST", path, body),
    [apiCall]
  );

  const put = useCallback(
    (path: string, body: any) => apiCall("PUT", path, body),
    [apiCall]
  );

  const delete_ = useCallback(
    (path: string) => apiCall("DELETE", path),
    [apiCall]
  );

  return { apiCall, get, post, put, delete: delete_, isElectron };
}
