-- 1. 거래처
INSERT INTO companies (region, name, rank, business_number, ceo, industry, address, total_projects, total_amount, status, contact_attempts, successful_contacts)
VALUES ('korea', 'SK하이닉스', 'A', '130-86-05543', '곽노정', '반도체', '경기도 이천시 부발읍 경충대로 2091', 3, 1200000000, '거래중', 10, 8)
RETURNING id;

-- 2. 담당자 (위 companies id 사용)
INSERT INTO company_managers (company_id, name, position, department, phone, email)
SELECT id, '이상훈', '구매팀장', '구매팀', '010-1234-5678', 'sh.lee@sk.com'
FROM companies WHERE name = 'SK하이닉스' LIMIT 1;

-- 3. 영업인력
INSERT INTO sales_personnel (region, name, position, department, phone, email, projects_count)
VALUES ('korea', '김민준', '영업팀장', '한국영업팀', '010-9876-5432', 'mj.kim@brycen.co.kr', 3)
RETURNING id;

-- 4. 영업 프로젝트
INSERT INTO sales_projects (
  project_name, company_id, company_name, business_number, company_phone,
  stage, amount, min_amount, max_amount, summary, project_overview,
  sales_personnel_id, manager_name, region
)
SELECT
  'SK하이닉스 IT인프라 구축',
  c.id,
  'SK하이닉스',
  '130-86-05543',
  '031-630-4114',
  '가격 협의',
  350000000, 280000000, 420000000,
  '이천 팹 신규 IT인프라 구축 프로젝트. 서버 및 네트워크 장비 공급.',
  'SK하이닉스 이천 신규 팹(FAB) 증설에 따른 IT 인프라 구축. 서버 50대, 네트워크 스위치 20대 공급 및 설치.',
  p.id,
  '김민준',
  'korea'
FROM companies c, sales_personnel p
WHERE c.name = 'SK하이닉스' AND p.name = '김민준'
LIMIT 1
RETURNING id;

-- 5. 미팅 기록
INSERT INTO meeting_notes (sales_project_id, date, attendees, content)
SELECT id, '2026-04-10', '김민준, 이상훈 팀장, 박지원 과장',
  '초기 요구사항 미팅. 서버 사양 및 납기 일정 협의. 다음 주 견적서 제출 예정.'
FROM sales_projects WHERE project_name = 'SK하이닉스 IT인프라 구축' LIMIT 1;

-- 6. 스케줄
INSERT INTO schedules (date, title, time, type, company, manager, client_name, client_phone)
VALUES ('2026-04-30', 'SK하이닉스 가격 협의 미팅', '14:00', 'meeting', 'SK하이닉스', '김민준', '이상훈', '010-1234-5678');

-- 7. 할일
INSERT INTO tasks (title, description, status, priority, due_date, category, assignee_name, sales_project_id, project_name)
SELECT
  'SK하이닉스 견적서 최종 수정',
  '가격 협의 결과 반영하여 견적서 수정 후 재발송',
  'todo', 'high', '2026-04-28', '영업', '김민준',
  id, 'SK하이닉스 IT인프라 구축'
FROM sales_projects WHERE project_name = 'SK하이닉스 IT인프라 구축' LIMIT 1;
