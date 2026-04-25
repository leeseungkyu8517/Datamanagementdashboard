---
name: 페이지별 구현 상태
description: 각 라우트/페이지의 Supabase 연동 상태 및 더미 데이터 여부
type: project
originSessionId: 8caeeeac-b89c-4b6b-aac5-040199e411ab
---
| 경로 | 컴포넌트 파일 | 상태 | 연결 테이블 |
|------|------------|------|-----------|
| `/` = `/companies/korea` | company-korea.tsx | ❌ 더미 데이터 | companies (region=korea) |
| `/companies/korea/personnel` | sales-personnel.tsx | ❌ 더미 데이터 | sales_personnel (region=korea) |
| `/companies/japan` | company-japan.tsx | ❌ 더미 데이터 | companies (region=japan) |
| `/companies/japan/personnel` | sales-personnel-japan.tsx | ❌ 더미 데이터 | sales_personnel (region=japan) |
| `/companies/vietnam` | company-vietnam.tsx | ❌ 더미 데이터 | companies (region=vietnam) |
| `/companies/vietnam/personnel` | sales-personnel-vietnam.tsx | ❌ 더미 데이터 | sales_personnel (region=vietnam) |
| `/sales` | sales-history.tsx | ❌ 더미 데이터 | sales_projects, meeting_notes |
| `/dashboard` | sales-dashboard.tsx | ✅ Supabase 연동 | companies, sales_projects |
| `/period-forecast` | period-forecast-dashboard.tsx | ❌ 더미 데이터 | sales_projects |
| `/schedule` | schedule-management.tsx | ❌ 더미 데이터 | schedules |
| `/my-tasks` | my-tasks.tsx | ❌ 더미 데이터 | tasks, task_tags, task_history, task_attachments |
| `/company-data` | company-data-collection.tsx | ❌ 더미 데이터 | company_data, company_data_crawling |

**How to apply:** 작업 시작 전 이 표 확인해서 어느 페이지가 아직 더미인지 파악할 것.
