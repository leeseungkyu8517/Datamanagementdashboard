---
name: 개발 로드맵
description: 기능 구현 우선순위 및 단계별 작업 계획 (2026-04-25 기준)
type: project
originSessionId: 8caeeeac-b89c-4b6b-aac5-040199e411ab
---
## 현재 완료된 것
- [x] DB 스키마 설계 (table.txt → Supabase)
- [x] Supabase 클라이언트 연결 (src/lib/supabase.ts)
- [x] TypeScript 타입 정의 (src/lib/database.types.ts)
- [x] sales-dashboard.tsx Supabase 연동

## Phase 1 — RLS 정책 설정 (가장 먼저 해야 함)
앱에서 데이터 읽기/쓰기가 되려면 필수. Supabase SQL Editor에서 실행:
```sql
-- 각 테이블에 대해 반복
alter table companies enable row level security;
create policy "allow all" on companies for all using (true);
-- (개발 단계에서는 전체 허용, 이후 인증 붙이면 세분화)
```

## Phase 2 — 핵심 CRUD (이 순서로 진행)
1. **거래처 관리** (companies + company_managers)
   - company-korea.tsx, company-japan.tsx, company-vietnam.tsx
   - 목록 조회, 등록, 수정, 삭제
2. **영업인력 관리** (sales_personnel)
   - sales-personnel.tsx, sales-personnel-japan.tsx, sales-personnel-vietnam.tsx
3. **영업 이력** (sales_projects + meeting_notes)
   - sales-history.tsx

## Phase 3 — 부가 기능
4. **할일 관리** (tasks + task_tags + task_history + task_attachments)
   - my-tasks.tsx
5. **스케줄 관리** (schedules)
   - schedule-management.tsx

## Phase 4 — 집계/분석
6. 영업 현황 대시보드 (sales-dashboard.tsx — 이미 Supabase 연결됨, 데이터 쌓이면 자동)
7. 기간별 예측 대시보드 (period-forecast-dashboard.tsx)

## Phase 5 — Edge Functions (고급)
- `get-dashboard-stats`: 복잡한 집계 쿼리
- `ai-company-research`: company_data AI 요약 생성
- `crawl-company`: company_data_crawling 크롤링
- Supabase CLI 설치 필요: `winget install Supabase.CLI`

**Why:** 거래처 데이터가 없으면 영업 프로젝트 등록이 안 되므로 반드시 이 순서로.

**How to apply:** 다음 세션 시작 시 Phase 1 RLS 설정 여부 먼저 확인하고, company-korea.tsx부터 Supabase 연동 시작할 것.
