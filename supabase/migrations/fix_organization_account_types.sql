-- Fix: Update existing organization accounts that were incorrectly set as 'user'
-- This script identifies and fixes organization accounts based on their organization_profiles

-- Step 1: Find organization accounts that have account_type = 'user' but have organization_profiles
SELECT 
  a.id,
  a.account_type,
  o.organization_name,
  o.moderation_status
FROM accounts a
LEFT JOIN organization_profiles o ON a.id = o.account_id
WHERE o.account_id IS NOT NULL 
  AND a.account_type = 'user';

-- Step 2: Update those accounts to have the correct account_type
UPDATE accounts
SET account_type = 'organization',
    updated_at = NOW()
WHERE id IN (
  SELECT a.id
  FROM accounts a
  INNER JOIN organization_profiles o ON a.id = o.account_id
  WHERE a.account_type = 'user'
);

-- Step 3: Verify the update worked
SELECT 
  a.id,
  a.account_type,
  o.organization_name,
  o.moderation_status
FROM accounts a
INNER JOIN organization_profiles o ON a.id = o.account_id
WHERE a.account_type = 'organization'
LIMIT 10;

-- Step 4: Also fix the trigger to prevent this issue for new users
-- (Already fixed in schema.sql, but run this to update existing database)
CREATE OR REPLACE FUNCTION public.ensure_account_row_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (id, account_type, is_admin, is_active)
  VALUES (NEW.id, NULL, FALSE, TRUE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-create the trigger to use the updated function
DROP TRIGGER IF EXISTS on_auth_user_created_accounts ON auth.users;
CREATE TRIGGER on_auth_user_created_accounts
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_account_row_for_auth_user();
