# Supabase Cloud Sync Setup Guide

## Overview

This guide will help you set up Supabase to enable multi-branch synchronization for your Jewellery ERP system. After setup, all your branches will automatically sync data through the cloud while maintaining offline capability.

**Time Required:** 15-20 minutes
**Cost:** Free tier (up to 500MB database, 2GB bandwidth/month)

---

## Prerequisites

Before starting, make sure you have:
- [x] Local application running (completed Day 1 setup)
- [x] Internet connection
- [x] GitHub account or email for Supabase signup
- [x] Your `database/schema.sql` file ready

---

## Step 1: Create Supabase Account

### 1.1 Visit Supabase Website

1. Open your browser and go to: **https://supabase.com**
2. Click the **"Start your project"** button in the top right

### 1.2 Sign Up

**Option A: Sign up with GitHub (Recommended)**
1. Click "Sign in with GitHub"
2. Authorize Supabase to access your GitHub account
3. You'll be redirected to the Supabase dashboard

**Option B: Sign up with Email**
1. Click "Sign up with email"
2. Enter your email address
3. Check your email for verification link
4. Click the verification link
5. Set your password

**✓ Checkpoint:** You should now see the Supabase dashboard with "New Project" button

---

## Step 2: Create New Project

### 2.1 Click "New Project"

1. Click the green **"New project"** button
2. If you don't have an organization, create one first:
   - Enter organization name: e.g., "My Jewellery Business"
   - Click "Create organization"

### 2.2 Configure Project Settings

Fill in the project details:

**Project Name:**
```
jewellery-erp
```
(Or any name you prefer)

**Database Password:**
```
[Create a strong password and SAVE IT]
```
**IMPORTANT:**
- Use a password manager or write it down securely
- You'll need this password to access the database
- Example: `JewelERP@2025!Secure`

**Region:**
Select the region closest to your business location:
- **India:** `ap-south-1` (Mumbai)
- **USA:** `us-east-1` (N. Virginia)
- **Europe:** `eu-west-1` (Ireland)
- **Asia Pacific:** `ap-southeast-1` (Singapore)

**Pricing Plan:**
- Select **"Free"** tier (sufficient for testing and small deployments)
- You can upgrade later if needed

### 2.3 Create Project

1. Click **"Create new project"** button
2. Wait 2-3 minutes while Supabase sets up your database
3. You'll see a progress indicator

**✓ Checkpoint:** Project creation complete when you see the project dashboard

---

## Step 3: Get API Credentials

### 3.1 Navigate to Project Settings

1. In the left sidebar, click the **⚙️ Settings** icon (gear icon at bottom)
2. Click **"API"** in the settings menu

### 3.2 Copy Project URL

1. Find the **"Project URL"** section
2. It looks like: `https://xxxxxxxxxxxxx.supabase.co`
3. Click the **📋 Copy** icon next to it
4. **SAVE THIS** - you'll need it for your `.env` file

**Example:**
```
https://abcdefghijklmnop.supabase.co
```

### 3.3 Copy API Key

1. Scroll down to **"Project API keys"** section
2. Find the **"anon public"** key (NOT the service_role key)
3. It starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Click the **📋 Copy** icon
5. **SAVE THIS** - you'll need it for your `.env` file

**⚠️ IMPORTANT:**
- Use the **`anon public`** key (safe for client apps)
- DO NOT use the **`service_role`** key (it has full admin access)

**✓ Checkpoint:** You have both URL and API key saved

---

## Step 4: Run Database Schema

### 4.1 Open SQL Editor

1. In left sidebar, click **SQL Editor** icon (</> symbol)
2. Click **"New query"** button

### 4.2 Load Schema File

**On Windows:**
1. Open File Explorer
2. Navigate to: `C:\Users\Admin\Downloads\harry\Dhandha\Dhandha\database\`
3. Right-click `schema.sql` → **Open with → Notepad**
4. Press `Ctrl+A` to select all
5. Press `Ctrl+C` to copy

**On Mac/Linux:**
1. Open Terminal
2. Run: `cat database/schema.sql | pbcopy` (Mac) or use text editor

### 4.3 Paste and Execute Schema

1. Go back to Supabase SQL Editor
2. Click in the query editor area
3. Press `Ctrl+V` (or `Cmd+V` on Mac) to paste
4. Click **"Run"** button (or press `Ctrl+Enter`)
5. Wait for execution (may take 10-20 seconds)

**Expected Output:**
```
Success. No rows returned
```

**✓ Checkpoint:** Schema created successfully

### 4.4 Verify Tables Created

1. In left sidebar, click **Table Editor** icon
2. You should see all your tables:
   - users
   - products
   - categories
   - metal_types
   - customers
   - invoices
   - ... (50+ tables)

**Troubleshooting:**
If you get errors about existing tables:
1. Run this first to reset:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
2. Then re-run the full schema

---

## Step 5: Configure Local Application

### 5.1 Open .env File

**On Windows:**
1. Open File Explorer
2. Navigate to: `C:\Users\Admin\Downloads\harry\Dhandha\Dhandha\`
3. Look for `.env` file
   - If you don't see it, look for `.env.example`
   - Copy `.env.example` → `.env`

**On Mac/Linux:**
```bash
cd ~/Downloads/harry/Dhandha/Dhandha
cp .env.example .env
nano .env
```

### 5.2 Add Supabase Credentials

Open `.env` file and find/add these lines:

```env
# Supabase Cloud Sync
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

