# MongoDB Quick Start Guide

## 1️⃣ Install MongoDB (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

## 2️⃣ Verify MongoDB is Running

```bash
mongosh
# You should see: test>
# Type: exit
```

## 3️⃣ Install Dependencies

```bash
cd /Users/abdulmanan/troon/tooth
pnpm install
```

## 4️⃣ Start the Application

```bash
pnpm dev:electron:watch
```

## 5️⃣ View Your Data

1. Open the Electron app
2. Click **Products**, **Customers**, or **Orders** buttons
3. Data is now fetched from MongoDB! 🎉

## What Happens Automatically

✅ MongoDB connects to `mongodb://localhost:27017/tooth-inventory`
✅ Database is created automatically
✅ Demo data is seeded on first startup:
   - 12 products (Coffee, Tea, Bakery, Sandwiches, Salads)
   - 6 customers with order history
   - 6 sample orders

## Check Your Data

```bash
mongosh
use tooth-inventory
db.products.find()
db.customers.find()
db.orders.find()
```

## Stop MongoDB

```bash
brew services stop mongodb-community
```

## Troubleshooting

### MongoDB not running?
```bash
brew services start mongodb-community
```

### Port 27017 already in use?
```bash
# Find process using port 27017
lsof -i :27017
# Kill it if needed
kill -9 <PID>
```

### Want to reset data?
```bash
mongosh
use tooth-inventory
db.dropDatabase()
# Restart the app to reseed
```

## Next Steps

- ✅ Database is live
- ✅ All data is dynamic
- ✅ Ready for production

See `MONGODB_SETUP.md` for detailed documentation.
