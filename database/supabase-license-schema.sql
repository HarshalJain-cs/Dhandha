-- Supabase License Management Schema
-- Execute this in your Supabase SQL Editor
-- This creates the cloud tables for license validation and tracking

-- ============================================================================
-- LICENSE KEYS TABLE
-- Stores all generated license keys and their properties
-- ============================================================================
CREATE TABLE IF NOT EXISTS license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- License Information
  license_key VARCHAR(255) UNIQUE NOT NULL,
  license_type VARCHAR(50) NOT NULL DEFAULT 'perpetual',

  -- Activation Limits
  max_activations INTEGER NOT NULL DEFAULT 1,
  current_activations INTEGER NOT NULL DEFAULT 0,

  -- Validity
  grace_period_days INTEGER NOT NULL DEFAULT 30,
  issued_date TIMESTAMP NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP, -- NULL for perpetual licenses

  -- Customer Information
  issued_to VARCHAR(255), -- Customer name/company
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- Metadata
  metadata JSONB,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_license_type CHECK (license_type IN ('trial', 'perpetual', 'subscription')),
  CONSTRAINT chk_status CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
  CONSTRAINT chk_max_activations CHECK (max_activations >= 1),
  CONSTRAINT chk_current_activations CHECK (current_activations >= 0 AND current_activations <= max_activations)
);

-- Indexes
CREATE INDEX idx_license_keys_license_key ON license_keys(license_key);
CREATE INDEX idx_license_keys_status ON license_keys(status);
CREATE INDEX idx_license_keys_issued_date ON license_keys(issued_date);
CREATE INDEX idx_license_keys_expiry_date ON license_keys(expiry_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_license_keys_updated_at
BEFORE UPDATE ON license_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LICENSE ACTIVATIONS TABLE
-- Tracks which devices have activated each license
-- ============================================================================
CREATE TABLE IF NOT EXISTS license_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- License Reference
  license_key VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255) NOT NULL,

  -- Activation Details
  activation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- Device Information
  device_info JSONB,

  -- IP Tracking (optional, for security)
  activation_ip VARCHAR(45),
  last_ip VARCHAR(45),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_activation_status CHECK (status IN ('active', 'deactivated', 'revoked')),
  UNIQUE(license_key, hardware_id)
);

-- Indexes
CREATE INDEX idx_license_activations_license_key ON license_activations(license_key);
CREATE INDEX idx_license_activations_hardware_id ON license_activations(hardware_id);
CREATE INDEX idx_license_activations_status ON license_activations(status);
CREATE INDEX idx_license_activations_last_seen ON license_activations(last_seen_at);

-- Updated_at trigger
CREATE TRIGGER update_license_activations_updated_at
BEFORE UPDATE ON license_activations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LICENSE VERIFICATION LOG
-- Tracks all license verification attempts for security and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS license_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- License Information
  license_key VARCHAR(255) NOT NULL,
  hardware_id VARCHAR(255) NOT NULL,

  -- Verification Result
  verification_type VARCHAR(50) NOT NULL, -- 'activation', 'validation', 'deactivation'
  result VARCHAR(50) NOT NULL, -- 'success', 'failed', 'error'
  error_message TEXT,

  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Timestamp
  verified_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verification_log_license_key ON license_verification_log(license_key);
CREATE INDEX idx_verification_log_hardware_id ON license_verification_log(hardware_id);
CREATE INDEX idx_verification_log_verified_at ON license_verification_log(verified_at);
CREATE INDEX idx_verification_log_result ON license_verification_log(result);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS to secure the tables
-- ============================================================================

-- Enable RLS
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_verification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (your app)
-- You'll need to use service_role key in your app for write operations

CREATE POLICY "Allow all for service role on license_keys"
ON license_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow read for authenticated on license_keys"
ON license_keys
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all for service role on license_activations"
ON license_activations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow read for authenticated on license_activations"
ON license_activations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all for service role on license_verification_log"
ON license_verification_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- Helper functions for license management
-- ============================================================================