**Replace:**
- `https://xxxxxxxxxxxxx.supabase.co` with YOUR Project URL from Step 3.2
- `eyJhbGciOi...` with YOUR anon public key from Step 3.3

**Example (with dummy values):**
```env
# Supabase Cloud Sync
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### 5.3 Save File

1. Press `Ctrl+S` to save (or `Cmd+S` on Mac)
2. Close the editor

**✓ Checkpoint:** .env file updated with Supabase credentials

---

## Step 6: Start Application

### 6.1 Start PostgreSQL (Local Database)

**On Windows:**
```bash
docker-compose up -d
```

**On Mac/Linux:**
```bash
docker-compose up -d
```

**Expected Output:**
```
Creating dhandha_postgres_1 ... done
Creating dhandha_pgadmin_1  ... done
```

### 6.2 Install Dependencies (First Time Only)

```bash
npm install
```

### 6.3 Start Application

**Terminal 1 - Start Vite (React Dev Server):**
```bash
npm run dev
```

**Expected Output:**
```
VITE v5.0.8  ready in 823 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Terminal 2 - Start Electron:**
```bash
npm start
```

**Expected Output in Console:**
```
🚀 Starting Jewellery ERP System...
⚙  Initializing database...
✓ Database connection established successfully
✓ Database schema initialized
✓ Models initialized and synced
⚙  Setting up IPC handlers...
✓ Authentication IPC handlers registered
✓ Sync IPC handlers registered
✓ All IPC handlers registered successfully
✓ Supabase client initialized successfully
✓ Sync status initialized for branch 1
✓ Periodic sync started (every 5 minutes)
✓ Sync service initialized successfully
✓ Application window loaded successfully
✓ Application started successfully
```

**✓ Checkpoint:** Application running with Supabase enabled

---

## Step 7: Verify Sync is Working

### 7.1 Login to Application

1. Application window should open automatically
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`

### 7.2 Check Dashboard for Sync Card

1. After login, you should see the Dashboard
2. Scroll down - you should see **"Multi-Branch Sync Status"** card
3. Card should show:
   - ✓ **Sync Status:** Active (green badge)
   - **Last Sync:** Never or Just now
   - **Pending Changes:** 0
   - **Sync Interval:** 5 minutes

**If you DON'T see the sync card:**
- Supabase is not configured properly
- Check console logs for errors
- Verify `.env` file has correct credentials

### 7.3 Test Manual Sync

1. Click the **"Sync Now"** button on the sync card
2. You should see a success message:
   ```
   Sync completed! Pushed: 0, Pulled: 0
   ```
3. The sync card should update with "Last Sync: Just now"

**✓ Checkpoint:** Manual sync working successfully

---

## Step 8: Verify Data in Supabase

### 8.1 Check Tables in Supabase

1. Go back to Supabase dashboard (https://app.supabase.com)
2. Click **Table Editor** in left sidebar
3. Click on **`users`** table
4. You should see the admin user:
   - id: 1
   - username: admin
   - email: admin@jewellerysoftware.com
   - is_active: true

### 8.2 Check Sync Tables

1. Click on **`sync_status`** table
2. You should see one row:
   - branch_id: 1
   - sync_enabled: true
   - last_sync_at: (recent timestamp)

3. Click on **`sync_queue`** table
4. Should be empty (or have records if you've made changes)

**✓ Checkpoint:** Data syncing between local and cloud

---

## Step 9: Test Multi-Branch Sync (Optional)

**This step is optional but recommended for multi-branch setups**

### 9.1 Setup Second Branch

**Option A: Different Computer**
1. Install the application on another computer
2. Use the SAME `.env` credentials (same SUPABASE_URL and SUPABASE_KEY)
3. Start the application
4. Login

**Option B: Same Computer (Testing)**
1. Copy the entire project to a different folder
2. Change the local database port in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Changed from 5432
   ```
3. Update database port in `.env`:
   ```env
   DB_PORT=5433
   ```
4. Start the application

### 9.2 Change Branch ID

**On Second Branch:**
1. Connect to local database
2. Run SQL:
   ```sql
   UPDATE sync_status SET branch_id = 2 WHERE branch_id = 1;
   ```

### 9.3 Test Sync Between Branches

**On Branch 1:**
1. Create a test user or customer
2. Click "Sync Now"
3. Should see "Pushed: 1" in success message

**On Branch 2:**
1. Wait 30 seconds or click "Sync Now"
2. Should see "Pulled: 1" in success message
3. The test user/customer should appear in your local data

**✓ Checkpoint:** Multi-branch sync working!

---

## Troubleshooting

### Issue: "Supabase not configured" message in dashboard

**Solution:**
1. Check `.env` file exists and has SUPABASE_URL and SUPABASE_KEY
2. Restart the application after editing `.env`
3. Check console logs for specific errors

