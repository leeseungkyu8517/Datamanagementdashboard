---
name: Project Overview
description: BRYCEN B2B 영업 대시보드 — 현재 상태, 기술 스택, Supabase 연결 완료
type: project
originSessionId: 8caeeeac-b89c-4b6b-aac5-040199e411ab
---
B2B Sales & Company Data Management Dashboard for BRYCEN (Korea/Japan/Vietnam offices). 내부 영업 관리 도구. 거래처, 영업인력, 영업 이력, 할일, 매출 예측을 관리.

**Tech stack:** React 18 + React Router 7, Vite 6, Tailwind CSS v4, shadcn/ui (Radix UI), Recharts, npm (pnpm은 sandbox 환경 오류로 npm 사용 중)

**Supabase 연결 완료 (2026-04-25)**
- Project URL: `https://kdcepqzuoakbyrlrvpqf.supabase.co`
- Anon Key: `sb_publishable_F_j2bkuhakz3_Qn24IhTZA_ICdIt9fm`
- 설치된 패키지: `@supabase/supabase-js`

**생성된 파일:**
- `src/lib/supabase.ts` — 타입이 연결된 Supabase 클라이언트
- `src/lib/database.types.ts` — 12개 테이블 전체 TypeScript 타입
- `.env` — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- `.gitignore` — .env 포함
- `seed.sql` — Supabase SQL Editor에서 실행할 샘플 데이터 (SK하이닉스 예시)
- `seed.mjs` — Node 스크립트 (RLS 미설정으로 현재 사용 불가)

**현재 상태:**
- `sales-dashboard.tsx`는 Supabase 연결 완료 (companies + sales_projects 실시간 조회)
- 나머지 페이지는 모두 하드코딩된 더미 데이터

**Why:** 3개국 영업 데이터를 통합 관리하는 내부 도구.

**How to apply:** 기능 추가 시 Korean UI 유지. `@/lib/supabase` import로 DB 접근. RLS 정책이 아직 설정 안 되어 있어 데이터 쓰기가 막힐 수 있음 (Phase 1 선행 필요).
