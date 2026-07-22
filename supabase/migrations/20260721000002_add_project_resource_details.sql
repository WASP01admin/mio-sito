-- Add detail text columns for each resource type
ALTER TABLE association_projects ADD COLUMN (
  needs_online_personnel_details TEXT,
  needs_field_personnel_details TEXT,
  needs_volunteers_details TEXT,
  needs_instruments_details TEXT,
  needs_financial_details TEXT
);
