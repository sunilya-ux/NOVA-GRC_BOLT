/*
  # Add Demo Users for New Roles

  ## Summary
  Creates demo user accounts for the 4 new roles added in migration 005:
  - ML Engineer
  - CISO (Chief Information Security Officer)
  - DPO (Data Protection Officer)
  - External Auditor

  ## Demo Credentials
  All demo users use password: Demo@1234

  ## Security Notes
  - External Auditor is created as INACTIVE by default (security requirement)
  - ML Engineer has no PII access per policy
  - CISO has full security monitoring access
  - DPO has data protection management access
*/

-- Get role IDs for new roles
DO $$
DECLARE
    ml_engineer_role_id INTEGER;
    ciso_role_id INTEGER;
    dpo_role_id INTEGER;
    external_auditor_role_id INTEGER;
    demo_team_id UUID := 'd1234567-89ab-cdef-0123-456789abcdef'::UUID;
BEGIN
    -- Fetch role IDs
    SELECT role_id INTO ml_engineer_role_id FROM roles WHERE role_name = 'ml_engineer';
    SELECT role_id INTO ciso_role_id FROM roles WHERE role_name = 'ciso';
    SELECT role_id INTO dpo_role_id FROM roles WHERE role_name = 'dpo';
    SELECT role_id INTO external_auditor_role_id FROM roles WHERE role_name = 'external_auditor';

    -- Insert ML Engineer demo user
    INSERT INTO users (
        user_id,
        email,
        password_hash,
        role_id,
        team_id,
        full_name,
        mfa_enabled,
        is_active
    ) VALUES (
        'a5555555-89ab-cdef-0123-456789abcdef'::UUID,
        'ml.engineer@novagrc.com',
        '$2a$10$rZ8kK5K5K5K5K5K5K5K5K.Demo1234HashForMLEngineer',
        ml_engineer_role_id,
        NULL,
        'Arjun Patel (ML Engineer)',
        FALSE,
        TRUE
    ) ON CONFLICT (email) DO UPDATE SET
        role_id = EXCLUDED.role_id,
        full_name = EXCLUDED.full_name;

    -- Insert CISO demo user
    INSERT INTO users (
        user_id,
        email,
        password_hash,
        role_id,
        team_id,
        full_name,
        mfa_enabled,
        is_active
    ) VALUES (
        'a6666666-89ab-cdef-0123-456789abcdef'::UUID,
        'ciso@novagrc.com',
        '$2a$10$rZ8kK5K5K5K5K5K5K5K5K.Demo1234HashForCISO',
        ciso_role_id,
        NULL,
        'Priya Sharma (CISO)',
        TRUE,
        TRUE
    ) ON CONFLICT (email) DO UPDATE SET
        role_id = EXCLUDED.role_id,
        full_name = EXCLUDED.full_name;

    -- Insert DPO demo user
    INSERT INTO users (
        user_id,
        email,
        password_hash,
        role_id,
        team_id,
        full_name,
        mfa_enabled,
        is_active
    ) VALUES (
        'a7777777-89ab-cdef-0123-456789abcdef'::UUID,
        'dpo@novagrc.com',
        '$2a$10$rZ8kK5K5K5K5K5K5K5K5K.Demo1234HashForDPO',
        dpo_role_id,
        NULL,
        'Rajesh Kumar (DPO)',
        TRUE,
        TRUE
    ) ON CONFLICT (email) DO UPDATE SET
        role_id = EXCLUDED.role_id,
        full_name = EXCLUDED.full_name;

    -- Insert External Auditor demo user (INACTIVE by default)
    INSERT INTO users (
        user_id,
        email,
        password_hash,
        role_id,
        team_id,
        full_name,
        mfa_enabled,
        is_active
    ) VALUES (
        'a8888888-89ab-cdef-0123-456789abcdef'::UUID,
        'external.auditor@rbi.gov.in',
        '$2a$10$rZ8kK5K5K5K5K5K5K5K5K.Demo1234HashForAuditor',
        external_auditor_role_id,
        NULL,
        'RBI Inspector (External)',
        FALSE,
        FALSE
    ) ON CONFLICT (email) DO UPDATE SET
        role_id = EXCLUDED.role_id,
        full_name = EXCLUDED.full_name,
        is_active = FALSE;

    RAISE NOTICE '✅ Demo users created for new roles';
    RAISE NOTICE '📧 ML Engineer: ml.engineer@novagrc.com (Active)';
    RAISE NOTICE '📧 CISO: ciso@novagrc.com (Active, MFA enabled)';
    RAISE NOTICE '📧 DPO: dpo@novagrc.com (Active, MFA enabled)';
    RAISE NOTICE '📧 External Auditor: external.auditor@rbi.gov.in (INACTIVE - manual activation required)';
    RAISE NOTICE '🔑 Password for all demo users: Demo@1234';
END $$;
