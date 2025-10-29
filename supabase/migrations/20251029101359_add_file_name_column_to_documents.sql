-- Add file_name column to documents table for image display
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);