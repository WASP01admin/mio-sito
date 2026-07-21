-- Add resource type columns to association_projects table
ALTER TABLE association_projects ADD COLUMN (
  needs_online_personnel BOOLEAN DEFAULT FALSE,
  needs_field_personnel BOOLEAN DEFAULT FALSE,
  needs_volunteers BOOLEAN DEFAULT FALSE,
  needs_instruments BOOLEAN DEFAULT FALSE,
  needs_financial BOOLEAN DEFAULT FALSE,
  financial_target INTEGER
);

-- Add constraint: at least one resource must be selected
ALTER TABLE association_projects ADD CONSTRAINT at_least_one_resource CHECK (
  needs_online_personnel OR
  needs_field_personnel OR
  needs_volunteers OR
  needs_instruments OR
  needs_financial
);
