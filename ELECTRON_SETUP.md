# Electron Setup Guide

This project has been converted to Electron with an embedded Express backend. The Electron app runs the React frontend in the renderer process and Express server in the main process.

## Architecture

```
Electron App
├── Main Process (electron/main.ts)
│   ├── Express Server (embedded)
│   └── IPC Handlers (api:call, api:get, api:post)
├── Preload Script (electron/preload.ts)
│   └── Exposes window.electron.api
└── Renderer Process
    ├── React App (client/)
    └── useElectronApi Hook
```

## Key Changes

### 1. **Electron Main Process** (`electron/main.ts`)
- Starts Express server on a random available port
- Creates BrowserWindow and loads React app
- Handles IPC communication between renderer and server
- Provides API handlers: `api:call`, `api:get`, `api:post`

### 2. **Preload Script** (`electron/preload.ts`)
- Exposes safe API methods to renderer process
- Uses context isolation for security
- Provides `window.electron.api` interface

### 3. **React Hook** (`client/hooks/useElectronApi.ts`)
- `useElectronApi()` hook for making API calls
- Falls back to fetch in development mode
- Works in both Electron and web environments

### 4. **Vite Configs**
- `vite.config.ts` - React frontend build
- `vite.config.electron.ts` - Electron main process build
- `vite.config.server.ts` - Express server build (legacy)

## Development

### Start Electron Development

```bash
pnpm install
pnpm dev:electron:watch
```

This will:
1. Watch and rebuild the React frontend
2. Watch and rebuild the Electron main process
3. Launch Electron app with hot reload

### Development Mode
- React app loads from `http://localhost:5173`
- DevTools automatically open
- Express server runs on random port (logged in console)

## Production Build

```bash
pnpm build:electron
pnpm start:electron
```

This will:
1. Build React frontend to `dist/spa/`
2. Build Electron main process to `dist/main.js`
3. Launch Electron app with bundled assets

## Using the API in React Components

### Example with useElectronApi Hook

```typescript
import { useElectronApi } from '@/hooks/useElectronApi';

export function MyComponent() {
  const { get, post, isElectron } = useElectronApi();

  const fetchData = async () => {
    const data = await get('/api/ping');
    console.log(data);
  };

  const sendData = async () => {
    const response = await post('/api/demo', { key: 'value' });
    console.log(response);
  };

  return (
    <div>
      <p>Running in Electron: {isElectron ? 'Yes' : 'No'}</p>
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={sendData}>Send Data</button>
    </div>
  );
}
```

### Direct IPC Usage (Advanced)

```typescript
// In renderer process
const result = await window.electron.api.get('/api/ping');
const result = await window.electron.api.post('/api/demo', { data: 'value' });
const result = await window.electron.api.call('GET', '/api/endpoint', undefined);
```

## Adding New API Routes

1. **Create route handler** in `server/routes/`:
```typescript
import { RequestHandler } from "express";

export const handleMyRoute: RequestHandler = (req, res) => {
  res.json({ message: 'Hello from my endpoint!' });
};
```

2. **Register in** `server/index.ts`:
```typescript
import { handleMyRoute } from "./routes/my-route";

app.get("/api/my-endpoint", handleMyRoute);
```

3. **Use in React** with the hook:
```typescript
const { get } = useElectronApi();
const data = await get('/api/my-endpoint');
```

## File Structure

```
electron/
├── main.ts          # Electron main process
└── preload.ts       # Preload script for context isolation

client/
├── hooks/
│   └── useElectronApi.ts  # React hook for API calls
├── pages/           # React pages
├── components/      # React components
└── App.tsx          # React app entry

server/
├── index.ts         # Express app setup
└── routes/          # API route handlers

vite.config.electron.ts  # Electron main build config
```

## Environment Variables

The Express server port is stored in `process.env.API_PORT` in the main process. This is automatically set when the server starts.

## Security Considerations

- Context isolation is enabled (`contextIsolation: true`)
- Sandbox is enabled (`sandbox: true`)
- Only specific APIs are exposed via preload script
- IPC handlers validate requests before forwarding to Express

## Troubleshooting

### Port Already in Use
The app uses a random available port, so this shouldn't happen. If it does, check for stray Electron processes.

### DevTools Not Opening
In production, DevTools are disabled. To enable, modify `electron/main.ts`:
```typescript
if (isDev) {
  mainWindow.webContents.openDevTools();
}
```

### API Calls Failing
1. Check that Express server started (look for "Express server running on port X" in console)
2. Verify the API endpoint exists in `server/index.ts`
3. Check browser console for IPC errors

## Next Steps

1. Install dependencies: `pnpm install`
2. Start development: `pnpm dev:electron:watch`
3. Build for production: `pnpm build:electron && pnpm start:electron`
