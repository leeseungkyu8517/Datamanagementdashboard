import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// 1. 거래처 (companies)
const { data: company, error: companyError } = await supabase
  .from('companies')
  .insert({
    region: 'korea',
    name: 'SK하이닉스',
    rank: 'A',
    business_number: '130-86-05543',
    ceo: '곽노정',
    industry: '반도체',
    address: '경기도 이천시 부발읍 경충대로 2091',
    total_projects: 3,
    total_amount: 1200000000,
    status: '거래중',
    contact_attempts: 10,
    successful_contacts: 8,
  })
  .select()
  .single()

if (companyError) { console.error('companies 오류:', companyError.message); process.exit(1) }
console.log('✅ companies 삽입:', company.name)

// 2. 담당자 (company_managers)
const { error: managerError } = await supabase
  .from('company_managers')
  .insert({
    company_id: company.id,
    name: '이상훈',
    position: '구매팀장',
    department: '구매팀',
    phone: '010-1234-5678',
    email: 'sh.lee@sk.com',
  })

if (managerError) console.error('company_managers 오류:', managerError.message)
else console.log('✅ company_managers 삽입 완료')

// 3. 영업인력 (sales_personnel)
const { data: personnel, error: personnelError } = await supabase
  .from('sales_personnel')
  .insert({
    region: 'korea',
    name: '김민준',
    position: '영업팀장',
    department: '한국영업팀',
    phone: '010-9876-5432',
    email: 'mj.kim@brycen.co.kr',
    projects_count: 3,
  })
  .select()
  .single()

if (personnelError) { console.error('sales_personnel 오류:', personnelError.message); process.exit(1) }
console.log('✅ sales_personnel 삽입:', personnel.name)

// 4. 영업 프로젝트 (sales_projects)
const { data: project, error: projectError } = await supabase
  .from('sales_projects')
  .insert({
    project_name: 'SK하이닉스 IT인프라 구축',
    company_id: company.id,
    company_name: 'SK하이닉스',
    business_number: '130-86-05543',
    company_phone: '031-630-4114',
    stage: '가격 협의',
    amount: 350000000,
    min_amount: 280000000,
    max_amount: 420000000,
    summary: '이천 팹 신규 IT인프라 구축 프로젝트. 서버 및 네트워크 장비 공급.',
    project_overview: 'SK하이닉스 이천 신규 팹(FAB) 증설에 따른 IT 인프라 구축. 서버 50대, 네트워크 스위치 20대 공급 및 설치.',
    sales_personnel_id: personnel.id,
    manager_name: '김민준',
    region: 'korea',
  })
  .select()
  .single()

if (projectError) { console.error('sales_projects 오류:', projectError.message); process.exit(1) }
console.log('✅ sales_projects 삽입:', project.project_name)

// 5. 미팅 기록 (meeting_notes)
const { error: meetingError } = await supabase
  .from('meeting_notes')
  .insert({
    sales_project_id: project.id,
    date: '2026-04-10',
    attendees: '김민준, 이상훈 팀장, 박지원 과장',
    content: '초기 요구사항 미팅. 서버 사양 및 납기 일정 협의. 다음 주 견적서 제출 예정.',
  })

if (meetingError) console.error('meeting_notes 오류:', meetingError.message)
else console.log('✅ meeting_notes 삽입 완료')

// 6. 스케줄
const { error: scheduleError } = await supabase
  .from('schedules')
  .insert({
    date: '2026-04-30',
    title: 'SK하이닉스 가격 협의 미팅',
    time: '14:00',
    type: 'meeting',
    company: 'SK하이닉스',
    manager: '김민준',
    client_name: '이상훈',
    client_phone: '010-1234-5678',
  })

if (scheduleError) console.error('schedules 오류:', scheduleError.message)
else console.log('✅ schedules 삽입 완료')

// 7. 할일 (tasks)
const { data: task, error: taskError } = await supabase
  .from('tasks')
  .insert({
    title: 'SK하이닉스 견적서 최종 수정',
    description: '가격 협의 결과 반영하여 견적서 수정 후 재발송',
    status: 'todo',
    priority: 'high',
    due_date: '2026-04-28',
    category: '영업',
    assignee_name: '김민준',
    sales_project_id: project.id,
    project_name: 'SK하이닉스 IT인프라 구축',
  })
  .select()
  .single()

if (taskError) console.error('tasks 오류:', taskError.message)
else console.log('✅ tasks 삽입:', task.title)

console.log('\n🎉 샘플 데이터 삽입 완료!')
