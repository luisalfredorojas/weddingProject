-- ============================================
-- Wedding RSVP Database Schema
-- ============================================

-- Create the main RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  allergies TEXT,
  attendance TEXT NOT NULL,
  songs TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  
  -- Constraint to ensure only valid attendance values
  CONSTRAINT attendance_check CHECK (attendance IN ('yes', 'no'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rsvps_name ON rsvps(name);
CREATE INDEX IF NOT EXISTS idx_rsvps_attendance ON rsvps(attendance);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for public RSVP form)
CREATE POLICY "Allow public insert" ON rsvps
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all records (for admin dashboard)
CREATE POLICY "Allow authenticated read" ON rsvps
  FOR SELECT 
  TO authenticated
  USING (true);

-- Optional: Policy to allow service role full access
CREATE POLICY "Allow service role full access" ON rsvps
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);
