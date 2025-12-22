# Multi-Branch Sync Implementation - Complete

## Overview

Your Jewellery ERP now has **hybrid architecture** with local-first database and cloud synchronization capabilities!

## Architecture Explained

### Local-First + Cloud Sync

```
┌─────────────────────────────────────────┐
│         Branch A (Shop 1)               │
│  ┌───────────────────────────────────┐  │
│  │  Electron App                      │  │
│  │  Local PostgreSQL (Docker)         │  │
│  │  Works Offline ✓                   │  │
│  └───────────────────────────────────┬┘  │
└─────────────────────────────────────┼────┘
                                      │
                    Background Sync   │
                    (Every 5 min)     │
                                      ▼
              ┌──────────────────────────────┐
              │  Supabase Cloud Database     │
              │  (Central Sync Hub)          │
              └──────────────────────────────┘
                                      │
                    Background Sync   │
                    (Every 5 min)     │
                                      ▼
┌─────────────────────────────────────┼────┐
│  ┌───────────────────────────────┬──┘    │
│  │  Electron App                 │       │
│  │  Local PostgreSQL (Docker)    │       │
│  │  Works Offline ✓              │       │
│  └───────────────────────────────┘       │
│         Branch B (Shop 2)                │
└──────────────────────────────────────────┘
```

## What Was Implemented ✓

### 1. Package Dependencies
**File:** `package.json`
- Added `@supabase/supabase-js@^2.39.0`

### 2. Supabase Client
**File:** `src/main/services/supabaseClient.ts`
- Connection to Supabase cloud database
- Auto-detection if Supabase is configured
- Graceful fallback to local-only mode if not configured
- Connection testing and health checks

### 3. Database Models for Sync
**Files Created:**
- `src/main/database/models/SyncQueue.ts` - Tracks changes while offline
- `src/main/database/models/SyncStatus.ts` - Tracks sync state per branch

**SyncQueue Table:**
- Queues all INSERT/UPDATE/DELETE operations
- Tracks sync status (pending/syncing/synced/failed)
- Retry logic for failed syncs
- Auto-cleanup of old records

**SyncStatus Table:**
- One record per branch
- Tracks last sync timestamp
- Configurable sync interval
- Pending and failed change counts

### 4. Sync Service (Core Logic)
**File:** `src/main/services/syncService.ts`

**Features:**
- ✓ **Push Changes**: Local → Supabase cloud
- ✓ **Pull Changes**: Supabase cloud → Local
- ✓ **Offline Queue**: Changes queued when offline
- ✓ **Automatic Sync**: Every 5 minutes (configurable)
- ✓ **Manual Sync**: Trigger sync on demand
- ✓ **Conflict Resolution**: Last-write-wins strategy
- ✓ **Batch Processing**: Processes 100 changes at a time
- ✓ **Error Handling**: Failed changes tracked and retried
- ✓ **Cleanup**: Auto-deletes old synced records

### 5. IPC Integration
**Files Modified/Created:**
- `src/main/ipc/syncHandlers.ts` - Sync IPC handlers
- `src/main/ipc/index.ts` - Registered sync handlers
- `src/preload/index.ts` - Exposed sync API to renderer

**IPC Methods:**
- `sync:getStatus` - Get current sync status
- `sync:triggerSync` - Manual sync trigger
- `sync:toggleSync` - Enable/disable sync
- `sync:updateInterval` - Change sync frequency
- `sync:cleanup` - Clean old records

### 6. Dashboard UI
**File:** `src/renderer/pages/Dashboard.tsx`

**New Features:**
- Multi-branch sync status card (shows when Supabase configured)
- Live sync status indicators (Syncing/Active/Error)
- Last sync timestamp with human-readable format
- Pending changes counter
- Manual "Sync Now" button
- Error display if sync fails
- Auto-refreshes status every 30 seconds
- Informational message when sync not configured

## How It Works

### Scenario 1: Add Product (Online)

```
1. User adds product in Branch A
   ↓
2. Product saved to local PostgreSQL (instant)
   ↓
3. Change queued in sync_queue table
   ↓
4. Background sync (every 5 min) pushes to Supabase
   ↓
5. Branch B pulls changes from Supabase
   ↓
6. Product appears in Branch B
```

### Scenario 2: Edit Product (Offline)

```
1. User edits product in Branch A (internet down)
   ↓
2. Change saved locally (works fine offline)
   ↓
3. Change queued in sync_queue (status: pending)
   ↓
4. Internet comes back
   ↓
5. Next sync cycle pushes queued changes to Supabase
   ↓
6. Other branches receive the update
```

### Scenario 3: Conflict (Both branches edit same product)

```
Branch A: Edits product price at 2:00 PM
Branch B: Edits product price at 2:05 PM
   ↓
Sync Process:
   ↓
Last-write-wins: Branch B's change (2:05 PM) takes precedence
   ↓
Both branches now have Branch B's price
```

## Configuration Steps

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to initialize
4. Go to Project Settings → API
5. Copy:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_KEY)

### Step 2: Run Database Schema on Supabase

1. In Supabase dashboard, go to SQL Editor
2. Run the same schema from `database/schema.sql`
3. This creates identical tables in cloud

### Step 3: Configure Environment

