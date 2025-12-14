-- Additional security: Audit log for admin access
-- Run this in Supabase SQL Editor to add extra security

-- Create an audit log table to track admin access
CREATE TABLE IF NOT EXISTS admin_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on audit log
ALTER TABLE admin_access_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert and read
CREATE POLICY "Service role only" ON admin_access_log
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Add IP restrictions if you know your admin IP
-- You can check this later and add IP-based restrictions
