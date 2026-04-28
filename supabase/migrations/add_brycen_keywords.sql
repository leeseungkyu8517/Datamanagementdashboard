CREATE TABLE IF NOT EXISTS brycen_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brycen_keywords DISABLE ROW LEVEL SECURITY;

INSERT INTO brycen_keywords (keyword) VALUES
  ('SAP'),
  ('ERP 구축'),
  ('디지털전환'),
  ('클라우드 도입'),
  ('스마트팩토리'),
  ('MES'),
  ('그룹웨어'),
  ('인사시스템'),
  ('SCM')
ON CONFLICT DO NOTHING;
