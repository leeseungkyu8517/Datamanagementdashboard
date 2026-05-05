import { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, Calendar, Edit2, Trash2, X, Brain } from 'lucide-react';
import { AiButton } from '@/app/components/ai-button';
import { supabase } from '@/lib/supabase';
import type { SalesProject, MeetingNote, Company, SalesPersonnel, SalesStage, RegionType, IssueGrade, CompanyData } from '@/lib/database.types';

const STAGES: SalesStage[] = ['미팅 요청', '미팅 진행', '견적서 발송', '가격 협의', '계약 진행'];

const ISSUE_GRADES: IssueGrade[] = ['S', 'A', 'B', 'C', 'D', 'E'];

const ISSUE_GRADE_META: Record<IssueGrade, { label: string; color: string; prob: string }> = {
  S: { label: 'S',  color: 'bg-emerald-500 text-white border-emerald-600', prob: '100%' },
  A: { label: 'A',  color: 'bg-violet-500 text-white border-violet-600',   prob: '80%'  },
  B: { label: 'B',  color: 'bg-blue-500 text-white border-blue-600',       prob: '50%'  },
  C: { label: 'C',  color: 'bg-amber-400 text-white border-amber-500',     prob: '30%'  },
  D: { label: 'D',  color: 'bg-gray-400 text-white border-gray-500',       prob: '0%'   },
  E: { label: 'E',  color: 'bg-red-400 text-white border-red-500',         prob: '0%'   },
};

const ISSUE_GRADE_DESC: Record<IssueGrade, string> = {
  S: '계약 완료 · 발주서 수령 · 입금 확인',
  A: '도입 확정 · 세부 계약 조건 조율 (1~2주 내 매출 예상)',
  B: '2회 이상 심층 미팅 · Pain Point 파악 · 예산 확인 · 도입 의지 확고',
  C: '공식 제안서 발송 · 견적서 제출 · 1차 데모/미팅 진행',
  D: '미팅 후 예산 無 · 연락 보류 · 후속 조치 없음',
  E: '단순 리스트 · cold call 거절 · 기피 업체',
};

