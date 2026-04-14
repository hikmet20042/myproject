# Fix Organization Account Types

## Problem
Organization accounts are being treated as regular users because:
1. Database trigger was setting `account_type = 'user'` by default
2. Google OAuth callback was setting `account_type = 'user'` for new sign-ups

## What Was Fixed in Code
✅ Database trigger now sets `account_type = null` (allows onboarding to decide)
✅ Google OAuth callback now sets `account_type = null` (allows onboarding to decide)

## What You Need to Do: Fix Existing Database

### Option 1: Run the Migration Script (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Update organization accounts that were incorrectly set as 'user'
UPDATE accounts
SET account_type = 'organization',
    updated_at = NOW()
WHERE id IN (
  SELECT a.id
  FROM accounts a
  INNER JOIN organization_profiles o ON a.id = o.account_id
  WHERE a.account_type = 'user'
);

-- Verify the update
SELECT 
  a.id,
  a.account_type,
  o.organization_name
FROM accounts a
INNER JOIN organization_profiles o ON a.id = o.account_id
WHERE a.account_type = 'organization';
```

### Option 2: Manual Fix (If you know your user ID)

If you know your specific user ID, run:

```sql
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
UPDATE accounts
SET account_type = 'organization',
    updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';

-- Verify
SELECT id, account_type FROM accounts WHERE id = 'YOUR_USER_ID_HERE';
```

### Option 3: Fix All Accounts at Once

If you want to fix ALL organization accounts based on having an organization profile:

```sql
UPDATE accounts
SET account_type = 'organization',
    updated_at = NOW()
FROM organization_profiles
WHERE accounts.id = organization_profiles.account_id
  AND accounts.account_type = 'user';
```

## After Running the SQL

1. **Sign out** completely
2. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. **Sign back in** with your organization account
4. The website should now correctly recognize you as an organization

## How to Verify It's Working

After signing back in:

1. **Header should show:**
   - "Təşkilat Paneli" link (instead of "Mənim Profilim")
   - No "Bloq Paylaş" link
   - No "Saxlanılmışlar" link

2. **Try accessing `/profile`:**
   - Should redirect to `/dashboard`
   - Should NOT show the regular user profile page

3. **Try accessing `/submit/blog`:**
   - Should redirect to `/dashboard`
   - Should NOT show the blog submission page

4. **Check the API:**
   - Open browser console
   - Run: `fetch('/api/users/profile').then(r => r.json()).then(console.log)`
   - Should return 403 error: "Organization accounts cannot access user profile endpoints"

## Prevention

New users signing up will now correctly get `account_type = null` initially, and the onboarding flow will set it to either `'user'` or `'organization'` based on their choice.
