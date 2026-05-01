-- ── cases (레퍼런스 사례 라이브러리) ─────────────────────────────────────────
create table if not exists cases (
  id           uuid        primary key default gen_random_uuid(),
  company_name text        not null,
  industry     text,
  company_size text        check (company_size in ('대기업', '중견', '스타트업')),
  problem      text,
  solution     text,
  result       text,
  period       text,
  source_url   text,
  tags         text[],
  created_at   timestamptz not null default now()
);

-- ── meetings (미팅 준비 목록) ─────────────────────────────────────────────────
create table if not exists meetings (
  id             uuid        primary key default gen_random_uuid(),
  target_company text        not null,
  industry       text,
  pain_points    text,
  meeting_date   date        not null,
  created_at     timestamptz not null default now()
);

-- ── meeting_cases (미팅 ↔ 레퍼런스 사례 N:M 연결) ─────────────────────────────
create table if not exists meeting_cases (
  meeting_id     uuid not null references meetings(id) on delete cascade,
  case_id        uuid not null references cases(id)    on delete cascade,
  relevance_note text,
  primary key (meeting_id, case_id)
);

-- RLS 비활성화 (내부 대시보드 전용)
alter table cases        disable row level security;
alter table meetings     disable row level security;
alter table meeting_cases disable row level security;
