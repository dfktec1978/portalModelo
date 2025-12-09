-- EMERGENCY FIX: Disable RLS Completely (Development Mode)
-- If the remove-recursive-policies.sql didn't work, execute this to disable all RLS
-- This should be done in Supabase Console: https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql/new

-- Step 1: Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'professionals', 'stores', 'classifieds', 'news', 'audit_logs');

-- WARNING: This disables ALL row-level security. Only for development.
-- In production, re-enable RLS and use proper policies.