function IssueGradeBadge({ grade }: { grade: IssueGrade | null }) {
  if (!grade) return null;
  const meta = ISSUE_GRADE_META[grade];
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-extrabold border ${meta.color}`}
      title={`${grade} (${meta.prob}) — ${ISSUE_GRADE_DESC[grade]}`}
    >
      {grade}
    </span>
  );
}

function getStageColor(stage: SalesStage) {
  switch (stage) {
    case '미팅 요청': return 'bg-gray-100 text-gray-700 border-gray-300';
    case '미팅 진행': return 'bg-blue-100 text-blue-700 border-blue-300';
    case '견적서 발송': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case '가격 협의': return 'bg-orange-100 text-orange-700 border-orange-300';
    case '계약 진행': return 'bg-green-100 text-green-700 border-green-300';
  }
}

function getProgressColor(stage: SalesStage) {
  switch (stage) {
    case '미팅 요청': return 'bg-gray-500';
    case '미팅 진행': return 'bg-blue-500';
    case '견적서 발송': return 'bg-yellow-500';
    case '가격 협의': return 'bg-orange-500';
    case '계약 진행': return 'bg-green-500';
  }
}

function formatAmount(amount: number | null): string {
  if (amount == null) return '-';
  return amount.toLocaleString('ko-KR');
}

export function SalesHistory() {
  const [projects, setProjects] = useState<SalesProject[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyDataList, setCompanyDataList] = useState<CompanyData[]>([]);
  const [personnel, setPersonnel] = useState<SalesPersonnel[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<Record<string, MeetingNote[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('전체');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingProject, setEditingProject] = useState<SalesProject | null>(null);
  const [editingNote, setEditingNote] = useState<MeetingNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiEstimating, setAiEstimating] = useState<Record<string, boolean>>({});
  const [aiEstimateResult, setAiEstimateResult] = useState<Record<string, { amount: number; min_amount: number; max_amount: number; reason: string }>>({});
  const [projectsWithNegotiation, setProjectsWithNegotiation] = useState<Set<string>>(new Set());
  const [paymentNoteMap, setPaymentNoteMap] = useState<Record<string, MeetingNote>>({});

  // 납금 관련 상태
  const [noteEstAmt, setNoteEstAmt] = useState<number | null>(null);
  const [depositPct, setDepositPct] = useState<number | null>(null);
  const [interimPct, setInterimPct] = useState<number | null>(null);
  const [balancePct, setBalancePct] = useState<number | null>(null);

  // 선택된 기업 ID (폼 내부용)
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  // AI 자동 작성용 controlled 필드
  const [formProjectName, setFormProjectName] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formOverview, setFormOverview] = useState('');
  const [formIssueGrade, setFormIssueGrade] = useState<IssueGrade | ''>('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  // 회의록 모달이 열릴 때 납금 상태 초기화
  useEffect(() => {
    if (showNoteModal) {
      setNoteEstAmt(editingNote?.estimated_amount ?? null);
      setDepositPct(editingNote?.deposit_pct ?? null);
      setInterimPct(editingNote?.interim_pct ?? null);
      setBalancePct(editingNote?.balance_pct ?? null);
      setNoteContent(editingNote?.content ?? '');
    }
  }, [showNoteModal]);

  useEffect(() => {
    if (showProjectModal) {
      setFormProjectName(editingProject?.project_name ?? '');
      setFormSummary(editingProject?.summary ?? '');
      setFormOverview(editingProject?.project_overview ?? '');
      setFormIssueGrade(editingProject?.issue_grade ?? '');
    }
  }, [showProjectModal]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: proj }, { data: comp }, { data: pers }, { data: negNotes }, { data: payNotes }, { data: cdList }] = await Promise.all([
      supabase.from('sales_projects').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*').order('name'),
      supabase.from('sales_personnel').select('*').order('name'),
      supabase.from('meeting_notes').select('sales_project_id').not('estimated_amount', 'is', null),
      supabase.from('meeting_notes').select('*')
        .or('deposit_pct.not.is.null,interim_pct.not.is.null,balance_pct.not.is.null')
        .order('date', { ascending: false }),
      supabase.from('company_data').select('id, name').order('name'),
    ]);
    setProjects(proj ?? []);
    setCompanies(comp ?? []);
    setCompanyDataList(cdList ?? []);
    setPersonnel(pers ?? []);
    setProjectsWithNegotiation(new Set((negNotes ?? []).map(n => n.sales_project_id)));
    // 프로젝트별 가장 최근 납금일정 회의록 맵
    const pMap: Record<string, MeetingNote> = {};
    (payNotes ?? []).forEach(n => { if (!pMap[n.sales_project_id]) pMap[n.sales_project_id] = n; });
    setPaymentNoteMap(pMap);
    setLoading(false);
  }

  async function fetchMeetingNotes(projectId: string) {
    if (meetingNotes[projectId]) return;
    const { data } = await supabase
      .from('meeting_notes')
      .select('*')
      .eq('sales_project_id', projectId)
      .order('date', { ascending: false });
    setMeetingNotes(prev => ({ ...prev, [projectId]: data ?? [] }));
  }

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    fetchMeetingNotes(id);
  };

  const filteredProjects = projects.filter(p => {
    const matchSearch =
      p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = filterStage === '전체' || p.stage === filterStage;
    return matchSearch && matchStage;
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedNotes = selectedProjectId ? (meetingNotes[selectedProjectId] ?? []) : [];

  const stageStats = STAGES.map(stage => ({
    stage,
    count: projects.filter(p => p.stage === stage).length,
  }));

  const statColors = ['bg-gray-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500'];

  const getLatestMeetingDate = (projectId: string) => {
    const notes = meetingNotes[projectId];
    if (!notes || notes.length === 0) return '회의록 없음';
    return [...notes].sort((a, b) => b.date.localeCompare(a.date))[0].date;
  };

  // 프로젝트 저장
  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const rawCompanyId = fd.get('company_id') as string;
    // cd_ 접두어는 company_data 테이블 항목 (companies 테이블 미등록)
    const isCdEntry = rawCompanyId.startsWith('cd_');
    const companyId = isCdEntry ? '' : rawCompanyId;
    const company = companies.find(c => c.id === companyId);
    const cdCompany = isCdEntry ? companyDataList.find(c => `cd_${c.id}` === rawCompanyId) : null;
    const personnelId = fd.get('sales_personnel_id') as string;
    const person = personnel.find(p => p.id === personnelId);

    const payload = {
      project_name: fd.get('project_name') as string,
      company_id: companyId || null,
      company_name: company?.name ?? cdCompany?.name ?? (fd.get('company_name') as string),
      business_number: company?.business_number ?? null,
      stage: fd.get('stage') as SalesStage,
      amount: fd.get('amount') ? Number(String(fd.get('amount')).replace(/,/g, '')) : null,
      min_amount: fd.get('min_amount') ? Number(String(fd.get('min_amount')).replace(/,/g, '')) : null,
      max_amount: fd.get('max_amount') ? Number(String(fd.get('max_amount')).replace(/,/g, '')) : null,
      summary: fd.get('summary') as string || null,
      project_overview: fd.get('project_overview') as string || null,
      sales_personnel_id: personnelId || null,
      manager_name: person?.name ?? null,
      region: (fd.get('region') as RegionType) || null,
      issue_grade: (fd.get('issue_grade') as IssueGrade) || null,
    };

    if (editingProject) {
      if (formIssueGrade !== (editingProject.issue_grade ?? '')) {
        if (!window.confirm('임의로 안건 등급을 변경하였습니다. 해당 사항을 저장하시겠습니까?')) {
          setSaving(false);
          return;
        }
      }
      const { data } = await supabase.from('sales_projects').update(payload).eq('id', editingProject.id).select().single();
      if (data) setProjects(projects.map(p => p.id === editingProject.id ? data : p));
    } else {
      const { data } = await supabase.from('sales_projects').insert(payload).select().single();
      if (data) {
        setProjects([data, ...projects]);

        // 기업을 직접 입력한 경우(드롭다운 미선택) → 해당 지역 기업 관리에 자동 추가
        if (!companyId && payload.company_name && payload.region) {
          const { data: existing } = await supabase
            .from('companies')
            .select('id')
            .eq('name', payload.company_name)
            .eq('region', payload.region)
            .maybeSingle();

          if (!existing) {
            const { data: newCompany } = await supabase
              .from('companies')
              .insert({
                name: payload.company_name,
                region: payload.region,
                rank: 2,          // C등급
                status: '협의중',
                business_number: payload.business_number ?? null,
                ceo: null,
                industry: null,
                address: null,
                total_projects: 0,
                total_amount: 0,
                contact_attempts: 0,
                successful_contacts: 0,
              })
              .select()
              .single();

            if (newCompany) {
              // 생성된 company_id를 프로젝트에 역링크
              await supabase.from('sales_projects').update({ company_id: newCompany.id }).eq('id', data.id);
              setProjects(prev => prev.map(p => p.id === data.id ? { ...p, company_id: newCompany.id } : p));
              setCompanies(prev => [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name)));
            }
          }
        }
      }
    }

    setSaving(false);
    setShowProjectModal(false);
    setEditingProject(null);
    setSelectedCompanyId('');
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" 프로젝트를 삭제하시겠습니까?`)) return;
    await supabase.from('sales_projects').delete().eq('id', id);
    setProjects(projects.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  // 회의록 저장
  const handleSaveNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const rawAmt = fd.get('estimated_amount') as string;
    const estimatedAmount = rawAmt ? Number(rawAmt.replace(/,/g, '')) : null;

    // 납금 합계 검증
    const totalPct = (depositPct ?? 0) + (interimPct ?? 0) + (balancePct ?? 0);
    if (totalPct > 0 && totalPct !== 100) {
      alert(`선금, 중도금, 잔금의 합계가 100%가 되어야 합니다. (현재 ${totalPct}%)`);
      setSaving(false);
      return;
    }

    const payload = {
      sales_project_id: selectedProjectId,
      date: fd.get('date') as string,
      attendees: fd.get('attendees') as string || null,
      content: fd.get('content') as string || null,
      estimated_amount: estimatedAmount,
      contract_date: fd.get('contract_date') as string || null,
      deposit_date: fd.get('deposit_date') as string || null,
      deposit_pct: depositPct,
      interim_date: fd.get('interim_date') as string || null,
      interim_pct: interimPct,
      balance_date: fd.get('balance_date') as string || null,
      balance_pct: balancePct,
    };

    if (editingNote) {
      const { data, error } = await supabase.from('meeting_notes').update(payload).eq('id', editingNote.id).select().single();
      if (error) { console.error('회의록 수정 오류:', error); alert(`저장 실패: ${error.message}`); setSaving(false); return; }
      if (data) setMeetingNotes(prev => ({
        ...prev,
        [selectedProjectId]: (prev[selectedProjectId] ?? []).map(n => n.id === editingNote.id ? data : n),
      }));
    } else {
      const { data, error } = await supabase.from('meeting_notes').insert(payload).select().single();
      if (error) { console.error('회의록 저장 오류:', error); alert(`저장 실패: ${error.message}`); setSaving(false); return; }
      if (data) setMeetingNotes(prev => ({
        ...prev,
        [selectedProjectId]: [data, ...(prev[selectedProjectId] ?? [])],
      }));
    }

    // 협의 금액이 있으면 ±10%로 프로젝트 최소/최대 금액 자동 설정
    if (estimatedAmount != null) {
      const minAmount = Math.round(estimatedAmount * 0.9);
      const maxAmount = Math.round(estimatedAmount * 1.1);
      const { data: updatedProject } = await supabase
        .from('sales_projects')
        .update({ amount: estimatedAmount, min_amount: minAmount, max_amount: maxAmount })
        .eq('id', selectedProjectId)
        .select()
        .single();
      if (updatedProject) {
        setProjects(prev => prev.map(p => p.id === selectedProjectId ? updatedProject : p));
      }
      setProjectsWithNegotiation(prev => { const next = new Set(prev); next.add(selectedProjectId); return next; });
    }

    setSaving(false);
    setShowNoteModal(false);
    setEditingNote(null);

    if (estimatedAmount == null) {
      runAiEstimate(selectedProjectId);
    }
  };

  const handleDeleteNote = async (noteId: string, projectId: string) => {
    if (!window.confirm('회의록을 삭제하시겠습니까?')) return;
    const deletedNote = (meetingNotes[projectId] ?? []).find(n => n.id === noteId);
    await supabase.from('meeting_notes').delete().eq('id', noteId);
    const remaining = (meetingNotes[projectId] ?? []).filter(n => n.id !== noteId);
    setMeetingNotes(prev => ({ ...prev, [projectId]: remaining }));
    if (deletedNote?.estimated_amount != null) {
      const hasRemaining = remaining.some(n => n.estimated_amount != null);
      if (!hasRemaining) {
        setProjectsWithNegotiation(prev => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }
    }
  };

  const runAiEstimate = async (projectId: string) => {
    setAiEstimating(prev => ({ ...prev, [projectId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-estimate', {
        body: { sales_project_id: projectId },
      });
      if (error) throw error;
      if (data?.success) {
        setAiEstimateResult(prev => ({ ...prev, [projectId]: data }));
        setProjects(prev =>
          prev.map(p => p.id === projectId
            ? { ...p, amount: data.amount, min_amount: data.min_amount, max_amount: data.max_amount }
            : p
          )
        );
      }
    } catch (err) {
      console.error('AI 산정 실패:', err);
    } finally {
      setAiEstimating(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const totalPct = (depositPct ?? 0) + (interimPct ?? 0) + (balancePct ?? 0);

  return (
    <div className="flex h-full bg-[#f5f6fa]">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedProjectId ? 'mr-96' : ''}`}>
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">영업 이력 관리</h1>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="mb-4">
            <p className="text-sm text-gray-600 font-medium">영업 프로세스별 현황</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {stageStats.map((stat, index) => (
              <div key={stat.stage} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{stat.stage}</span>
                  <div className={`w-2 h-2 rounded-full ${statColors[index]}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.count}건</div>
              </div>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="프로젝트명 또는 기업명으로 검색..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="relative">
                <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer">
                  <option value="전체">모든 단계</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button onClick={() => { setEditingProject(null); setSelectedCompanyId(''); setShowProjectModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium whitespace-nowrap">
                <Plus className="w-4 h-4" />새 프로젝트
              </button>
            </div>
          </div>

          {/* Project List */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">영업 프로젝트 목록</h2>
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">데이터를 불러오는 중...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">{searchTerm || filterStage !== '전체' ? '검색 결과가 없습니다' : '등록된 프로젝트가 없습니다'}</div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className={`bg-white rounded-lg shadow-sm border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
                      selectedProjectId === project.id ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <IssueGradeBadge grade={project.issue_grade} />
                          <h3 className="text-base font-bold text-gray-900">{project.project_name}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <span>{project.company_name}</span>
                          {project.business_number && <><span className="text-gray-400">•</span><span>{project.business_number}</span></>}
                        </div>
                        {(project.min_amount != null || project.max_amount != null) && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-700">예상 매출액:</span> {formatAmount(project.min_amount)}원 ~ {formatAmount(project.max_amount)}원
                              </div>
                              {aiEstimateResult[project.id] && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  <Brain className="w-3 h-3" />AI 산정됨
                                </span>
                              )}
                              {aiEstimating[project.id] && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-500 rounded-full text-xs">
                                  <Brain className="w-3 h-3 animate-pulse" />산정 중...
                                </span>
                              )}
                            </div>
                            {/* 납금 일정 미리보기 */}
                            {(() => {
                              const note = paymentNoteMap[project.id];
                              if (!note?.estimated_amount) return null;
                              const items = [
                                { label: '선금', date: note.deposit_date, pct: note.deposit_pct, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                                { label: '중도금', date: note.interim_date,  pct: note.interim_pct,  color: 'bg-blue-50 border-blue-200 text-blue-700'      },
                                { label: '잔금',  date: note.balance_date,  pct: note.balance_pct,  color: 'bg-indigo-50 border-indigo-200 text-indigo-700'  },
                              ].filter(i => i.date && i.pct);
                              if (!items.length) return null;
                              return (
                                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                  {items.map(i => (
                                    <span key={i.label} className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs ${i.color}`}>
                                      <span className="font-bold">{i.label}</span>
                                      <span>{i.date}</span>
                                      <span>·</span>
                                      <span className="font-semibold">{formatAmount(Math.round(note.estimated_amount! * i.pct! / 100))}원</span>
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        {project.summary && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium text-gray-700">영업 내용:</span> {project.summary}
                          </div>
                        )}
                        {project.project_overview && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">프로젝트 개요:</span> {project.project_overview}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mr-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {STAGES.indexOf(project.stage) + 1}/{STAGES.length}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className={`h-full rounded-full ${getProgressColor(project.stage)}`}
                              style={{ width: `${((STAGES.indexOf(project.stage) + 1) / STAGES.length) * 100}%` }} />
                          </div>
                          {(project.amount != null || project.min_amount != null || project.max_amount != null) && !projectsWithNegotiation.has(project.id) && (
                            <button
                              onClick={() => { handleSelectProject(project.id); setEditingNote(null); setShowNoteModal(true); }}
                              className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-medium whitespace-nowrap hover:bg-amber-100 transition-colors"
                            >
                              현재 가격협의 회의 없음
                            </button>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStageColor(project.stage)}`}>
                          {project.stage}
                        </span>
                        <button onClick={() => { setEditingProject(project); setSelectedCompanyId(project.company_id ?? ''); setShowProjectModal(true); }}
                          className="p-1 hover:bg-blue-50 rounded transition-colors ml-1">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button onClick={() => handleDeleteProject(project.id, project.project_name)}
                          className="p-1 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-500">최근 회의 날짜: {getLatestMeetingDate(project.id)}</span>
                      <span className="text-gray-600">담당: {project.manager_name ?? '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Meeting Notes */}
      {selectedProjectId && selectedProject && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-end">
            <button onClick={() => setSelectedProjectId(null)} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">영업프로젝트 명</label>
                <h4 className="text-lg font-bold text-gray-900 mt-1">{selectedProject.project_name}</h4>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">기관명</label>
                <p className="text-sm text-gray-800 mt-1 font-medium">{selectedProject.company_name}</p>
              </div>
              {selectedProject.company_phone && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">기관전화번호</label>
                  <p className="text-sm text-gray-800 mt-1">{selectedProject.company_phone}</p>
                </div>
              )}
              {selectedProject.summary && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">주요 영업 내용</label>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed">{selectedProject.summary}</p>
                </div>
              )}
              {selectedProject.project_overview && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">프로젝트 개요</label>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed">{selectedProject.project_overview}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI 예상 매출 산정 패널 */}
          {(aiEstimating[selectedProjectId] || aiEstimateResult[selectedProjectId]) && (
            <div className="px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              {aiEstimating[selectedProjectId] ? (
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <span className="font-medium">AI 예상매출 산정 중...</span>
                </div>
              ) : aiEstimateResult[selectedProjectId] ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-700">AI 예상 매출 산정 결과</span>
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">회의록 기반</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100 mb-2">
                    <div className="text-xs text-gray-500 mb-1">예상 범위</div>
                    <div className="text-base font-bold text-gray-900">
                      {formatAmount(aiEstimateResult[selectedProjectId].min_amount)}원 ~ {formatAmount(aiEstimateResult[selectedProjectId].max_amount)}원
                    </div>
                    <div className="text-sm text-purple-600 font-medium mt-1">
                      평균 {formatAmount(aiEstimateResult[selectedProjectId].amount)}원
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    {aiEstimateResult[selectedProjectId].reason}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex-1 overflow-auto px-6 py-4">
            <h3 className="text-base font-bold text-gray-900 mb-4">회의록</h3>
            {selectedNotes.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">등록된 회의록이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedNotes.map((note) => (
                  <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                        <Calendar className="w-4 h-4 text-gray-400" />{note.date}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingNote(note); setShowNoteModal(true); }} className="p-1 hover:bg-blue-50 rounded transition-colors">
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button onClick={() => handleDeleteNote(note.id, selectedProjectId)} className="p-1 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* 납금 일정 + 계약 예정 — 상단에 표시 */}
                    {note.estimated_amount != null && ((note.deposit_pct ?? 0) + (note.interim_pct ?? 0) + (note.balance_pct ?? 0)) > 0 && (
                      <div className="mb-3 rounded-lg border border-emerald-200 overflow-hidden">
                        {/* 헤더 */}
                        <div className="grid grid-cols-[1fr_auto] items-center px-3 py-2 bg-emerald-50 border-b border-emerald-200">
                          <span className="text-xs font-bold text-emerald-700">납금 일정</span>
                          <span className="text-xs text-emerald-600 font-semibold">총 {formatAmount(note.estimated_amount)}원</span>
                        </div>
                        {/* 컬럼 헤더 */}
                        <div className="grid grid-cols-[44px_1fr_36px_auto] gap-x-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <span>구분</span><span>지급일</span><span>비율</span><span className="text-right">금액</span>
                        </div>
                        {/* 선금 */}
                        {note.deposit_date && note.deposit_pct != null && (
                          <div className="grid grid-cols-[44px_1fr_36px_auto] gap-x-2 items-center px-3 py-2 border-b border-gray-100 last:border-0">
                            <span className="text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded text-center leading-tight">선금</span>
                            <span className="text-xs text-gray-700">{note.deposit_date}</span>
                            <span className="text-xs text-gray-500 text-center">{note.deposit_pct}%</span>
                            <span className="text-xs font-bold text-emerald-700 text-right">{formatAmount(Math.round(note.estimated_amount * note.deposit_pct / 100))}원</span>
                          </div>
                        )}
                        {/* 중도금 */}
                        {note.interim_date && note.interim_pct != null && (
                          <div className="grid grid-cols-[44px_1fr_36px_auto] gap-x-2 items-center px-3 py-2 border-b border-gray-100 last:border-0">
                            <span className="text-[10px] font-bold text-white bg-blue-500 px-1.5 py-0.5 rounded text-center leading-tight">중도금</span>
                            <span className="text-xs text-gray-700">{note.interim_date}</span>
                            <span className="text-xs text-gray-500 text-center">{note.interim_pct}%</span>
                            <span className="text-xs font-bold text-emerald-700 text-right">{formatAmount(Math.round(note.estimated_amount * note.interim_pct / 100))}원</span>
                          </div>
                        )}
                        {/* 잔금 */}
                        {note.balance_date && note.balance_pct != null && (
                          <div className="grid grid-cols-[44px_1fr_36px_auto] gap-x-2 items-center px-3 py-2">
                            <span className="text-[10px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded text-center leading-tight">잔금</span>
                            <span className="text-xs text-gray-700">{note.balance_date}</span>
                            <span className="text-xs text-gray-500 text-center">{note.balance_pct}%</span>
                            <span className="text-xs font-bold text-emerald-700 text-right">{formatAmount(Math.round(note.estimated_amount * note.balance_pct / 100))}원</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 협의 금액 단독 표시 (납금 일정 없을 때) */}
                    {note.estimated_amount != null && ((note.deposit_pct ?? 0) + (note.interim_pct ?? 0) + (note.balance_pct ?? 0)) === 0 && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">협의 금액</span>
                        <span className="text-sm font-bold text-emerald-700">{formatAmount(note.estimated_amount)}원</span>
                      </div>
                    )}

                    {/* 계약 예정 날짜 */}
                    {note.contract_date && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 mb-2 bg-indigo-50 px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" />
                        계약 예정: {note.contract_date}
                      </div>
                    )}

                    {note.attendees && <div className="text-sm text-gray-600 mb-2">참석자: {note.attendees}</div>}
                    <div className="text-sm text-gray-700 leading-relaxed">{note.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <button onClick={() => { setEditingNote(null); setShowNoteModal(true); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium">
              <Plus className="w-4 h-4" />회의록 추가
            </button>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => { setShowProjectModal(false); setEditingProject(null); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">{editingProject ? '프로젝트 수정' : '새 프로젝트 추가'}</h3>
              <button onClick={() => { setShowProjectModal(false); setEditingProject(null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 명 *</label>
                <input name="project_name" type="text" value={formProjectName} onChange={e => setFormProjectName(e.target.value)} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">기업</label>
                <select name="company_id" value={selectedCompanyId}
                  onChange={e => setSelectedCompanyId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="">기업을 선택하세요 (직접 입력 가능)</option>
                  {companies.length > 0 && (
                    <optgroup label="자사 관리 기업">
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  )}
                  {companyDataList.length > 0 && (
                    <optgroup label="기업 정보 수집">
                      {companyDataList.map(c => <option key={c.id} value={`cd_${c.id}`}>{c.name}</option>)}
                    </optgroup>
                  )}
                </select>
                {!selectedCompanyId && (
                  <input name="company_name" type="text" placeholder="또는 기업명 직접 입력" defaultValue={editingProject?.company_name}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">영업 단계 *</label>
                  <select name="stage" defaultValue={editingProject?.stage ?? '미팅 요청'} required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">지역 (기수 대시보드 반영)</label>
                  <select name="region" defaultValue={editingProject?.region ?? ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                    <option value="">미지정</option>
                    <option value="korea">한국</option>
                    <option value="japan">일본</option>
                    <option value="vietnam">베트남</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">안건 등급</label>
                <div className="grid grid-cols-6 gap-2">
                  {ISSUE_GRADES.map(g => {
                    const meta = ISSUE_GRADE_META[g];
                    return (
                      <label key={g} className="cursor-pointer">
                        <input type="radio" name="issue_grade" value={g}
                          checked={formIssueGrade === g}
                          onChange={() => setFormIssueGrade(g)}
                          className="sr-only peer" />
                        <div className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 text-center transition-all
                          peer-checked:border-current peer-checked:shadow-sm border-gray-200 hover:border-gray-300
                          ${formIssueGrade === g ? `${meta.color} border-current` : 'bg-white text-gray-600'}`}>
                          <span className="text-sm font-extrabold">{g}</span>
                          <span className="text-[10px] font-medium">{meta.prob}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {formIssueGrade ? ISSUE_GRADE_DESC[formIssueGrade] : '등급을 선택하면 설명이 표시됩니다'}
                </p>
                <label className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 cursor-pointer">
                  <input type="radio" name="issue_grade" value=""
                    checked={formIssueGrade === ''}
                    onChange={() => setFormIssueGrade('')}
                    className="accent-gray-400" />
                  등급 없음
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">담당자</label>
                <select name="sales_personnel_id" defaultValue={editingProject?.sales_personnel_id ?? ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="">담당자를 선택하세요</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.name} {p.position ? `(${p.position})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">예상 금액 (원)</label>
                  <input name="amount" type="number" defaultValue={editingProject?.amount ?? ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">최소 예상 (원)</label>
                  <input name="min_amount" type="number" defaultValue={editingProject?.min_amount ?? ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">최대 예상 (원)</label>
                  <input name="max_amount" type="number" defaultValue={editingProject?.max_amount ?? ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">주요 영업 내용</label>
                  <AiButton
                    getPrompt={() => `프로젝트 "${formProjectName}"(${companies.find(c => c.id === selectedCompanyId)?.name ?? '고객사'}) 영업 요약을 2-3문장으로 작성해줘. 한국어, 간결하게.`}
                    onResult={setFormSummary}
                  />
                </div>
                <textarea name="summary" value={formSummary} onChange={e => setFormSummary(e.target.value)} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">프로젝트 개요</label>
                  <AiButton
                    getPrompt={() => `프로젝트 "${formProjectName}"(${companies.find(c => c.id === selectedCompanyId)?.name ?? '고객사'}) 프로젝트 개요를 3-4문장으로 작성해줘. 배경, 목표, 기대효과 중심으로. 한국어, 간결하게.`}
                    onResult={setFormOverview}
                  />
                </div>
                <textarea name="project_overview" value={formOverview} onChange={e => setFormOverview(e.target.value)} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={() => { setShowProjectModal(false); setEditingProject(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium">취소</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => { setShowNoteModal(false); setEditingNote(null); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{editingNote ? '회의록 수정' : '회의록 추가'}</h3>
              <button onClick={() => { setShowNoteModal(false); setEditingNote(null); }} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveNote} className="overflow-y-auto flex-1">
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">날짜 *</label>
                  <input name="date" type="date" defaultValue={editingNote?.date ?? new Date().toISOString().slice(0, 10)} required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">참석자</label>
                  <input name="attendees" type="text" defaultValue={editingNote?.attendees ?? ''} placeholder="예: 김영수, 박팀장 외 2명"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    협의 금액 (원) <span className="text-gray-400 font-normal">— 회의에서 논의된 예상 매출액</span>
                  </label>
                  <input name="estimated_amount" type="number"
                    defaultValue={editingNote?.estimated_amount ?? ''}
                    onChange={e => setNoteEstAmt(e.target.value ? Number(e.target.value) : null)}
                    placeholder="예: 150000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                {/* 계약 예정 날짜 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">계약 예정 날짜</label>
                  <input name="contract_date" type="date" defaultValue={editingNote?.contract_date ?? ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                {/* 납금 일정 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">납금 일정</span>
                    {totalPct > 0 && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        totalPct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}>
                        합계 {totalPct}% {totalPct === 100 ? '✓' : '≠ 100%'}
                      </span>
                    )}
                  </div>
                  {/* 컬럼 헤더 */}
                  <div className="grid grid-cols-[52px_1fr_68px_1fr] gap-x-3 px-4 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <span>구분</span><span>지급 일자</span><span>비율</span><span>금액</span>
                  </div>
                  {/* 선금 */}
                  <div className="grid grid-cols-[52px_1fr_68px_1fr] gap-x-3 items-center px-4 py-2.5 border-b border-gray-100">
                    <span className="text-[11px] font-bold text-emerald-600">선금</span>
                    <input name="deposit_date" type="date" defaultValue={editingNote?.deposit_date ?? ''}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white w-full" />
                    <div className="relative">
                      <input type="number" min="0" max="100" placeholder="0"
                        value={depositPct ?? ''}
                        onChange={e => setDepositPct(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-1.5 pr-6 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">
                      {noteEstAmt && (depositPct ?? 0) > 0 ? formatAmount(Math.round(noteEstAmt * (depositPct ?? 0) / 100)) + '원' : '-'}
                    </span>
                  </div>
                  {/* 중도금 */}
                  <div className="grid grid-cols-[52px_1fr_68px_1fr] gap-x-3 items-center px-4 py-2.5 border-b border-gray-100">
                    <span className="text-[11px] font-bold text-blue-600">중도금</span>
                    <input name="interim_date" type="date" defaultValue={editingNote?.interim_date ?? ''}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white w-full" />
                    <div className="relative">
                      <input type="number" min="0" max="100" placeholder="0"
                        value={interimPct ?? ''}
                        onChange={e => setInterimPct(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-1.5 pr-6 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">
                      {noteEstAmt && (interimPct ?? 0) > 0 ? formatAmount(Math.round(noteEstAmt * (interimPct ?? 0) / 100)) + '원' : '-'}
                    </span>
                  </div>
                  {/* 잔금 */}
                  <div className="grid grid-cols-[52px_1fr_68px_1fr] gap-x-3 items-center px-4 py-2.5">
                    <span className="text-[11px] font-bold text-indigo-600">잔금</span>
                    <input name="balance_date" type="date" defaultValue={editingNote?.balance_date ?? ''}
                      className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white w-full" />
                    <div className="relative">
                      <input type="number" min="0" max="100" placeholder="0"
                        value={balancePct ?? ''}
                        onChange={e => setBalancePct(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-1.5 pr-6 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">
                      {noteEstAmt && (balancePct ?? 0) > 0 ? formatAmount(Math.round(noteEstAmt * (balancePct ?? 0) / 100)) + '원' : '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">회의 내용</label>
                    <AiButton
                      getPrompt={() => `영업 회의 내용을 작성해줘. 프로젝트: ${projects.find(p => p.id === selectedProjectId)?.project_name ?? '미정'}. 주요 논의 사항, 결정 사항, 다음 액션 아이템을 포함해 3-5문장으로. 한국어, 간결하게.`}
                      onResult={setNoteContent}
                    />
                  </div>
                  <textarea name="content" value={noteContent} onChange={e => setNoteContent(e.target.value)} rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
                <button type="button" onClick={() => { setShowNoteModal(false); setEditingNote(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium">취소</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
