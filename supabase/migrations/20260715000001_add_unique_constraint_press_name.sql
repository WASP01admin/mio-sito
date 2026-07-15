-- Add UNIQUE constraint to press.name to prevent duplicate publisher names
-- Only the first publisher to register with a name gets it
ALTER TABLE press ADD CONSTRAINT press_name_unique UNIQUE (name);
