# Inventory System - Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "Server not ready" Error

**Error Message:**
```
Error invoking remote method 'api:call': Error: Server not ready
```

**Cause:**
The inventory components are trying to fetch data before the Express server has finished initializing and connecting to MongoDB.

**Solution:**
✅ **Already Fixed!** The system now includes:
- **Backend retry logic** - Each API endpoint retries up to 3 times with 500ms delays
- **Frontend retry logic** - Components retry failed requests automatically
- **Graceful degradation** - Shows loading spinner while retrying

**What happens:**
1. Component tries to fetch data
2. If server not ready, it waits 500ms
3. Retries up to 3 times
4. Shows error only if all retries fail

### Issue 2: MongoDB Connection Fails

**Error Message:**
```
❌ MongoDB connection error: Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Cause:**
MongoDB is not running on your system.

**Solution:**

**macOS:**
```bash
# Install MongoDB (if not already installed)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
brew services list
```

**Verify Connection:**
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/tooth-inventory
```

### Issue 3: Empty Lists in Admin Panel

**Symptom:**
Warehouses, Lot Numbers, or Reorder Rules show "No items found"

**Cause:**
Database is empty or hasn't been seeded yet.

**Solution:**
1. Create items through the UI:
   - Click "Add Warehouse" / "Add Lot" / "Add Rule"
   - Fill in required fields
   - Click Create button
2. Or wait for auto-seeding (happens on first request)

### Issue 4: Form Won't Submit

**Symptom:**
Create/Edit buttons don't work, no error message

**Cause:**
- Required fields are empty
- Invalid data format
- Server connection issue

**Solution:**
1. Check all required fields (marked with *)
2. Verify data format (numbers vs text)
3. Check browser console for errors (F12)
4. Try refreshing the page

### Issue 5: Changes Not Appearing in List

**Symptom:**
Created/edited item but list doesn't update

**Cause:**
- List refresh failed
- Server didn't save the data
- Network issue

**Solution:**
1. Close and reopen the admin panel
2. Check browser console for errors
3. Verify item was saved (check database)
4. Try again with different data

## Debugging Steps

### Step 1: Check Server Logs
Look for these in the console:
```
✅ Connected to MongoDB at mongodb://localhost:27017/tooth-inventory
✅ Database seeding completed
```

### Step 2: Check Browser Console
Press `F12` to open developer tools:
- Look for red error messages
- Check Network tab for failed requests
- Look for "Server not ready" messages

### Step 3: Verify MongoDB is Running
```bash
# Check if MongoDB is running
brew services list

# If not running, start it
brew services start mongodb-community
```

### Step 4: Test API Endpoints Directly
```bash
# Test warehouses endpoint
curl http://localhost:8080/api/inventory/warehouses

# Test lot numbers endpoint
curl http://localhost:8080/api/inventory/lot-numbers

# Test reorder rules endpoint
curl http://localhost:8080/api/inventory/reorder-rules
```

## Performance Issues

### Slow Loading

**Cause:**
- MongoDB is slow
- Network latency
- Too many items in database

**Solution:**
1. Check MongoDB performance
2. Add pagination (coming soon)
3. Add indexes (already done)
4. Reduce number of items

### High Memory Usage

**Cause:**
- Large dataset loaded into memory
- Memory leak in component

**Solution:**
1. Restart the application
2. Clear browser cache
3. Check for console errors
4. Report if persists

## Data Issues

### Duplicate Entries

**Cause:**
- Unique constraint not enforced
- Double-click on submit button
- Network retry created duplicate

**Solution:**
1. Delete duplicate manually
2. Refresh page before submitting
3. Wait for confirmation before clicking again

### Missing Data

**Cause:**
- Incomplete form submission
- Database connection lost mid-operation
- Browser crashed

**Solution:**
1. Check if data was partially saved
2. Re-enter and submit again
3. Check database directly

## Advanced Troubleshooting

### Enable Debug Logging

Add to `server/index.ts`:
```typescript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

### Check Database Directly

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/tooth-inventory

# Check warehouses
db.warehouses.find().pretty()

# Check lot numbers
db.lotnumbers.find().pretty()

# Check reorder rules
db.reorderrules.find().pretty()

# Count items
db.warehouses.countDocuments()
db.lotnumbers.countDocuments()
db.reorderrules.countDocuments()
```

### Clear Database and Reseed

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/tooth-inventory

# Drop all collections
db.dropDatabase()

# Exit
exit
```

Then restart the application to trigger auto-seeding.

## When to Report Issues

Report an issue if:
- ❌ Errors persist after retries
- ❌ MongoDB won't connect
- ❌ Data is corrupted or lost
- ❌ Performance is extremely slow
- ❌ UI is unresponsive

Include:
- Error message (exact text)
- Steps to reproduce
- Browser console output
- MongoDB logs
- System info (OS, Node version)

## Quick Fixes Checklist

- [ ] MongoDB is running (`brew services list`)
- [ ] No errors in browser console (F12)
- [ ] All required fields filled in forms
- [ ] Waited for loading spinner to finish
- [ ] Tried refreshing the page
- [ ] Tried closing and reopening admin panel
- [ ] Restarted the application
- [ ] Checked MongoDB connection

---

**Last Updated**: October 26, 2025  
**Version**: 1.0
