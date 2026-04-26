import { useState, useEffect } from 'react';
import { Search, Plus, X, BookmarkPlus, BookmarkCheck, ExternalLink, Edit2, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type CompanySizeType = '대기업' | '중견' | '스타트업';

interface ReferenceCase {
  id: string;
  company_name: string;
  industry: string | null;
  company_size: CompanySizeType | null;
  problem: string | null;
  solution: string | null;
  result: string | null;
  period: string | null;
  source_url: string | null;
  tags: string[] | null;
  created_at: string;
}

interface PrepMeeting {
  id: string;
  target_company: string;
  industry: string | null;
  pain_points: string | null;
  meeting_date: string;
  created_at: string;
}

interface MeetingCaseLink {
  meeting_id: string;
  case_id: string;
  relevance_note: string | null;
}

const SIZE_STYLE: Record<string, string> = {
  '대기업':  'bg-purple-100 text-purple-700',
  '중견':    'bg-blue-100   text-blue-700',
  '스타트업': 'bg-green-100  text-green-700',
};

function isSoon(dateStr: string) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86_400_000;
  return diff >= 0 && diff <= 3;
}

export function MeetingPrep() {
  const [cases, setCases]           = useState<ReferenceCase[]>([]);
  const [meetings, setMeetings]     = useState<PrepMeeting[]>([]);
  const [links, setLinks]           = useState<MeetingCaseLink[]>([]);
  const [activeTab, setActiveTab]   = useState<'library' | 'prep'>('library');
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  // library filters
  const [search, setSearch]             = useState('');
  const [fIndustry, setFIndustry]       = useState('전체');
  const [fSize, setFSize]               = useState('전체');

  // modals
  const [showCaseModal, setShowCaseModal]       = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingCase, setEditingCase]           = useState<ReferenceCase | null>(null);
  const [editingMeeting, setEditingMeeting]     = useState<PrepMeeting | null>(null);
  const [noteInputs, setNoteInputs]             = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: c, error: ce }, { data: m }, { data: mc }] = await Promise.all([
      supabase.from('cases').select('*').order('created_at', { ascending: false }),
      supabase.from('meetings').select('*').order('meeting_date'),
      supabase.from('meeting_cases').select('*'),
    ]);
    if (ce) { setDbError(true); setLoading(false); return; }
    setCases(c ?? []);
    setMeetings(m ?? []);
    setLinks(mc ?? []);
    setLoading(false);
  }

  // ── derived ─────────────────────────────────────────────────────────
  const industries = ['전체', ...Array.from(new Set(cases.map(c => c.industry).filter(Boolean) as string[]))];

  const filteredCases = cases.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      c.company_name.toLowerCase().includes(q) ||
      (c.problem ?? '').toLowerCase().includes(q) ||
      (c.result ?? '').toLowerCase().includes(q) ||
      (c.tags ?? []).some(t => t.toLowerCase().includes(q));
    return matchQ &&
      (fIndustry === '전체' || c.industry === fIndustry) &&
      (fSize === '전체' || c.company_size === fSize);
  });

  const activeMeeting  = meetings.find(m => m.id === activeMeetingId);
  const pinnedLinks    = links.filter(l => l.meeting_id === activeMeetingId);
  const pinnedIds      = new Set(pinnedLinks.map(l => l.case_id));
  const pinnedCases    = pinnedLinks
    .map(l => ({ ...l, caseData: cases.find(c => c.id === l.case_id) }))
    .filter(l => l.caseData) as (MeetingCaseLink & { caseData: ReferenceCase })[];

  const recommendedCases = activeMeeting
    ? cases
        .filter(c =>
          !pinnedIds.has(c.id) &&
          (c.industry === activeMeeting.industry ||
           (activeMeeting.pain_points && c.problem?.includes(activeMeeting.pain_points.slice(0, 6))))
        )
        .slice(0, 8)
    : [];

  // ── CRUD ─────────────────────────────────────────────────────────────
  async function handleSaveCase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const fd   = new FormData(e.currentTarget);
    const tags = (fd.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      company_name: fd.get('company_name') as string,
      industry:     (fd.get('industry') as string) || null,
      company_size: (fd.get('company_size') as CompanySizeType) || null,
      problem:      (fd.get('problem') as string) || null,
      solution:     (fd.get('solution') as string) || null,
      result:       (fd.get('result') as string) || null,
      period:       (fd.get('period') as string) || null,
      source_url:   (fd.get('source_url') as string) || null,
      tags:         tags.length ? tags : null,
    };
    if (editingCase) {
      const { data } = await supabase.from('cases').update(payload).eq('id', editingCase.id).select().single();
      if (data) setCases(p => p.map(c => c.id === editingCase.id ? data : c));
    } else {
      const { data } = await supabase.from('cases').insert(payload).select().single();
      if (data) setCases(p => [data, ...p]);
    }
    setSaving(false); setShowCaseModal(false); setEditingCase(null);
  }

  async function handleDeleteCase(id: string) {
    if (!window.confirm('사례를 삭제하시겠습니까?')) return;
    await supabase.from('cases').delete().eq('id', id);
    setCases(p => p.filter(c => c.id !== id));
  }

  async function handleSaveMeeting(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      target_company: fd.get('target_company') as string,
      industry:       (fd.get('industry') as string) || null,
      pain_points:    (fd.get('pain_points') as string) || null,
      meeting_date:   fd.get('meeting_date') as string,
    };
    if (editingMeeting) {
      const { data } = await supabase.from('meetings').update(payload).eq('id', editingMeeting.id).select().single();
      if (data) setMeetings(p => p.map(m => m.id === editingMeeting.id ? data : m));
    } else {
      const { data } = await supabase.from('meetings').insert(payload).select().single();
      if (data) { setMeetings(p => [...p, data]); setActiveMeetingId(data.id); setActiveTab('prep'); }
    }
    setSaving(false); setShowMeetingModal(false); setEditingMeeting(null);
  }

  async function handleDeleteMeeting(id: string) {
    if (!window.confirm('미팅을 삭제하시겠습니까?')) return;
    await supabase.from('meetings').delete().eq('id', id);
    setMeetings(p => p.filter(m => m.id !== id));
    if (activeMeetingId === id) setActiveMeetingId(null);
  }

  async function handlePin(caseId: string) {
    if (!activeMeetingId) return;
    const note = noteInputs[caseId] ?? '';
    await supabase.from('meeting_cases').insert({ meeting_id: activeMeetingId, case_id: caseId, relevance_note: note || null });
    setLinks(p => [...p, { meeting_id: activeMeetingId, case_id: caseId, relevance_note: note || null }]);
  }

  async function handleUnpin(caseId: string) {
    if (!activeMeetingId) return;
    await supabase.from('meeting_cases').delete().eq('meeting_id', activeMeetingId).eq('case_id', caseId);
    setLinks(p => p.filter(l => !(l.meeting_id === activeMeetingId && l.case_id === caseId)));
  }

  // ── Loading / Error ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-indigo-400 animate-spin" />
    </div>
  );

  if (dbError) return (
    <div className="flex h-full items-center justify-center flex-col gap-3 text-center px-8">
      <AlertCircle className="w-10 h-10 text-amber-400" />
      <p className="text-sm font-semibold text-gray-700">DB 테이블이 필요합니다</p>
      <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
        Supabase에 <code className="bg-gray-100 px-1 rounded">cases</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">meetings</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">meeting_cases</code> 테이블을 생성한 후 새로고침해 주세요.
      </p>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">미팅 준비</h1>
          <p className="text-sm text-gray-400 mt-0.5">레퍼런스 사례 라이브러리 &amp; 미팅 자료 구성</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {(['library', 'prep'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'library' ? '사례 라이브러리' : (
                <span className="flex items-center gap-1.5">
                  미팅 준비
                  {meetings.length > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                      {meetings.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Library ────────────────────────────────────────────── */}
      {activeTab === 'library' && (
        <div className="flex-1 overflow-auto p-6">
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="기업명, 문제, 성과 검색…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <select value={fIndustry} onChange={e => setFIndustry(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {industries.map(i => <option key={i}>{i}</option>)}
            </select>
            <div className="flex gap-1.5">
              {['전체', '대기업', '중견', '스타트업'].map(s => (
                <button key={s} onClick={() => setFSize(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    fSize === s ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => { setEditingCase(null); setShowCaseModal(true); }}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />사례 추가
            </button>
          </div>

          {/* Case grid */}
          {filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FileText className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-400">{cases.length === 0 ? '등록된 사례가 없습니다' : '검색 결과가 없습니다'}</p>
              {cases.length === 0 && (
                <button onClick={() => { setEditingCase(null); setShowCaseModal(true); }}
                  className="mt-1 text-sm text-indigo-500 hover:underline">
                  첫 번째 사례 추가하기
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredCases.map(c => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{c.company_name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {c.industry && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{c.industry}</span>
                        )}
                        {c.company_size && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SIZE_STYLE[c.company_size] ?? ''}`}>
                            {c.company_size}
                          </span>
                        )}
                        {c.period && (
                          <span className="text-xs text-gray-400">{c.period}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {c.source_url && (
                        <a href={c.source_url} target="_blank" rel="noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      )}
                      <button onClick={() => { setEditingCase(c); setShowCaseModal(true); }}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                      <button onClick={() => handleDeleteCase(c.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* P / S / R */}
                  <div className="space-y-1.5 text-sm">
                    {c.problem && (
                      <div className="flex gap-2">
                        <span className="shrink-0 text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded mt-0.5">문제</span>
                        <span className="text-gray-600 line-clamp-2">{c.problem}</span>
                      </div>
                    )}
                    {c.solution && (
                      <div className="flex gap-2">
                        <span className="shrink-0 text-[10px] font-bold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">해결</span>
                        <span className="text-gray-600 line-clamp-2">{c.solution}</span>
                      </div>
                    )}
                    {c.result && (
                      <div className="flex gap-2">
                        <span className="shrink-0 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">성과</span>
                        <span className="text-gray-800 font-medium line-clamp-2">{c.result}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {(c.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-50">
                      {c.tags!.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full text-xs">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Prep ───────────────────────────────────────────────── */}
      {activeTab === 'prep' && (
        <div className="flex-1 flex overflow-hidden">

          {/* Left: meeting list */}
          <div className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">미팅 목록</span>
              <button onClick={() => { setEditingMeeting(null); setShowMeetingModal(true); }}
                className="p-1 hover:bg-indigo-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-indigo-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              {meetings.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  미팅을 추가해 주세요
                </div>
              ) : (
                meetings.map(m => (
                  <button key={m.id} onClick={() => setActiveMeetingId(m.id)}
                    className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                      activeMeetingId === m.id
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'border-transparent hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm font-semibold truncate ${activeMeetingId === m.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {m.target_company}
                      </p>
                      {isSoon(m.meeting_date) && (
                        <span className="shrink-0 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">D-Soon</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{m.meeting_date}</p>
                    {m.industry && <p className="text-xs text-gray-400">{m.industry}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      핀: {links.filter(l => l.meeting_id === m.id).length}개
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: prep area */}
          <div className="flex-1 overflow-auto p-6">
            {!activeMeeting ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <Calendar className="w-12 h-12 text-gray-200" />
                <p className="text-gray-400 text-sm">왼쪽에서 미팅을 선택하거나 새로 만들어 주세요</p>
                <button onClick={() => { setEditingMeeting(null); setShowMeetingModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  <Plus className="w-4 h-4" />새 미팅 만들기
                </button>
              </div>
            ) : (
              <div className="max-w-3xl space-y-6">

                {/* Meeting header card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{activeMeeting.target_company}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{activeMeeting.meeting_date}</span>
                        {activeMeeting.industry && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {activeMeeting.industry}
                          </span>
                        )}
                        {isSoon(activeMeeting.meeting_date) && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">곧 예정</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingMeeting(activeMeeting); setShowMeetingModal(true); }}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                      <button onClick={() => handleDeleteMeeting(activeMeeting.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                  {activeMeeting.pain_points && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm text-amber-800">
                      <span className="font-semibold text-amber-600 text-xs uppercase tracking-wide">예상 니즈 / 문제</span>
                      <p className="mt-1">{activeMeeting.pain_points}</p>
                    </div>
                  )}
                </div>

                {/* Pinned cases (prep sheet) */}
                {pinnedCases.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookmarkCheck className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-gray-800">오늘 쓸 레퍼런스 ({pinnedCases.length}개)</h3>
                    </div>
                    <div className="space-y-3">
                      {pinnedCases.map(({ caseData, relevance_note }) => (
                        <div key={caseData.id} className="bg-white rounded-xl border border-indigo-100 shadow-sm p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900">{caseData.company_name}</span>
                              {caseData.industry && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{caseData.industry}</span>
                              )}
                              {caseData.company_size && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SIZE_STYLE[caseData.company_size] ?? ''}`}>
                                  {caseData.company_size}
                                </span>
                              )}
                            </div>
                            <button onClick={() => handleUnpin(caseData.id)}
                              className="shrink-0 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                            {caseData.problem && (
                              <div className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-[10px] font-bold text-gray-400 mb-1">문제</p>
                                <p className="text-gray-700 text-xs leading-relaxed">{caseData.problem}</p>
                              </div>
                            )}
                            {caseData.solution && (
                              <div className="bg-blue-50 rounded-lg p-2.5">
                                <p className="text-[10px] font-bold text-blue-400 mb-1">해결</p>
                                <p className="text-blue-800 text-xs leading-relaxed">{caseData.solution}</p>
                              </div>
                            )}
                            {caseData.result && (
                              <div className="bg-emerald-50 rounded-lg p-2.5">
                                <p className="text-[10px] font-bold text-emerald-500 mb-1">성과</p>
                                <p className="text-emerald-800 text-xs font-medium leading-relaxed">{caseData.result}</p>
                              </div>
                            )}
                          </div>
                          {relevance_note && (
                            <div className="flex items-start gap-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
                              <span className="font-semibold shrink-0">쓰는 이유:</span>
                              <span>{relevance_note}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended cases */}
                {recommendedCases.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">추천 사례 (업종 유사)</h3>
                    <div className="space-y-2">
                      {recommendedCases.map(c => (
                        <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 hover:border-indigo-200 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-gray-800 text-sm">{c.company_name}</span>
                              {c.industry && <span className="text-xs text-gray-400">{c.industry}</span>}
                              {c.company_size && (
                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${SIZE_STYLE[c.company_size] ?? ''}`}>
                                  {c.company_size}
                                </span>
                              )}
                            </div>
                            {c.result && (
                              <p className="text-xs text-emerald-700 font-medium line-clamp-1">✓ {c.result}</p>
                            )}
                            <input
                              type="text"
                              placeholder="이 사례를 쓰는 이유 (선택)"
                              value={noteInputs[c.id] ?? ''}
                              onChange={e => setNoteInputs(p => ({ ...p, [c.id]: e.target.value }))}
                              onClick={e => e.stopPropagation()}
                              className="mt-2 w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            />
                          </div>
                          <button onClick={() => handlePin(c.id)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                            <BookmarkPlus className="w-3.5 h-3.5" />핀
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual case search when no recommendations */}
                {recommendedCases.length === 0 && pinnedCases.length < 3 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">사례 추가</h3>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="사례 검색…" value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                      </div>
                      {cases.filter(c => !pinnedIds.has(c.id) && (!search || c.company_name.toLowerCase().includes(search.toLowerCase()))).slice(0, 5).map(c => (
                        <div key={c.id} className="flex items-center gap-3 py-2 border-t border-gray-50">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-800">{c.company_name}</span>
                            {c.industry && <span className="ml-2 text-xs text-gray-400">{c.industry}</span>}
                            {c.result && <p className="text-xs text-emerald-600 truncate mt-0.5">✓ {c.result}</p>}
                          </div>
                          <button onClick={() => handlePin(c.id)}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
                            <BookmarkPlus className="w-3 h-3" />핀
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Case Modal ───────────────────────────────────────────────── */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => { setShowCaseModal(false); setEditingCase(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-base font-bold text-gray-900">{editingCase ? '사례 수정' : '새 사례 등록'}</h3>
              <button onClick={() => { setShowCaseModal(false); setEditingCase(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveCase} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">레퍼런스 기업명 *</label>
                  <input name="company_name" required defaultValue={editingCase?.company_name}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">업종</label>
                  <input name="industry" defaultValue={editingCase?.industry ?? ''}
                    placeholder="예: 제조, IT, 물류"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">기업 규모</label>
                  <select name="company_size" defaultValue={editingCase?.company_size ?? ''}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="">선택 안 함</option>
                    <option>대기업</option><option>중견</option><option>스타트업</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">도입 기간</label>
                  <input name="period" defaultValue={editingCase?.period ?? ''}
                    placeholder="예: 3개월"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">어떤 문제가 있었나</label>
                <textarea name="problem" rows={2} defaultValue={editingCase?.problem ?? ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">어떤 솔루션을 썼나</label>
                <textarea name="solution" rows={2} defaultValue={editingCase?.solution ?? ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-600 mb-1.5">수치 포함 성과 *</label>
                <textarea name="result" rows={2} defaultValue={editingCase?.result ?? ''}
                  placeholder="예: 처리 시간 40% 단축, 인건비 월 200만원 절감"
                  className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">키워드 태그</label>
                  <input name="tags" defaultValue={(editingCase?.tags ?? []).join(', ')}
                    placeholder="쉼표로 구분: DX, 자동화"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">출처 링크</label>
                  <input name="source_url" type="url" defaultValue={editingCase?.source_url ?? ''}
                    placeholder="https://…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowCaseModal(false); setEditingCase(null); }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? '저장 중…' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Meeting Modal ────────────────────────────────────────────── */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => { setShowMeetingModal(false); setEditingMeeting(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{editingMeeting ? '미팅 수정' : '새 미팅 만들기'}</h3>
              <button onClick={() => { setShowMeetingModal(false); setEditingMeeting(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveMeeting} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">미팅 대상 회사 *</label>
                <input name="target_company" required defaultValue={editingMeeting?.target_company}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">미팅 날짜 *</label>
                  <input name="meeting_date" type="date" required
                    defaultValue={editingMeeting?.meeting_date ?? new Date().toISOString().slice(0, 10)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">업종</label>
                  <input name="industry" defaultValue={editingMeeting?.industry ?? ''}
                    placeholder="예: 제조, IT"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">예상 니즈 / 문제</label>
                <textarea name="pain_points" rows={3} defaultValue={editingMeeting?.pain_points ?? ''}
                  placeholder="미팅 전 예상되는 고객의 니즈나 문제점을 적어두세요"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowMeetingModal(false); setEditingMeeting(null); }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? '저장 중…' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
