-- Helper function to check if user is admin or office
CREATE OR REPLACE FUNCTION is_admin_or_office(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = uid 
        AND role IN ('admin', 'office')
    );
$$;

-- Helper function to check if user has access to a specific retailer
CREATE OR REPLACE FUNCTION has_retailer_access(retailer_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        -- Admin and office have access to all retailers
        SELECT 1 
        FROM user_roles 
        WHERE user_id = uid 
        AND role IN ('admin', 'office')
    ) OR EXISTS (
        -- Retailer and location_user have access to their specific retailer
        SELECT 1 
        FROM user_roles 
        WHERE user_id = uid 
        AND user_roles.retailer_id = has_retailer_access.retailer_id
        AND role IN ('retailer', 'location_user')
    );
$$;

-- Helper function to check if user has access to a specific location
CREATE OR REPLACE FUNCTION has_location_access(location_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        -- Admin and office have access to all locations
        SELECT 1 
        FROM user_roles 
        WHERE user_id = uid 
        AND role IN ('admin', 'office')
    ) OR EXISTS (
        -- Retailer has access to all locations under their retailer
        SELECT 1 
        FROM user_roles ur
        JOIN locations l ON l.retailer_id = ur.retailer_id
        WHERE ur.user_id = uid 
        AND ur.role = 'retailer'
        AND l.id = has_location_access.location_id
    ) OR EXISTS (
        -- Location user has access to their specific locations
        SELECT 1 
        FROM user_location_memberships ulm
        WHERE ulm.user_id = uid 
        AND ulm.location_id = has_location_access.location_id
    );
$$;

-- Helper function to get current user ID from auth context
CREATE OR REPLACE FUNCTION auth_uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT auth.uid();
$$;

-- Helper function to check if user exists and is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT auth.uid() IS NOT NULL;
$$;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role_type
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role 
    FROM user_roles 
    WHERE user_id = uid;
$$;

-- Helper function to get user's retailer_id
CREATE OR REPLACE FUNCTION get_user_retailer_id(uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT retailer_id 
    FROM user_roles 
    WHERE user_id = uid;
$$;

-- Helper function to check if user can manage other users (admin/office only)
CREATE OR REPLACE FUNCTION can_manage_users(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT is_admin_or_office(uid);
$$;

-- Helper function to check if user can access audit logs
CREATE OR REPLACE FUNCTION can_access_audit_logs(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT is_admin_or_office(uid);
$$;
