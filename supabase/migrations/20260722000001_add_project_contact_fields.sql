-- Add contact fields to association_projects table
ALTER TABLE association_projects ADD COLUMN (
  contact_email TEXT,
  contact_phone TEXT,
  contact_person_name TEXT,
  contact_website TEXT,
  contact_notes TEXT
);

-- Add note: contact_email should ideally be filled
-- (enforced at application level, not database level for flexibility)
