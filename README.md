# Teth POS - Point of Sale System

A production-ready, full-featured Point of Sale (POS) system with comprehensive inventory management, accounting integration, and thermal receipt printing. Built with React, Express, MongoDB, and Electron for desktop deployment.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

## 🚀 Features

### Core POS Features
- **Sales Management**: Fast checkout with barcode scanning support
- **Product Catalog**: Comprehensive product management with SKU tracking
- **Customer Management**: Track customer information and purchase history
- **Payment Processing**: Support for cash, card, and multiple payment methods
- **Thermal Receipt Printing**: Professional receipt generation
- **Discount System**: Per-item and checkout-level discounts with reason tracking

### Inventory Management
- **Multi-Warehouse Support**: Manage inventory across multiple locations
- **Lot Number Tracking**: Track products by manufacturing and expiry dates
- **Serial Number Management**: Individual item tracking for serialized products
- **Stock Adjustments**: Record and approve inventory adjustments
- **Reorder Rules**: Automated reorder point alerts with visual indicators
- **Stock Alerts**: Real-time notifications for low stock, out of stock, and overstock
- **Expiry Notifications**: Track and manage product expiration dates
- **Transaction History**: Complete audit trail of all inventory movements
- **Barcode Scanning**: Quick product lookup and inventory operations

### Procurement
- **Vendor Management**: Maintain vendor database with contact information
- **Purchase Orders**: Create and track purchase orders
- **Goods Receipt**: Record incoming inventory with quality checks
- **Purchase Pricing**: Track purchase prices and cost history

### Accounting Integration
- **Chart of Accounts**: Complete accounting structure
- **Journal Entries**: Automated journal entry creation for transactions
- **Transaction Lines**: Detailed transaction tracking
- **Order Accounting**: Automatic accounting entries for sales orders

### Analytics & Reporting
- **Analytics Dashboard**: Real-time business insights
- **Advanced Reporting**: Customizable reports for sales, inventory, and more
- **Inventory Metrics**: Track stock levels, turnover rates, and more
- **Visual Charts**: Interactive charts using Recharts

### UI/UX Features
- **Dark/Light Theme**: Full theme support across all components
- **Responsive Design**: Works on various screen sizes
- **Modern UI**: Built with Radix UI and TailwindCSS
- **Keyboard Shortcuts**: Fast navigation and operations
- **Real-time Updates**: Live data synchronization

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **pnpm**: v10.14.0 or higher (recommended package manager)
- **MongoDB**: v6 or higher (local or cloud instance)
- **Git**: For version control

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router 6** - SPA routing
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS 3** - Styling
- **Radix UI** - Component library
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Express 5** - Web server
- **MongoDB** - Database
- **Mongoose** - ODM
- **TypeScript** - Type safety

### Desktop
- **Electron** - Desktop application wrapper
- **electron-builder** - Build and packaging

### Development
- **Vitest** - Testing framework
- **ESBuild** - Fast bundling
- **Prettier** - Code formatting

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tooth
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/teth-pos
   
   # Server Configuration
   PORT=8080
   NODE_ENV=development
   
   # Optional: MongoDB Atlas
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teth-pos
   ```

4. **Start MongoDB**
   
   If using local MongoDB:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

## 🚀 Development

### Web Application (Recommended for Development)

Start the development server with hot reload:

```bash
pnpm dev
```

This will:
- Start Vite dev server on `http://localhost:5173`
- Start Express API server on `http://localhost:8080`
- Enable hot module replacement (HMR)
- Open your browser automatically

The app will automatically reload when you make changes to the code.

### Electron Desktop Application

Start the Electron app in development mode:

```bash
pnpm dev:electron
```

This will:
- Build the client and server
- Start the Electron app with the built files
- Useful for testing desktop-specific features

For development with auto-reload:

```bash
pnpm dev:electron:watch
```

## 🏗️ Building for Production

### Web Application Build

Build the client and server for production:

```bash
pnpm build
```

This creates:
- `dist/spa/` - Client-side React application
- `dist/server/` - Server-side Express application

Start the production server:

```bash
pnpm start
```

### Electron Desktop Builds

#### Build for macOS

```bash
# Build for both Intel and Apple Silicon
pnpm dist:mac
```

Output in `release/` folder:
- `Teth POS-1.0.0.dmg` - Intel Mac installer (112 MB)
- `Teth POS-1.0.0-arm64.dmg` - Apple Silicon installer (107 MB)
- `Teth POS-1.0.0-mac.zip` - Intel Mac portable (109 MB)
- `Teth POS-1.0.0-arm64-mac.zip` - Apple Silicon portable (104 MB)

#### Build for Windows

```bash
pnpm dist:win
```

#### Build for Linux

```bash
pnpm dist:linux
```

