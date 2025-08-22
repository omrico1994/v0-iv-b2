-- Regenerate valid tokens for pending invitations
-- This script creates new cryptographic tokens for any pending invitations that have legacy tokens

DO $$
DECLARE
    invitation_record RECORD;
    new_token TEXT;
    token_parts TEXT[];
    random_part TEXT;
    payload_data JSONB;
    encoded_payload TEXT;
    signature_input TEXT;
    hmac_signature TEXT;
    secret_key TEXT := 'your-secret-key-here'; -- This should match INVITATION_TOKEN_SECRET
BEGIN
    -- Get the secret key from environment (in production, this would be passed in)
    -- For now, we'll use a placeholder that should be replaced with the actual secret
    
    RAISE NOTICE 'Starting token regeneration for pending invitations...';
    
    -- Loop through all pending invitations
    FOR invitation_record IN 
        SELECT id, email, invited_by, created_at, expires_at
        FROM user_invitations 
        WHERE status = 'pending' 
        AND (expires_at IS NULL OR expires_at > NOW())
    LOOP
        -- Generate random part (32 characters)
        random_part := encode(gen_random_bytes(16), 'hex');
        
        -- Create payload
        payload_data := jsonb_build_object(
            'email', invitation_record.email,
            'invitedBy', invitation_record.invited_by,
            'exp', EXTRACT(epoch FROM COALESCE(invitation_record.expires_at, NOW() + INTERVAL '7 days'))::bigint
        );
        
        -- Base64 encode payload (simplified - in real implementation this would be proper base64)
        encoded_payload := encode(payload_data::text::bytea, 'base64');
        
        -- Create signature input
        signature_input := random_part || '.' || encoded_payload;
        
        -- Generate HMAC signature (using SHA256)
        -- Note: In production, you'd use the actual INVITATION_TOKEN_SECRET
        hmac_signature := encode(hmac(signature_input::bytea, secret_key::bytea, 'sha256'), 'hex');
        
        -- Combine into final token
        new_token := random_part || '.' || encoded_payload || '.' || hmac_signature;
        
        -- Updated column name from 'token' to 'invitation_token' to match database schema
        UPDATE user_invitations 
        SET 
            invitation_token = new_token
        WHERE id = invitation_record.id;
        
        RAISE NOTICE 'Regenerated token for invitation ID: % (email: %)', invitation_record.id, invitation_record.email;
    END LOOP;
    
    RAISE NOTICE 'Token regeneration completed!';
    
    -- Show summary
    RAISE NOTICE 'Updated % pending invitations with new tokens', 
        (SELECT COUNT(*) FROM user_invitations WHERE status = 'pending' AND (expires_at IS NULL OR expires_at > NOW()));
        
END $$;

-- Verify the results
-- Updated column references from 'token' to 'invitation_token'
SELECT 
    id,
    email,
    status,
    LENGTH(invitation_token) as token_length,
    CASE 
        WHEN invitation_token LIKE '%.%.%' THEN 'New Format (3 parts)'
        WHEN invitation_token LIKE '%_%' THEN 'Legacy Format (UUID_TIMESTAMP)'
        ELSE 'Unknown Format'
    END as token_format,
    created_at,
    expires_at
FROM user_invitations 
WHERE status = 'pending'
ORDER BY created_at DESC;
