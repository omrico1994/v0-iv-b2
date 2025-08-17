-- Ensure other tables have proper RLS policies without recursion

-- Retailers table policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON retailers;
CREATE POLICY "retailers_select_authenticated" ON retailers
    FOR SELECT
    TO authenticated
    USING (true);

ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;

-- Locations table policies  
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON locations;
CREATE POLICY "locations_select_authenticated" ON locations
    FOR SELECT
    TO authenticated
    USING (true);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
