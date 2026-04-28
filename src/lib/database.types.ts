export type RegionType = 'korea' | 'japan' | 'vietnam'
export type CompanyRank = number // 0~5: 5=S, 4=A, 3=B, 2=C, 1=D, 0=E
export type CompanyStatus = '거래중' | '협의중' | '보류'
export type SalesStage = '미팅 요청' | '미팅 진행' | '견적서 발송' | '가격 협의' | '계약 진행'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'
export type TaskPriority = 'high' | 'medium' | 'low'
export type ScheduleType = 'meeting' | 'deadline' | 'event'
export type DocumentType = 'quotation' | 'contract'
export type CompanySize = '대기업' | '중견기업' | '중소기업'
export type CompanyGrade = number // 1~5: 5=최상위(5등급), 1=최하위(1등급)

export interface Company {
  id: string
  region: RegionType
  name: string
  rank: CompanyRank
  business_number: string | null
  ceo: string | null
  industry: string | null
  address: string | null
  total_projects: number
  total_amount: number
  status: CompanyStatus
  contact_attempts: number
  successful_contacts: number
  created_at: string
  updated_at: string
}

export interface CompanyManager {
  id: string
  company_id: string
  name: string
  position: string | null
  department: string | null
  phone: string | null
  email: string | null
  created_at: string
}

export interface SalesPersonnel {
  id: string
  region: RegionType
  name: string
  position: string | null
  department: string | null
  phone: string | null
  email: string | null
  projects_count: number
  created_at: string
  updated_at: string
}

export interface SalesProject {
  id: string
  project_name: string
  company_id: string | null
  company_name: string
  business_number: string | null
  company_phone: string | null
  stage: SalesStage
  amount: number | null
  min_amount: number | null
  max_amount: number | null
  summary: string | null
  project_overview: string | null
  sales_personnel_id: string | null
  manager_name: string | null
  region: RegionType | null
  created_at: string
  updated_at: string
}

export interface MeetingNote {
  id: string
  sales_project_id: string
  date: string
  attendees: string | null
  content: string | null
  estimated_amount: number | null
  contract_date: string | null
  deposit_date: string | null
  deposit_pct: number | null
  interim_date: string | null
  interim_pct: number | null
  balance_date: string | null
  balance_pct: number | null
  created_at: string
}

export interface Schedule {
  id: string
  date: string
  title: string
  time: string | null
  type: ScheduleType
  company: string | null
  manager: string | null
  client_name: string | null
  client_phone: string | null
  category: string | null
  management_item: string | null
  detail: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  category: string | null
  assignee_name: string | null
  assignee_contact: string | null
  sales_project_id: string | null
  project_name: string | null
  created_at: string
  updated_at: string
}

export interface TaskTag {
  id: string
  task_id: string
  tag: string
}

export interface TaskHistory {
  id: string
  task_id: string
  date: string
  action: string
  user_name: string | null
  created_at: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  name: string
  url: string | null
  type: string | null
  created_at: string
}

export interface SalesDocument {
  id: string
  sales_project_id: string | null
  project_name: string
  doc_type: DocumentType
  file_name: string
  file_path: string | null
  file_url: string | null
  file_size: number | null
  file_mime: string | null
  quotation_date: string | null
  contract_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CompanyData {
  id: string
  name: string
  industry: string | null
  keywords: string[] | null
  size: CompanySize | null
  revenue: string | null
  country: string | null
  website: string | null
  ai_summary: string | null
  grade: CompanyGrade | null
  created_at: string
  updated_at: string
}

export interface CompanyDataCrawling {
  id: string
  company_data_id: string
  url: string
  collected_at: string
  keywords: string[] | null
  source_type: 'website' | 'career' | 'news'
  title: string | null
  raw_content: string | null
  created_at: string
}

export interface BrycenKeyword {
  id: string
  keyword: string
  created_at: string
}

export interface DiscoveredCompany {
  name: string
  industry: string | null
  reason: string
}

export interface MeetingBrief {
  company_overview: string
  it_investment_signals: string
  hiring_trends: string
  recent_news: string
  sales_strategy: string
  agenda: string[]
  suggested_questions: string[]
  risk_factors: string
}

export interface Database {
  public: {
    Tables: {
      companies: { Row: Company; Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Company, 'id'>> }
      company_managers: { Row: CompanyManager; Insert: Omit<CompanyManager, 'id' | 'created_at'>; Update: Partial<Omit<CompanyManager, 'id'>> }
      sales_personnel: { Row: SalesPersonnel; Insert: Omit<SalesPersonnel, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SalesPersonnel, 'id'>> }
      sales_projects: { Row: SalesProject; Insert: Omit<SalesProject, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SalesProject, 'id'>> }
      meeting_notes: { Row: MeetingNote; Insert: Omit<MeetingNote, 'id' | 'created_at'>; Update: Partial<Omit<MeetingNote, 'id'>> }
      schedules: { Row: Schedule; Insert: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Schedule, 'id'>> }
      tasks: { Row: Task; Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Task, 'id'>> }
      task_tags: { Row: TaskTag; Insert: Omit<TaskTag, 'id'>; Update: Partial<Omit<TaskTag, 'id'>> }
      task_history: { Row: TaskHistory; Insert: Omit<TaskHistory, 'id' | 'created_at'>; Update: Partial<Omit<TaskHistory, 'id'>> }
      task_attachments: { Row: TaskAttachment; Insert: Omit<TaskAttachment, 'id' | 'created_at'>; Update: Partial<Omit<TaskAttachment, 'id'>> }
      company_data: { Row: CompanyData; Insert: Omit<CompanyData, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<CompanyData, 'id'>> }
      company_data_crawling: { Row: CompanyDataCrawling; Insert: Omit<CompanyDataCrawling, 'id' | 'created_at'>; Update: Partial<Omit<CompanyDataCrawling, 'id'>> }
      documents: { Row: SalesDocument; Insert: Omit<SalesDocument, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<SalesDocument, 'id'>> }
      brycen_keywords: { Row: BrycenKeyword; Insert: Omit<BrycenKeyword, 'id' | 'created_at'>; Update: Partial<Omit<BrycenKeyword, 'id'>> }
    }
  }
}
