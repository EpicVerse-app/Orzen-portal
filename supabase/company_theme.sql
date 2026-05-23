-- Add theme columns to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1a1a1a';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#111111';

-- Add description to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Set Malabar Jewellers theme (purple)
UPDATE companies
SET primary_color = '#5B2D8E', sidebar_color = '#2D1B4E'
WHERE name ILIKE '%malabar%';
