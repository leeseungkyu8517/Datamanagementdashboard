ALTER TABLE sales_projects
  ADD COLUMN IF NOT EXISTS issue_grade text CHECK (issue_grade IN ('S','A','B','C','D','E'));