-- Function: Check if license is valid
CREATE OR REPLACE FUNCTION is_license_valid(p_license_key VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_status VARCHAR;
  v_expiry_date TIMESTAMP;
BEGIN
  SELECT status, expiry_date
  INTO v_status, v_expiry_date
  FROM license_keys
  WHERE license_key = p_license_key;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check status
  IF v_status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- Check expiry (if applicable)
  IF v_expiry_date IS NOT NULL AND v_expiry_date < NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get active activations count
CREATE OR REPLACE FUNCTION get_active_activations_count(p_license_key VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM license_activations
  WHERE license_key = p_license_key
    AND status = 'active';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Update last_seen_at for an activation
CREATE OR REPLACE FUNCTION update_activation_last_seen(
  p_license_key VARCHAR,
  p_hardware_id VARCHAR
)
RETURNS VOID AS $$
BEGIN
  UPDATE license_activations
  SET
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE
    license_key = p_license_key
    AND hardware_id = p_hardware_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- Remove this section in production
-- ============================================================================

-- Insert sample license keys for testing
INSERT INTO license_keys (
  license_key,
  license_type,
  max_activations,
  grace_period_days,
  issued_to,
  customer_email,
  status,
  notes
) VALUES
(
  'DHAN-TEST-1234-5678-90AB',
  'perpetual',
  1,
  30,
  'Test Customer',
  'test@example.com',
  'active',
  'Test license for development'
),
(
  'DHAN-DEMO-ABCD-EFGH-IJKL',
  'trial',
  1,
  30,
  'Demo User',
  'demo@example.com',
  'active',
  'Trial license expires in 30 days'
)
ON CONFLICT (license_key) DO NOTHING;

-- Update expiry date for trial license (30 days from now)
UPDATE license_keys
SET expiry_date = NOW() + INTERVAL '30 days'
WHERE license_type = 'trial';

-- ============================================================================
-- VIEWS (for analytics)
-- ============================================================================

-- View: Active licenses summary
CREATE OR REPLACE VIEW v_active_licenses AS
SELECT
  lk.license_key,
  lk.license_type,
  lk.issued_to,
  lk.issued_date,
  lk.expiry_date,
  lk.max_activations,
  lk.current_activations,
  COUNT(la.id) FILTER (WHERE la.status = 'active') as actual_active_activations,
  MAX(la.last_seen_at) as last_activity
FROM license_keys lk
LEFT JOIN license_activations la ON lk.license_key = la.license_key
WHERE lk.status = 'active'
GROUP BY lk.id, lk.license_key, lk.license_type, lk.issued_to, lk.issued_date, lk.expiry_date, lk.max_activations, lk.current_activations;

-- View: Expiring licenses (30 days or less)
CREATE OR REPLACE VIEW v_expiring_licenses AS
SELECT
  license_key,
  license_type,
  issued_to,
  customer_email,
  expiry_date,
  EXTRACT(DAY FROM (expiry_date - NOW())) as days_remaining
FROM license_keys
WHERE
  status = 'active'
  AND expiry_date IS NOT NULL
  AND expiry_date <= NOW() + INTERVAL '30 days'
  AND expiry_date > NOW()
ORDER BY expiry_date ASC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE license_keys IS 'Stores all license keys and their properties';
COMMENT ON TABLE license_activations IS 'Tracks device activations for each license';
COMMENT ON TABLE license_verification_log IS 'Audit log for all license verification attempts';

COMMENT ON COLUMN license_keys.license_key IS 'Unique license key in format DHAN-XXXX-XXXX-XXXX-XXXX';
COMMENT ON COLUMN license_keys.max_activations IS 'Maximum number of devices that can activate this license';
COMMENT ON COLUMN license_keys.current_activations IS 'Current number of active devices (auto-updated)';
COMMENT ON COLUMN license_keys.grace_period_days IS 'Number of days device can run offline before re-verification';

COMMENT ON COLUMN license_activations.hardware_id IS 'SHA-256 hash of device hardware fingerprint';
COMMENT ON COLUMN license_activations.last_seen_at IS 'Last time this device checked in (for offline grace period tracking)';
COMMENT ON COLUMN license_activations.device_info IS 'Device information (platform, hostname, etc.)';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Grant necessary permissions (adjust as needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
-- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

SELECT 'License management schema created successfully!' as status;
