---
name: Database Schema
description: Supabase 12개 테이블 구조 및 관계 요약
type: project
originSessionId: 8caeeeac-b89c-4b6b-aac5-040199e411ab
---
스키마 전체는 프로젝트 루트 `table.txt`에 있음. 요약:

**ENUM 타입**
- `region_type`: korea | japan | vietnam
- `company_rank`: A | B | C | D
- `company_status`: 거래중 | 협의중 | 보류
- `sales_stage`: 미팅 요청 | 미팅 진행 | 견적서 발송 | 가격 협의 | 계약 진행
- `task_status`: todo | completed
- `task_priority`: high | medium | low
- `schedule_type`: meeting | deadline | event
- `company_size`: 대기업 | 중견기업 | 중소기업
- `company_grade`: S등급 | A등급 | B등급 | C등급

**테이블 의존 관계**
```
companies
  └─ company_managers (company_id FK)
  └─ sales_projects (company_id FK, nullable)

sales_personnel
  └─ sales_projects (sales_personnel_id FK, nullable)

sales_projects
  └─ meeting_notes (sales_project_id FK)
  └─ tasks (sales_project_id FK, nullable)

tasks
  └─ task_tags (task_id FK)
  └─ task_history (task_id FK)
  └─ task_attachments (task_id FK)

company_data
  └─ company_data_crawling (company_data_id FK)

schedules (독립)
```

**핵심 컬럼 메모**
- `companies.total_amount`: bigint, 원 단위 (프론트에서 포맷)
- `sales_projects.amount/min_amount/max_amount`: bigint, 원 단위
- `company_data.keywords`: text[] 배열
- `updated_at`: 모든 주요 테이블에 트리거로 자동 갱신

**Why:** 3개국 공통 구조로 region 컬럼 하나로 통합 관리.

**How to apply:** 거래처(companies)가 먼저 있어야 영업 프로젝트(sales_projects) 등록 가능. 삽입 순서: companies → sales_personnel → sales_projects → 나머지.
