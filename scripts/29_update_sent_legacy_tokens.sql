-- Update legacy tokens for invitations with 'sent' status
-- This handles invitations that were missed by the previous regeneration script

DO $$
DECLARE
    invitation_record RECORD;
    new_token TEXT;
    random_part TEXT;
    payload_data TEXT;
    signature TEXT;
    secret_key TEXT := 'your-secret-key-here'; -- This should match your INVITATION_TOKEN_SECRET
BEGIN
    -- Set the secret key from environment (in production, this would come from env vars)
    secret_key := 'invitation-secret-2024'; -- Update this to match your actual secret
    
    RAISE NOTICE 'Starting legacy token update for sent invitations...';
    
    -- Find all invitations with legacy UUID_TIMESTAMP format tokens and 'sent' status
    FOR invitation_record IN 
        SELECT id, email, invitation_token, status, expires_at
        FROM user_invitations 
        WHERE status = 'sent'
        AND invitation_token ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[0-9]+$'
    LOOP
        -- Generate new secure token components
        random_part := encode(gen_random_bytes(16), 'base64');
        random_part := replace(replace(random_part, '+', '-'), '/', '_');
        random_part := rtrim(random_part, '=');
        
        -- Create payload with email and expiration
        payload_data := encode(
            convert_to(
                json_build_object(
                    'email', invitation_record.email,
                    'exp', extract(epoch from invitation_record.expires_at)::bigint
                )::text, 
                'utf8'
            ), 
            'base64'
        );
        payload_data := replace(replace(payload_data, '+', '-'), '/', '_');
        payload_data := rtrim(payload_data, '=');
        
        -- Create signature (simplified HMAC simulation)
        signature := encode(
            digest(
                random_part || '.' || payload_data || '.' || secret_key,
                'sha256'
            ),
            'base64'
        );
        signature := replace(replace(signature, '+', '-'), '/', '_');
        signature := rtrim(signature, '=');
        
        -- Combine into final token
        new_token := random_part || '.' || payload_data || '.' || signature;
        
        -- Update the invitation with the new token
        UPDATE user_invitations 
        SET invitation_token = new_token
        WHERE id = invitation_record.id;
        
        RAISE NOTICE 'Updated invitation for %: % -> %', 
            invitation_record.email, 
            left(invitation_record.invitation_token, 20) || '...', 
            left(new_token, 20) || '...';
    END LOOP;
    
    -- Show final summary
    RAISE NOTICE 'Legacy token update completed!';
    
    -- Using PERFORM instead of SELECT to avoid "no destination for result data" error
    PERFORM 
        'Updated tokens summary' as check_type,
        CASE 
            WHEN invitation_token ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[0-9]+$' 
            THEN 'Legacy UUID_TIMESTAMP'
            WHEN invitation_token ~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' 
            THEN 'New Cryptographic'
            ELSE 'Unknown Format'
        END as token_format,
        COUNT(*) as count,
        status
    FROM user_invitations 
    WHERE status = 'sent'
    GROUP BY 
        CASE 
            WHEN invitation_token ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[0-9]+$' 
            THEN 'Legacy UUID_TIMESTAMP'
            WHEN invitation_token ~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' 
            THEN 'New Cryptographic'
            ELSE 'Unknown Format'
        END, 
        status
    ORDER BY token_format, status;
        
END $$;
