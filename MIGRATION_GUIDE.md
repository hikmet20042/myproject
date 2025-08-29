# Oracle Autonomous JSON Database Migration Guide

## 🎯 Migration Status

✅ **Completed Steps:**
- MongoDB configuration examined
- Oracle connection setup prepared
- Data export scripts created
- Migration scripts created
- MongoDB data successfully exported (1,582 total documents)

⏳ **Next Steps:**
- Set up Oracle connection string
- Test Oracle database connection
- Import data to Oracle
- Verify application functionality

## 📋 Exported Data Summary

Your MongoDB data has been successfully exported:

| Collection | Documents | Status |
|------------|-----------|--------|
| users | 4 | ✅ Exported |
| articles | 2 | ✅ Exported |
| stories | 2 | ✅ Exported |
| events | 1 | ✅ Exported |
| notifications | 11 | ✅ Exported |
| imageblobs | 9 | ✅ Exported |
| newsarticles | 1,545 | ✅ Exported |
| sitesettings | 1 | ✅ Exported |
| useranalytics | 1 | ✅ Exported |
| userpreferences | 1 | ✅ Exported |
| userprofiles | 3 | ✅ Exported |
| vacancies | 3 | ✅ Exported |
| submissions | 0 | ⚠️ Empty |

**Total: 1,582 documents exported**

## 🔧 Setup Oracle Connection

### Step 1: Get Oracle Connection Details

1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Navigate to your Autonomous JSON Database instance
3. Click on **"Database Connection"**
4. Look for **"MongoDB API"** section
5. Copy the connection string (format: `mongodb://hostname:port/database`)

### Step 2: Update Environment Variables

**🔥 IMPORTANT: Use MongoDB API Connection (Recommended for Migration)**

For seamless migration from MongoDB, use the **MongoDB API connection string**:

1. Open your `.env.local` file
2. Add your Oracle MongoDB API connection string:

```env
# MongoDB API Connection (RECOMMENDED for migration)
ORACLE_MONGODB_URI=mongodb://ADMIN:YourPassword@your-oracle-host:27017/your_database

# Keep your existing MongoDB connection as backup
MONGDB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

**Example Oracle MongoDB API connection string:**
```
ORACLE_MONGODB_URI=mongodb://ADMIN:MySecurePassword123@autonomous-db-host.oraclecloud.com:27017/myapp
```

**Alternative: Native Oracle Connection (Advanced Users Only)**

If you prefer native Oracle connection (requires code changes):

```env
# Native Oracle Connection (requires node-oracledb and code modifications)
ORACLE_USER=ADMIN
ORACLE_PASSWORD=YourPassword
ORACLE_CONNECT_STRING=(description=(retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=your-host.oraclecloud.com))(connect_data=(service_name=your_service_name))(security=(ssl_server_dn_match=yes)))
```

⚠️ **Note**: Native connection requires significant code changes and is not recommended for this migration.

### Step 3: Test Oracle Connection

Run the connection test:

```bash
node scripts/test-oracle-connection.js
```

This will verify:
- ✅ Database connectivity
- ✅ Authentication
- ✅ Basic CRUD operations
- ✅ Complex queries
- ✅ Aggregation pipelines
- ✅ Index creation

## 📦 Data Migration Process

### Step 4: Import Data to Oracle

Once the connection test passes, import your data:

```bash
node scripts/import-to-oracle.js
```

This will:
- Connect to Oracle Autonomous JSON Database
- Import all exported collections
- Verify data integrity
- Provide import summary

### Step 5: Switch to Oracle Database

Your application will automatically use Oracle when `ORACLE_MONGODB_URI` is set in `.env.local`. The `mongoose.ts` file has been updated to:

- ✅ Prioritize Oracle over MongoDB
- ✅ Provide clear connection logging
- ✅ Maintain backward compatibility

## 🧪 Testing & Verification

### Step 6: Test Application

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Verify key functionality:**
   - User authentication
   - Article creation/editing
   - Story management
   - Event handling
   - Image uploads
   - Notifications

3. **Check database connections:**
   - Look for "✅ Connected to Oracle Autonomous JSON Database" in logs
   - Verify all CRUD operations work
   - Test search functionality

## 🔄 Rollback Plan

If you need to rollback to MongoDB:

1. **Remove or comment out Oracle connection:**
   ```env
   # ORACLE_MONGODB_URI=mongodb://...
   ```

2. **Ensure MongoDB connection is active:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```

3. **Restart your application**

The application will automatically fall back to MongoDB.

## 📁 Created Files

- `scripts/export-mongodb-data.js` - MongoDB data export script
- `scripts/import-to-oracle.js` - Oracle data import script
- `scripts/test-oracle-connection.js` - MongoDB API connection testing script
- `scripts/oracle-native-connection-test.js` - Native Oracle connection testing script
- `.env.oracle.example` - Environment configuration example
- `exports/` - Directory containing exported MongoDB data
- `MIGRATION_GUIDE.md` - This guide

## 🔀 Connection Methods Comparison

| Feature | MongoDB API | Native Oracle |
|---------|-------------|---------------|
| **Migration Effort** | ✅ Minimal | ❌ Significant |
| **Mongoose Compatibility** | ✅ Full | ❌ None |
| **Code Changes** | ✅ None | ❌ Extensive |
| **Query Syntax** | ✅ MongoDB | ❌ SQL/PL-SQL |
| **Performance** | ✅ Good | ✅ Excellent |
| **Oracle Features** | ⚠️ Limited | ✅ Full Access |
| **Learning Curve** | ✅ Easy | ❌ Steep |

**Recommendation**: Use **MongoDB API** for this migration to maintain compatibility with your existing codebase.

## 🚨 Important Notes

1. **Backup Safety:** Your original MongoDB data is safely exported in the `exports/` directory
2. **Connection Priority:** Oracle takes priority when both connection strings are present
3. **Mongoose Compatibility:** All existing Mongoose models work with Oracle MongoDB API
4. **Performance:** Oracle Autonomous JSON Database provides enterprise-grade performance and reliability

## 🆘 Troubleshooting

### Connection Issues
- Verify Oracle database is running and accessible
- Check IP whitelist in Oracle Cloud Console
- Ensure correct username/password
- Verify connection string format

### Import Issues
- Ensure export completed successfully
- Check Oracle database has sufficient storage
- Verify network connectivity
- Review Oracle Cloud logs

### Application Issues
- Check environment variables are loaded
- Verify all dependencies are installed
- Review application logs for errors
- Test individual API endpoints

## 📞 Next Steps

1. **Set up your Oracle connection string in `.env.local`**
2. **Run the connection test: `node scripts/test-oracle-connection.js`**
3. **Import your data: `node scripts/import-to-oracle.js`**
4. **Test your application: `npm run dev`**

Your migration is ready to proceed! 🚀