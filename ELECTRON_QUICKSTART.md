# Electron Quick Start

## Installation

```bash
pnpm install
```

## Development

### Watch Mode (Recommended)
```bash
pnpm dev:electron:watch
```
This starts Electron with hot reload for both frontend and backend.

### Manual Development
```bash
# Terminal 1: Build frontend
pnpm build:client --watch

# Terminal 2: Build Electron main
vite build --config vite.config.electron.ts --watch

# Terminal 3: Run Electron
electron .
```

## Production Build

```bash
pnpm build:electron
pnpm start:electron
```

## Using APIs in Your React Components

### Simple Example

```typescript
import { useElectronApi } from '@/hooks/useElectronApi';

export function MyComponent() {
  const { get, post } = useElectronApi();

  const handleClick = async () => {
    // GET request
    const pingData = await get('/api/ping');
    console.log(pingData); // { message: 'ping' }

    // POST request
    const demoData = await post('/api/demo', { key: 'value' });
    console.log(demoData);
  };

  return <button onClick={handleClick}>Call API</button>;
}
```

## Project Structure

```
your-app/
├── electron/                 # Electron main process
│   ├── main.ts              # App entry, server setup, IPC handlers
│   └── preload.ts           # Safe API exposure to renderer
├── client/                   # React frontend
│   ├── hooks/
│   │   └── useElectronApi.ts # Hook for API calls
│   ├── pages/               # Route components
│   ├── components/          # React components
│   └── App.tsx              # App entry
├── server/                   # Express backend
│   ├── index.ts             # Express setup
│   └── routes/              # API handlers
├── vite.config.ts           # Frontend build config
├── vite.config.electron.ts  # Electron main build config
└── package.json
```

## Adding a New API Endpoint

### Step 1: Create Route Handler
Create `server/routes/users.ts`:
```typescript
import { RequestHandler } from "express";

export const handleGetUsers: RequestHandler = (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);
};
```

### Step 2: Register Route
In `server/index.ts`:
```typescript
import { handleGetUsers } from "./routes/users";

export function createServer() {
  const app = express();
  
  // ... existing middleware ...
  
  app.get("/api/users", handleGetUsers);
  
  return app;
}
```

### Step 3: Use in React
```typescript
import { useElectronApi } from '@/hooks/useElectronApi';

export function UsersList() {
  const { get } = useElectronApi();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    get('/api/users').then(setUsers);
  }, []);

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

## Debugging

### Check Server Status
The Express server port is logged when it starts:
```
Express server running on port 12345
```

### View IPC Messages
Add logging in `electron/main.ts`:
```typescript
ipcMain.handle("api:call", async (_event, { method, path: apiPath, body }) => {
  console.log(`IPC Call: ${method} ${apiPath}`, body);
  // ... rest of handler
});
```

### Browser DevTools
DevTools open automatically in development mode. Use the Console tab to debug API calls.

## Common Issues

### "Cannot find module 'electron'"
Run `pnpm install` to install dependencies.

### App won't start
1. Check that port 5173 is available (Vite dev server)
2. Check console for Express server errors
3. Try `pnpm dev:electron` instead of watch mode

### API calls return 404
1. Verify endpoint exists in `server/index.ts`
2. Check the path matches exactly (case-sensitive)
3. Restart Electron app after adding new routes

## Next Steps

1. ✅ Install: `pnpm install`
2. ✅ Start: `pnpm dev:electron:watch`
3. 📝 Read: `ELECTRON_SETUP.md` for detailed documentation
4. 🚀 Build: `pnpm build:electron` for production