### Issue: "Connection failed" error when clicking Sync Now

**Possible Causes:**
- ❌ Incorrect Supabase URL
- ❌ Incorrect API key
- ❌ Internet connection down
- ❌ Using `service_role` key instead of `anon` key

**Solution:**
1. Verify credentials in `.env` match Supabase dashboard
2. Check internet connection
3. Make sure you copied the **anon public** key, not service_role

### Issue: "Schema not found" errors during sync

**Solution:**
1. Go to Supabase SQL Editor
2. Re-run the full `schema.sql` script
3. Verify all tables created in Table Editor

### Issue: Pending changes stuck (not syncing)

**Solution:**
1. Check `sync_queue` table in Supabase for errors
2. Look at `sync_error` column
3. Common issue: Column name mismatch between local and cloud
4. Solution: Re-run schema.sql in Supabase

### Issue: Two branches syncing same data incorrectly

**Solution:**
1. Verify each branch has DIFFERENT `branch_id`:
   ```sql
   SELECT * FROM sync_status;
   ```
2. Should show different branch_id values (1, 2, 3, etc.)
3. Update if needed:
   ```sql
   UPDATE sync_status SET branch_id = 2 WHERE id = 1;
   ```

---

## Configuration Options

### Change Sync Interval

**Default:** 5 minutes

**To change to 10 minutes:**
1. In application, open browser console (F12)
2. Run:
   ```javascript
   await window.electronAPI.sync.updateInterval(10)
   ```

**Or via SQL:**
```sql
UPDATE sync_status SET sync_interval_minutes = 10 WHERE branch_id = 1;
```

### Disable Sync Temporarily

**In application console:**
```javascript
await window.electronAPI.sync.toggleSync(false)
```

**Re-enable:**
```javascript
await window.electronAPI.sync.toggleSync(true)
```

### Cleanup Old Sync Records

**Keep last 7 days only:**
```javascript
await window.electronAPI.sync.cleanup(7)
```

---

## Security Best Practices

### 1. Use Row Level Security (RLS) - Advanced

**Purpose:** Prevent branches from accessing each other's sensitive data

**Setup in Supabase SQL Editor:**

```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow branches to read all products (for sync)
CREATE POLICY "Allow sync reads on products"
ON products
FOR SELECT
USING (true);

-- Allow branches to modify only their own data
CREATE POLICY "Branch isolation for products updates"
ON products
FOR ALL
USING (branch_id = current_setting('app.current_branch_id', true)::integer);
```

**Repeat for other tables:** categories, customers, invoices, etc.

### 2. Rotate API Keys Periodically

**Every 6-12 months:**
1. Go to Supabase Settings → API
2. Click "Generate new anon key"
3. Update all branches with new key

### 3. Use Environment-Specific Keys

**For production vs. development:**
- Create separate Supabase projects
- Use different API keys for each environment

---

## Monitoring & Maintenance

### Check Sync Health

**In Dashboard:**
- Green badge = Healthy
- Yellow badge = Pending changes
- Red badge = Sync errors

**In Console:**
```javascript
const status = await window.electronAPI.sync.getStatus();
console.log(status);
```

### View Sync Logs

**Local Logs:**
```bash
# View application logs
tail -f logs/app.log
```

**Supabase Logs:**
1. Go to Supabase Dashboard
2. Click "Logs" in left sidebar
3. Filter by "postgres" or "api"

### Database Usage

**Check storage used:**
1. Supabase Dashboard → Settings → Usage
2. Monitor:
   - Database size
   - Bandwidth usage
   - API requests

**Free tier limits:**
- Database: 500 MB
- Bandwidth: 2 GB/month
- API requests: Unlimited

---

## Next Steps

Now that Supabase is configured:

1. ✅ **Supabase Setup Complete!**
2. 🔄 Continue with Day 2: Service Layer Implementation
3. 🎨 Continue with Frontend Development
4. 🧪 Test multi-branch scenarios
5. 📊 Monitor sync performance

---

## Support & Resources

**Supabase Documentation:**
- Docs: https://supabase.com/docs
- API Reference: https://supabase.com/docs/reference/javascript
- SQL Reference: https://supabase.com/docs/guides/database

**Community:**
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

**Your Application:**
- Plan File: `C:\Users\Admin\.claude\plans\expressive-snacking-eich.md`
- Sync Implementation: `SYNC_IMPLEMENTATION.md`
- General Setup: `SETUP_GUIDE.md`

---

## Summary Checklist

Before proceeding to Day 2, verify:

- [ ] Supabase account created
- [ ] Project created and database initialized
- [ ] Schema.sql executed successfully in Supabase
- [ ] API credentials copied (URL + anon key)
- [ ] .env file updated with credentials
- [ ] Application starts without errors
- [ ] "Multi-Branch Sync Status" card visible in Dashboard
- [ ] Manual sync works (Sync Now button)
- [ ] Data appears in Supabase Table Editor
- [ ] (Optional) Multi-branch sync tested

If all checkboxes are ✓, you're ready to continue with Product Management implementation!

---

**Congratulations! Your Jewellery ERP now has cloud synchronization enabled! 🎉**