Edit `.env` file:

```env
# Supabase Cloud Sync (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

### Step 4: Restart Application

```bash
npm start
```

The app will:
- Detect Supabase configuration
- Initialize sync service
- Start periodic sync (every 5 minutes)
- Show sync status in Dashboard

## Sync Configuration

### Change Sync Interval

Default: 5 minutes

To change:
1. Use IPC call: `window.electronAPI.sync.updateInterval(10)` (10 minutes)
2. Or modify database: Update `sync_interval_minutes` in `sync_status` table

### Enable/Disable Sync

To disable sync:
```javascript
await window.electronAPI.sync.toggleSync(false);
```

To enable sync:
```javascript
await window.electronAPI.sync.toggleSync(true);
```

## Current Status vs Plan

### ✓ Completed
- [x] Supabase client integration
- [x] Offline change queue
- [x] Sync status tracking
- [x] Push local changes to cloud
- [x] Pull cloud changes to local
- [x] Automatic periodic sync
- [x] Manual sync trigger
- [x] Dashboard UI with sync status
- [x] Error handling and retry logic
- [x] Graceful fallback when not configured

### ⏭ Next Steps (Optional Enhancements)

1. **Row-Level Security (RLS)** on Supabase
   - Add branch-based access control
   - Prevent branches from accessing each other's data directly

2. **Real-Time Sync** using Supabase Realtime
   - Subscribe to changes from other branches
   - Instant sync instead of 5-minute intervals

3. **Conflict UI**
   - Show user when conflicts occur
   - Let user choose which change to keep

4. **Sync Progress Bar**
   - Show detailed progress during sync
   - "Syncing 47/100 products..."

5. **Selective Sync**
   - Choose which tables to sync
   - Exclude sensitive data from cloud

6. **Branch Management UI**
   - View all branches
   - See which branches are online
   - Force sync specific branches

## Testing the Sync

### Test 1: Verify Setup

1. Open Dashboard
2. Look for "Multi-Branch Sync Status" card
3. If you see it → Supabase is configured ✓
4. If not → Check `.env` file has SUPABASE_URL and SUPABASE_KEY

### Test 2: Manual Sync

1. Click "Sync Now" button
2. Should see success message with pushed/pulled counts
3. Check sync status updates

### Test 3: Offline Mode

1. Disconnect internet
2. Add/edit some data locally
3. Check Dashboard → should show "X pending changes"
4. Reconnect internet
5. Wait for next sync cycle (or click "Sync Now")
6. Pending count should go to 0

### Test 4: Multi-Branch Sync

1. Set up application on two different machines
2. Use same Supabase credentials on both
3. Add product on Machine A
4. Wait 5 minutes (or trigger manual sync)
5. Check Machine B → product should appear

## Troubleshooting

### Issue: Sync card not showing in Dashboard
**Solution:** Check `.env` file has valid SUPABASE_URL and SUPABASE_KEY

### Issue: Sync failing with authentication error
**Solution:** Verify Supabase key is correct (use anon/public key, not service role key)

### Issue: Changes not syncing between branches
**Solution:**
1. Check both branches using same Supabase project
2. Verify schema exists in Supabase (same as local)
3. Check `branch_id` is different on each machine

### Issue: Pending changes stuck
**Solution:**
1. Check `sync_queue` table for failed records
2. Look at `sync_error` column for error message
3. Fix issue and use `resetForRetry()` or click "Sync Now"

## Database Tables for Sync

### sync_queue
```sql
CREATE TABLE sync_queue (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(10) NOT NULL, -- insert/update/delete
  record_id INTEGER NOT NULL,
  data JSONB NOT NULL,
  branch_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  sync_status VARCHAR(20) DEFAULT 'pending',
  sync_error TEXT,
  retry_count INTEGER DEFAULT 0
);
```

### sync_status
```sql
CREATE TABLE sync_status (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER UNIQUE NOT NULL,
  last_sync_at TIMESTAMP,
  last_push_at TIMESTAMP,
  last_pull_at TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_interval_minutes INTEGER DEFAULT 5,
  pending_changes_count INTEGER DEFAULT 0,
  failed_changes_count INTEGER DEFAULT 0,
  last_sync_error TEXT,
  is_syncing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/main/services/supabaseClient.ts` | Supabase connection |
| `src/main/services/syncService.ts` | Core sync logic |
| `src/main/database/models/SyncQueue.ts` | Offline queue model |
| `src/main/database/models/SyncStatus.ts` | Sync status model |
| `src/main/ipc/syncHandlers.ts` | IPC handlers for sync |
| `src/renderer/pages/Dashboard.tsx` | Sync status UI |

## Summary

Your ERP now has:
- ✅ **Local PostgreSQL** for offline operation
- ✅ **Supabase cloud** for multi-branch sync
- ✅ **Automatic background sync** every 5 minutes
- ✅ **Offline queue** for changes made without internet
- ✅ **Dashboard UI** showing sync status
- ✅ **Manual sync** button for on-demand synchronization

This gives you the **best of both worlds**:
- Fast local database for instant operations
- Cloud sync for multi-branch coordination
- Works offline, syncs when online
- Simple setup and configuration

---

**Next:** Configure Supabase credentials and test multi-branch sync!
