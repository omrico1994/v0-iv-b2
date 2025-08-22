-- Replace insecure REGENERATE_ tokens with proper cryptographic tokens
-- This script finds all tokens with REGENERATE_ prefix and replaces them with secure 3-part tokens

DO $$
DECLARE
    invitation_record RECORD;
    new_token TEXT;
    random_part TEXT;
    payload_json TEXT;
    encoded_payload TEXT;
    signature TEXT;
    secret_key TEXT;
    updated_count INTEGER := 0;
BEGIN
    -- Use existing SUPABASE_JWT_SECRET instead of INVITATION_TOKEN_SECRET
    secret_key := current_setting('app.supabase_jwt_secret', true);
    
    IF secret_key IS NULL OR secret_key = '' THEN
        RAISE EXCEPTION 'SUPABASE_JWT_SECRET environment variable is not set';
    END IF;

    RAISE NOTICE 'Starting replacement of insecure REGENERATE_ tokens...';
    
    -- Find all invitations with REGENERATE_ format tokens
    FOR invitation_record IN 
        SELECT id, email, invitation_token, expires_at
        FROM user_invitations 
        WHERE invitation_token LIKE 'REGENERATE_%'
        AND status IN ('sent', 'pending')
    LOOP
        -- Generate random part (16 bytes = 22 chars base64)
        random_part := encode(gen_random_bytes(16), 'base64');
        random_part := rtrim(random_part, '='); -- Remove padding
        
        -- Create payload with future expiration (7 days from now)
        payload_json := json_build_object(
            'email', invitation_record.email,
            'exp', extract(epoch from (now() + interval '7 days')) * 1000
        )::text;
        
        -- Base64 encode the payload
        encoded_payload := encode(payload_json::bytea, 'base64');
        encoded_payload := rtrim(encoded_payload, '='); -- Remove padding
        
        -- Create signature using HMAC-SHA256
        signature := encode(
            hmac(random_part || '.' || encoded_payload, secret_key, 'sha256'),
            'base64'
        );
        signature := rtrim(signature, '='); -- Remove padding
        
        -- Combine parts into final token
        new_token := random_part || '.' || encoded_payload || '.' || signature;
        
        -- Update the invitation with the new secure token
        UPDATE user_invitations 
        SET invitation_token = new_token,
            expires_at = now() + interval '7 days'
        WHERE id = invitation_record.id;
        
        updated_count := updated_count + 1;
        
        RAISE NOTICE 'Updated invitation % with new secure token (length: %)', 
                     invitation_record.email, length(new_token);
    END LOOP;
    
    RAISE NOTICE 'Successfully replaced % insecure REGENERATE_ tokens with secure cryptographic tokens', updated_count;
    
    -- Verify the results
    RAISE NOTICE 'Verification - Remaining REGENERATE_ tokens: %', 
                 (SELECT count(*) FROM user_invitations WHERE invitation_token LIKE 'REGENERATE_%');
    
    RAISE NOTICE 'Verification - Total secure tokens: %', 
                 (SELECT count(*) FROM user_invitations WHERE invitation_token ~ '^[A-Za-z0-9+/]+\.[A-Za-z0-9+/]+\.[A-Za-z0-9+/]+$');

END $$;
