-- FIX: Remove RLS Recursive Policies (Infinite Recursion)
-- Execute this in Supabase Console: https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql/new
-- Problem: Subqueries like "auth.uid() in (select id from profiles where role = 'admin')" cause infinite recursion

-- ============================================
-- 1. Remove ALL existing recursive policies
-- ============================================

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "public_read_active_stores" ON profiles;

-- professionals (original policies that reference profiles)
DROP POLICY IF EXISTS "public_read_active_professionals" ON professionals;
DROP POLICY IF EXISTS "professional_read_own" ON professionals;
DROP POLICY IF EXISTS "admin_read_all_professionals" ON professionals;
DROP POLICY IF EXISTS "professional_create" ON professionals;
DROP POLICY IF EXISTS "professional_update" ON professionals;

-- stores (original policies that reference profiles)
DROP POLICY IF EXISTS "public_read_active_stores" ON stores;
DROP POLICY IF EXISTS "owner_read_store" ON stores;
DROP POLICY IF EXISTS "admin_read_all_stores" ON stores;

-- news (original policies that reference profiles)
DROP POLICY IF EXISTS "public_read_news" ON news;
DROP POLICY IF EXISTS "admin_insert_news" ON news;
DROP POLICY IF EXISTS "admin_update_news" ON news;
DROP POLICY IF EXISTS "admin_delete_news" ON news;

-- classifieds (original policies that reference profiles)
DROP POLICY IF EXISTS "public_read_active_classifieds" ON classifieds;
DROP POLICY IF EXISTS "seller_read_own_classifieds" ON classifieds;

-- audit_logs (if exists)
DROP POLICY IF EXISTS "admin_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "authenticated_insert_audit_logs" ON audit_logs;

-- ============================================
-- 2. Create NEW policies WITHOUT subqueries
-- ============================================

-- profiles: Simple, non-recursive
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "user_update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "user_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- professionals: No subqueries
CREATE POLICY "public_read_active_professionals" ON professionals 
  FOR SELECT USING (status = 'active' OR profile_id = auth.uid());
CREATE POLICY "professional_create" ON professionals 
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "professional_update" ON professionals 
  FOR UPDATE USING (profile_id = auth.uid());

-- stores: No subqueries
CREATE POLICY "public_read_active_stores" ON stores 
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid());
CREATE POLICY "owner_read_store" ON stores 
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "owner_update_store" ON stores 
  FOR UPDATE USING (owner_id = auth.uid());

-- news: Allow public read, restrict write (no admin check subquery)
CREATE POLICY "public_read_news" ON news 
  FOR SELECT USING (true);
-- NOTE: For admin insert/update/delete, disable RLS or use separate admin function

-- classifieds: Public read, owner can read/write own
CREATE POLICY "public_read_active_classifieds" ON classifieds 
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "seller_read_own_classifieds" ON classifieds 
  FOR SELECT USING (seller_id = auth.uid());
CREATE POLICY "seller_create_classifieds" ON classifieds 
  FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY "seller_update_classifieds" ON classifieds 
  FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY "seller_delete_classifieds" ON classifieds 
  FOR DELETE USING (seller_id = auth.uid());

-- ============================================
-- 3. Verify
-- ============================================
SELECT schemaname, tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'professionals', 'stores', 'classifieds', 'news');