#### Build for All Platforms

```bash
pnpm dist
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web dev server with HMR |
| `pnpm dev:electron` | Start Electron app (build first) |
| `pnpm dev:electron:watch` | Start Electron with auto-reload |
| `pnpm build` | Build client and server for production |
| `pnpm build:client` | Build only the client |
| `pnpm build:server` | Build only the server |
| `pnpm build:electron` | Build Electron main process |
| `pnpm build:electron:main` | Build Electron entry point |
| `pnpm dist:mac` | Create macOS installers |
| `pnpm dist:win` | Create Windows installers |
| `pnpm dist:linux` | Create Linux installers |
| `pnpm dist` | Create installers for all platforms |
| `pnpm start` | Start production server |
| `pnpm start:electron` | Start Electron app |
| `pnpm test` | Run tests |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm format.fix` | Format code with Prettier |

## 📁 Project Structure

```
tooth/
├── client/                 # React frontend
│   ├── pages/             # Route components
│   │   └── Index.tsx      # Main POS page
│   ├── components/        # Reusable components
│   │   ├── ui/           # UI component library
│   │   ├── modals/       # Modal dialogs
│   │   └── inventory/    # Inventory components
│   ├── assets/           # Images, logos, etc.
│   ├── App.tsx           # App entry point with routing
│   └── global.css        # Global styles and theme
│
├── server/                # Express backend
│   ├── routes/           # API route handlers
│   │   ├── inventory/    # Inventory endpoints
│   │   ├── accounting/   # Accounting endpoints
│   │   ├── orders.ts     # Order management
│   │   ├── products.ts   # Product management
│   │   └── ...
│   ├── db/               # Database layer
│   │   ├── models/       # Mongoose models
│   │   └── connection.ts # MongoDB connection
│   ├── utils/            # Utility functions
│   └── index.ts          # Server entry point
│
├── shared/               # Shared types and interfaces
│   └── api.ts           # API type definitions
│
├── electron/            # Electron desktop app
│   ├── main.ts         # Main process
│   └── preload.ts      # Preload script
│
├── dist/               # Build output
│   ├── spa/           # Client build
│   ├── server/        # Server build
│   ├── main.js        # Electron main
│   └── preload.js     # Electron preload
│
├── release/           # Electron installers
│   ├── mac/          # macOS builds
│   └── ...
│
├── build/            # Electron builder resources
│   └── entitlements.mac.plist
│
├── public/           # Static assets
├── package.json      # Dependencies and scripts
├── vite.config.ts    # Vite configuration
├── electron-builder.json  # Electron builder config
└── tsconfig.json     # TypeScript configuration
```

## 🔧 Configuration

### MongoDB Configuration

Edit `.env` to configure your MongoDB connection:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/teth-pos

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teth-pos?retryWrites=true&w=majority
```

### Port Configuration

Change the server port in `.env`:

```env
PORT=8080
```

### Theme Configuration

Customize colors in `client/global.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... more theme variables */
}
```

## 🎨 Customization

### Adding New Routes

1. Create a component in `client/pages/`
2. Add route in `client/App.tsx`:

```typescript
<Route path="/my-page" element={<MyPage />} />
```

### Adding API Endpoints

1. Create handler in `server/routes/`
2. Register in `server/index.ts`:

```typescript
import { myRoute } from "./routes/my-route";
app.get("/api/my-endpoint", myRoute);
```

### Adding Database Models

1. Create model in `server/db/models/`
2. Export interface and model
3. Use in routes

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Restart MongoDB
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod            # Linux
```

### Port Already in Use

```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear build cache
rm -rf dist release
```

### Electron Build Issues

```bash
# Clear Electron cache
rm -rf ~/Library/Caches/electron
rm -rf ~/Library/Caches/electron-builder
```

## 📱 Deployment

### Web Deployment

Deploy to Netlify or Vercel:

1. Build the project: `pnpm build`
2. Deploy `dist/spa/` folder
3. Set up environment variables on hosting platform
4. Configure MongoDB connection string

### Desktop Distribution

1. Build installers: `pnpm dist:mac` (or other platform)
2. Find installers in `release/` folder
3. Distribute DMG/ZIP files to users
4. Note: Apps are not code-signed (requires Apple Developer certificate)

## 🔐 Security Notes

- **Code Signing**: Electron builds are not code-signed. For production, obtain proper certificates.
- **Environment Variables**: Never commit `.env` files to version control
- **MongoDB**: Use authentication in production environments
- **API Security**: Implement proper authentication and authorization

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `pnpm test`
4. Run type check: `pnpm typecheck`
5. Format code: `pnpm format.fix`
6. Submit a pull request

## 📄 License

Private - All rights reserved

## 👥 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ using React, Express, MongoDB, and Electron**
