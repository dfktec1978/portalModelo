-- FIX: Create professionals table with proper error handling
-- Execute this in Supabase Console: https://app.supabase.com/project/poltjzvbrngbkyhnuodw/sql/new

-- Step 1: Drop table if exists (to ensure clean state)
DROP TABLE IF EXISTS professionals CASCADE;

-- Step 2: Create professionals table
CREATE TABLE professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  specialty TEXT,
  city TEXT DEFAULT 'Modelo-SC',
  neighborhood TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  description TEXT,
  profile_image TEXT,
  instagram TEXT,
  facebook TEXT,
  website TEXT,
  working_hours TEXT,
  emergency_service BOOLEAN DEFAULT FALSE,
  gallery_images TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Step 4: Create Policies
CREATE POLICY "Professionals are viewable by everyone" ON professionals
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can insert professionals" ON professionals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update professionals" ON professionals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete professionals" ON professionals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Step 5: Create Indexes
CREATE INDEX idx_professionals_category ON professionals(category);
CREATE INDEX idx_professionals_featured ON professionals(featured);
CREATE INDEX idx_professionals_active ON professionals(active);
CREATE INDEX idx_professionals_city ON professionals(city);

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION update_professionals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
CREATE TRIGGER trigger_update_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_professionals_updated_at();

-- Success message
SELECT '✅ Tabela professionals criada com sucesso!' as status;