-- company_data_crawling에 소스 타입 / 제목 / 원문 컬럼 추가
ALTER TABLE company_data_crawling
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS title       text,
  ADD COLUMN IF NOT EXISTS raw_content text;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_crawling_company_source
  ON company_data_crawling (company_data_id, source_type, collected_at DESC);
