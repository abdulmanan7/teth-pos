# MongoDB Setup Guide

## Overview
This application now uses MongoDB for storing inventory data (products, customers, orders). The backend automatically connects to MongoDB and seeds the database with demo data on first startup.

## Prerequisites
- MongoDB installed and running locally on port 27017
- Node.js and pnpm installed

## MongoDB Installation

### macOS (using Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Verify MongoDB is running
```bash
mongosh
# You should see the MongoDB shell prompt
```

## Environment Configuration

The `.env` file already contains:
```
MONGODB_URI=mongodb://localhost:27017/tooth-inventory
```

Change this if your MongoDB instance runs on a different host/port.

## Database Structure

### Collections

#### Products
- `_id`: MongoDB ObjectId
- `name`: String (required)
- `sku`: String (required, unique)
- `price`: Number (required)
- `stock`: Number (required)
- `category`: String (required)
- `description`: String (optional)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

#### Customers
- `_id`: MongoDB ObjectId
- `name`: String (required)
- `email`: String (required, unique)
- `phone`: String (required)
- `city`: String (required)
- `totalOrders`: Number (default: 0)
- `totalSpent`: Number (default: 0)
- `joinDate`: Date (default: now)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

#### Orders
- `_id`: MongoDB ObjectId
- `orderNumber`: String (required, unique)
- `customer`: String (required)
- `items`: Array of OrderItems
  - `productId`: String
  - `name`: String
  - `price`: Number
  - `quantity`: Number
- `status`: String (enum: pending, processing, completed, cancelled)
- `total`: Number (required)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `GET /api/orders/status/:status` - Get orders by status
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

## Database Seeding

On first server startup, the application automatically:
1. Connects to MongoDB
2. Checks if data exists
3. Seeds with demo data if empty:
   - 12 products across multiple categories
   - 6 customers
   - 6 sample orders

To reseed the database:
1. Delete the database: `mongosh` → `use tooth-inventory` → `db.dropDatabase()`
2. Restart the server

## Frontend Integration

The frontend components now fetch data from the backend:

### ProductsModal
- Fetches all products on mount
- Displays loading state while fetching
- Filters by search term and category

### CustomersModal
- Fetches all customers on mount
- Displays loading state while fetching
- Filters by search term

### OrdersModal
- Fetches all orders on mount
- Displays loading state while fetching
- Filters by search term and status

## Development

### Start Development Server
```bash
pnpm dev:electron:watch
```

The server will:
1. Start Express server with MongoDB connection
2. Automatically seed database if needed
3. Expose API endpoints

### Testing API Endpoints

Using curl:
```bash
# Get all products
curl http://localhost:3000/api/products

# Get all customers
curl http://localhost:3000/api/customers

# Get all orders
curl http://localhost:3000/api/orders
```

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
brew services start mongodb-community
```

### Database Already Seeded
If you see "Database already seeded", the data exists. To reset:
```bash
mongosh
use tooth-inventory
db.dropDatabase()
```

### Port Already in Use
If port 3000 is in use, set a different port:
```bash
PORT=3001 pnpm dev:electron:watch
```

## Production Deployment

For production, update `MONGODB_URI` to point to your MongoDB Atlas or production instance:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tooth-inventory
```

## Next Steps

1. ✅ MongoDB integration complete
2. ✅ Database models created (Product, Customer, Order)
3. ✅ API routes implemented
4. ✅ Frontend components updated to fetch from DB
5. ✅ Demo data seeding on startup

The application is now fully dynamic with MongoDB backend!
