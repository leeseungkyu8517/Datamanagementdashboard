import { useState, useEffect, useRef } from 'react';
import {
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Globe, RefreshCw, Star, Tag, Building2, X, Plus, Loader2, CheckCircle, AlertTriangle, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CompanyData, CompanyDataCrawling, BrycenKeyword, DiscoveredCompany } from '@/lib/database.types';

const ITEMS_PER_PAGE = 8;

const getGradeColor = (label: CompanyData['grade_label']): string => {
  switch (label) {
    case 'VIP':      return 'bg-amber-100 text-amber-700 border-amber-500';
    case 'Core':     return 'bg-purple-100 text-purple-700 border-purple-500';
    case 'Active':   return 'bg-blue-100 text-blue-700 border-blue-500';
    case 'Manage':   return 'bg-green-100 text-green-700 border-green-500';
    case 'Inactive': return 'bg-gray-100 text-gray-500 border-gray-400';
    default:         return 'bg-gray-100 text-gray-400 border-gray-300';
  }
};

const getSizeColor = (size: CompanyData['size']) => {
  switch (size) {
    case '대기업':  return 'bg-indigo-100 text-indigo-700';
    case '중견기업': return 'bg-teal-100 text-teal-700';
    case '중소기업': return 'bg-amber-100 text-amber-700';
    default:       return 'bg-gray-100 text-gray-700';
  }
};

const getKeywordStyle = (keyword: string) => {
  if (keyword === '디지털 전환 공표') return 'px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-300 rounded text-xs font-semibold';
  if (keyword === '채용')           return 'px-2 py-0.5 bg-pink-100 text-pink-700 border border-pink-300 rounded text-xs font-semibold';
  return 'px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs';
};

export function CompanyDataCollection() {
  // ── 기존 상태 ─────────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawlingMap, setCrawlingMap] = useState<Record<string, CompanyDataCrawling[]>>({});
  const [loadingCrawling, setLoadingCrawling] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [functionLoading, setFunctionLoading] = useState<Record<string, string>>({});
  const [functionResult, setFunctionResult] = useState<Record<string, { type: string; message: string }>>({});
  const [dartNotFound, setDartNotFound] = useState<Record<string, boolean>>({});
  const [dartRegistered, setDartRegistered] = useState<Record<string, boolean>>({});
  const [publicRegistered, setPublicRegistered] = useState<Record<string, boolean>>({});

  // ── 키워드 모달 상태 ───────────────────────────────────────────────────────
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [keywords, setKeywords] = useState<BrycenKeyword[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [deletingKeyword, setDeletingKeyword] = useState<string | null>(null);
  const newKeywordRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // ── 기업 발굴 모달 상태 ───────────────────────────────────────────────────
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoveredCompanies, setDiscoveredCompanies] = useState<DiscoveredCompany[]>([]);
  const [discoverError, setDiscoverError] = useState('');
  const [addingCompany, setAddingCompany] = useState<Record<string, boolean>>({});
  const [addedCompanies, setAddedCompanies] = useState<Set<string>>(new Set());
  const [searchedKeywords, setSearchedKeywords] = useState<string[]>([]);
  const [newsCount, setNewsCount] = useState(0);
  const [sampleTitles, setSampleTitles] = useState<string[]>([]);

  useEffect(() => { fetchCompanies(); }, []);

  // ── 기존 함수들 ────────────────────────────────────────────────────────────
  async function fetchCompanies() {
    setLoading(true);
    const { data } = await supabase.from('company_data').select('*').order('name');
    setCompanies(data ?? []);
    setLoading(false);
  }

  async function fetchCrawling(companyId: string, force = false) {
    if (!force && crawlingMap[companyId] !== undefined) return;
    setLoadingCrawling(prev => ({ ...prev, [companyId]: true }));
    const { data } = await supabase
      .from('company_data_crawling')
      .select('*')
      .eq('company_data_id', companyId)
      .order('collected_at', { ascending: false });
    setCrawlingMap(prev => ({ ...prev, [companyId]: data ?? [] }));
    setLoadingCrawling(prev => ({ ...prev, [companyId]: false }));
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchCrawling(id);
    }
  };

  async function runCrawling(companyId: string) {
    setFunctionLoading(prev => ({ ...prev, [companyId]: 'crawling' }));
    setFunctionResult(prev => ({ ...prev, [companyId]: { type: '', message: '' } }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-crawling', {
        body: { company_id: companyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCompanies(prev => prev.map(c =>
        c.id === companyId
          ? {
              ...c,
              keywords: data.keywords,
              ai_summary: data.summary,
              ...(data.industry && { industry: data.industry }),
              ...(data.revenue  && { revenue:  data.revenue  }),
              ...(data.country  && { country:  data.country  }),
            }
          : c
      ));
      if (expandedId === companyId) fetchCrawling(companyId, true);
      const isDartReg   = data.dart_registered   === true;
      const isPubReg    = data.public_registered  === true;
      setDartRegistered(prev   => ({ ...prev,   [companyId]: isDartReg }));
      setPublicRegistered(prev => ({ ...prev,   [companyId]: isPubReg }));
      setDartNotFound(prev     => ({ ...prev,   [companyId]: !isDartReg && !isPubReg }));
      const unregTags = [
        !isDartReg  ? 'DART 미등록'        : '',
        !isPubReg   ? '공공데이터 미등록'   : '',
      ].filter(Boolean).join(' · ');
      const infoMsg = unregTags ? ` (${unregTags})` : '';
      setFunctionResult(prev => ({ ...prev, [companyId]: { type: 'success', message: `크롤링 완료! 키워드가 업데이트됐습니다.${infoMsg}` } }));
    } catch (e) {
      setFunctionResult(prev => ({ ...prev, [companyId]: { type: 'error', message: `크롤링 실패: ${String(e)}` } }));
    } finally {
      setFunctionLoading(prev => ({ ...prev, [companyId]: '' }));
    }
  }

  async function runGrading(companyId: string) {
    setFunctionLoading(prev => ({ ...prev, [companyId]: 'grading' }));
    setFunctionResult(prev => ({ ...prev, [companyId]: { type: '', message: '' } }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-grading', {
        body: { company_id: companyId },
      });
      if (error) {
        // FunctionsHttpError에서 실제 에러 메시지 추출 시도
        let detail = String(error);
        try {
          const body = await (error as { context?: Response }).context?.json();
          if (body?.error) detail = body.error;
          if (body?.debug) console.log('[ai-grading debug]', body.debug);
        } catch (_) { /* ignore */ }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      setCompanies(prev => prev.map(c =>
        c.id === companyId
          ? {
              ...c,
              grade_label: data.grade_label,
              grade_score: data.grade_score,
              score_size: data.score_size,
              score_solution: data.score_solution,
              score_relation: data.score_relation,
              score_growth: data.score_growth,
              score_risk: data.score_risk,
              ai_summary: data.reason,
            }
          : c
      ));
      if (data?.debug) console.log('[ai-grading debug]', data.debug);
      setFunctionResult(prev => ({
        ...prev,
        [companyId]: { type: 'success', message: `등급 판정 완료: ${data.grade_label} (${data.grade_score}점)` },
      }));
    } catch (e) {
      setFunctionResult(prev => ({ ...prev, [companyId]: { type: 'error', message: `등급 판정 실패: ${String(e)}` } }));
    } finally {
      setFunctionLoading(prev => ({ ...prev, [companyId]: '' }));
    }
  }

  async function deleteCompany(companyId: string, companyName: string) {
    if (!confirm(`"${companyName}" 기업을 삭제하시겠습니까?\n크롤링 이력도 함께 삭제됩니다.`)) return;
    const { error } = await supabase.from('company_data').delete().eq('id', companyId);
    if (error) { alert(`삭제 실패: ${error.message}`); return; }
    setCompanies(prev => prev.filter(c => c.id !== companyId));
    setCrawlingMap(prev => { const n = { ...prev }; delete n[companyId]; return n; });
    setDartNotFound(prev => { const n = { ...prev }; delete n[companyId]; return n; });
    setDartRegistered(prev => { const n = { ...prev }; delete n[companyId]; return n; });
    setPublicRegistered(prev => { const n = { ...prev }; delete n[companyId]; return n; });
    if (expandedId === companyId) setExpandedId(null);
  }

  // ── 키워드 관리 함수들 ─────────────────────────────────────────────────────
  const [keywordError, setKeywordError] = useState('');

  async function fetchKeywords() {
    setKeywordLoading(true);
    setKeywordError('');
    const { data, error } = await supabase.from('brycen_keywords').select('*').order('created_at');
    if (error) {
      setKeywordError(`불러오기 실패: ${error.message}`);
    } else {
      setKeywords(data ?? []);
    }
    setKeywordLoading(false);
  }

  function openKeywordModal() {
    setShowKeywordModal(true);
    fetchKeywords();
  }

  async function addKeyword() {
    const kw = newKeyword.trim();
    if (!kw || addingKeyword) return;
    setAddingKeyword(true);
    setKeywordError('');
    const { error } = await supabase.from('brycen_keywords').insert({ keyword: kw });
    if (error) {
      setKeywordError(`추가 실패: ${error.message}`);
    } else {
      setNewKeyword('');
      await fetchKeywords();
      newKeywordRef.current?.focus();
    }
    setAddingKeyword(false);
  }

  async function deleteKeyword(id: string) {
    setDeletingKeyword(id);
    const { error } = await supabase.from('brycen_keywords').delete().eq('id', id);
    if (error) {
      setKeywordError(`삭제 실패: ${error.message}`);
      setDeletingKeyword(null);
      return;
    }
    setKeywords(prev => prev.filter(k => k.id !== id));
    setDeletingKeyword(null);
  }

  // ── 기업 발굴 함수들 ───────────────────────────────────────────────────────
  async function runCompanyDiscover() {
    setDiscoverLoading(true);
    setDiscoverError('');
    setDiscoveredCompanies([]);
    setAddedCompanies(new Set());
    setSearchedKeywords([]);
    setNewsCount(0);
    setSampleTitles([]);
    try {
      const { data, error } = await supabase.functions.invoke('ai-company-discover', { body: {} });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setDiscoveredCompanies(data.companies ?? []);
      setSearchedKeywords(data.searched_keywords ?? []);
      setNewsCount(data.news_count ?? 0);
      setSampleTitles(data.sample_titles ?? []);
    } catch (e) {
      setDiscoverError(String(e));
    } finally {
      setDiscoverLoading(false);
    }
  }

  function openDiscoverModal() {
    setShowDiscoverModal(true);
    setDiscoveredCompanies([]);
    setDiscoverError('');
    setAddedCompanies(new Set());
    runCompanyDiscover();
  }

  async function addDiscoveredCompany(company: DiscoveredCompany) {
    setAddingCompany(prev => ({ ...prev, [company.name]: true }));
    let insertedId: string | null = null;
    try {
      const { data: inserted, error } = await supabase
        .from('company_data')
        .insert({ name: company.name, industry: company.industry })
        .select()
        .single();
      if (error) throw error;
      setAddedCompanies(prev => new Set([...prev, company.name]));
      if (inserted) {
        insertedId = inserted.id;
        setCompanies(prev => [inserted, ...prev]);
        setCurrentPage(1);
        listContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingCompany(prev => ({ ...prev, [company.name]: false }));
    }
    if (insertedId) {
      await runCrawling(insertedId);
      await runGrading(insertedId);
    }
  }

  // ── 필터링 · 페이징 ───────────────────────────────────────────────────────
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.industry ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.keywords ?? []).some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedId(null);
  };

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">기업 정보 수집</h1>
        <p className="text-sm text-gray-500 mt-1">크롤링을 통해 수집된 기업 정보를 관리합니다</p>
      </div>

      <div ref={listContainerRef} className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        {/* 검색 + 버튼 바 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="기업명, 산업군, 키워드로 검색"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => setCurrentPage(1)}
              className="p-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* 키워드 목록관리 */}
            <button
              onClick={openKeywordModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-violet-300 text-violet-700 bg-white hover:bg-violet-50 transition-all"
            >
              <Tag className="w-4 h-4" />
              키워드 목록관리
            </button>

            {/* 기업리스트 크롤링 */}
            <button
              onClick={openDiscoverModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#3d4659] text-white hover:bg-[#4a5568] transition-all"
            >
              <Building2 className="w-4 h-4" />
              기업리스트 크롤링
            </button>
          </div>
        </div>

        {/* 기업 목록 */}
        {loading ? (
          <div className="py-24 text-center text-sm text-gray-400">데이터를 불러오는 중...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-24 text-center text-sm text-gray-400">
            {searchTerm ? '검색 결과가 없습니다' : '등록된 기업 데이터가 없습니다'}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedCompanies.map(company => {
                const isExpanded = expandedId === company.id;
                const crawlingData = crawlingMap[company.id] ?? [];
                const isCrawlingLoading = loadingCrawling[company.id];
                const fnLoading = functionLoading[company.id];
                const fnResult  = functionResult[company.id];

                return (
                  <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(company.id)}>
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg text-gray-900 font-bold">{company.name}</h3>
                            {company.grade_label && (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${getGradeColor(company.grade_label)}`}>
                                {company.grade_label}
                                {company.grade_score != null && (
                                  <span className="opacity-60 font-normal">{company.grade_score}점</span>
                                )}
                              </span>
                            )}
                            {company.size && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${getSizeColor(company.size)}`}>
                                {company.size}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-gray-500">산업군:</span><span className="ml-2 text-gray-900">{company.industry ?? '-'}</span></div>
                            <div><span className="text-gray-500">매출:</span><span className="ml-2 text-gray-900">{company.revenue ?? '-'}</span></div>
                            <div><span className="text-gray-500">국가:</span><span className="ml-2 text-gray-900">{company.country ?? '-'}</span></div>
                            {(company.keywords ?? []).length > 0 && (
                              <div className="col-span-3">
                                <span className="text-gray-500">키워드:</span>
                                <span className="inline-flex flex-wrap gap-1 ml-2">
                                  {(company.keywords ?? []).map((kw, i) => (
                                    <span key={i} className={getKeywordStyle(kw)}>{kw}</span>
                                  ))}
                                </span>
                              </div>
                            )}
                            {company.website && (
                              <div className="col-span-3">
                                <span className="text-gray-500">홈페이지:</span>
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Globe className="w-4 h-4" />{company.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          {/* 기업명 확인 필요 (DART + 공공데이터 둘 다 미등록) */}
                          {dartNotFound[company.id] && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                alert(`"${company.name}"은(는) DART(전자공시시스템)와 공공데이터포털(국민연금) 모두에 등록되지 않은 기업입니다.\n\n기업명이 정확한지 확인하거나, 산업군·매출을 직접 입력해주세요.`);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              기업명 확인 필요
                            </button>
                          )}

                          <button
                            onClick={e => { e.stopPropagation(); runCrawling(company.id); }}
                            disabled={!!fnLoading}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              fnLoading === 'crawling'
                                ? 'bg-blue-50 text-blue-400 border-blue-200 cursor-wait'
                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                            }`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${fnLoading === 'crawling' ? 'animate-spin' : ''}`} />
                            {fnLoading === 'crawling' ? '크롤링 중...' : '크롤링'}
                          </button>

                          <button
                            onClick={e => { e.stopPropagation(); runGrading(company.id); }}
                            disabled={!!fnLoading}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              fnLoading === 'grading'
                                ? 'bg-amber-50 text-amber-400 border-amber-200 cursor-wait'
                                : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${fnLoading === 'grading' ? 'animate-pulse' : ''}`} />
                            {fnLoading === 'grading' ? '판정 중...' : '등급 판정'}
                          </button>

                          <button
                            onClick={() => toggleExpand(company.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded
                              ? <ChevronUp className="w-5 h-5 text-gray-500" />
                              : <ChevronDown className="w-5 h-5 text-gray-500" />}
                          </button>

                          {/* 삭제 버튼 */}
                          <button
                            onClick={e => { e.stopPropagation(); deleteCompany(company.id, company.name); }}
                            disabled={!!fnLoading}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            title="기업 삭제"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                          </button>
                        </div>
                      </div>

                      {fnResult?.message && (
                        <div className={`mt-2 px-4 py-2 rounded-lg text-xs font-medium ${
                          fnResult.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {fnResult.message}
                        </div>
                      )}

                      {company.ai_summary && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-blue-700 font-semibold uppercase shrink-0">AI 요약</span>
                            <p className="text-sm text-gray-700 leading-relaxed">{company.ai_summary}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 p-6">
                        {/* 점수 상세 */}
                        {company.grade_label && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">등급 점수 상세</h4>
                            <div className="grid grid-cols-5 gap-3">
                              {[
                                { label: '기업 규모', score: company.score_size, max: 20 },
                                { label: '솔루션 적합도', score: company.score_solution, max: 30 },
                                { label: '관계 밀도', score: company.score_relation, max: 30 },
                                { label: '성장 시그널', score: company.score_growth, max: 10 },
                                { label: '거래 리스크', score: company.score_risk, max: 10 },
                              ].map(({ label, score, max }) => (
                                <div key={label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                                  <div className="text-lg font-bold text-gray-900">{score ?? '-'}</div>
                                  <div className="text-xs text-gray-400">/ {max}</div>
                                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-400 rounded-full"
                                      style={{ width: score != null ? `${(score / max) * 100}%` : '0%' }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <h4 className="text-sm font-semibold text-gray-700 mb-4">
                          크롤링 이력 ({isCrawlingLoading ? '로드 중...' : `${crawlingData.length}건`})
                        </h4>
                        {isCrawlingLoading ? (
                          <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
                        ) : crawlingData.length === 0 ? (
                          <div className="py-8 text-center text-sm text-gray-400">
                            수집된 크롤링 데이터가 없습니다 — 위 <strong>크롤링</strong> 버튼을 눌러보세요
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase w-[150px]">기업명</th>
                                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">크롤링 URL</th>
                                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase w-[220px]">수집 키워드</th>
                                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase w-[180px]">수집일시</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {crawlingData.map(d => (
                                  <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{company.name}</td>
                                    <td className="px-4 py-3">
                                      <a
                                        href={d.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[300px]"
                                      >
                                        {d.url}
                                      </a>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        {(d.keywords ?? []).map((kw, i) => (
                                          <span key={i} className={getKeywordStyle(kw)}>{kw}</span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {new Date(d.collected_at).toLocaleString('ko-KR')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-[#3d4659] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 키워드 목록관리 모달 ──────────────────────────────────────────── */}
      {showKeywordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">키워드 목록관리</h2>
                <p className="text-xs text-gray-500 mt-0.5">기업 발굴 크롤링에 사용할 브라이센 영업 키워드</p>
              </div>
              <button
                onClick={() => setShowKeywordModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 에러 메시지 */}
            {keywordError && (
              <div className="mx-6 mt-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {keywordError}
              </div>
            )}

            {/* 추가 입력 */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex gap-2">
                <input
                  ref={newKeywordRef}
                  type="text"
                  placeholder="새 키워드 입력 (예: SAP, ERP 구축)"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addKeyword(); }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button
                  onClick={addKeyword}
                  disabled={!newKeyword.trim() || addingKeyword}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {addingKeyword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  추가
                </button>
              </div>
            </div>

            {/* 키워드 목록 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {keywordLoading ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                  불러오는 중...
                </div>
              ) : keywords.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  등록된 키워드가 없습니다.<br />위에서 키워드를 추가해주세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {keywords.map(kw => (
                    <div
                      key={kw.id}
                      className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-200 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="text-sm text-gray-800 font-medium">{kw.keyword}</span>
                      </div>
                      <button
                        onClick={() => deleteKeyword(kw.id)}
                        disabled={deletingKeyword === kw.id}
                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      >
                        {deletingKeyword === kw.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500">총 {keywords.length}개 키워드 · 기업리스트 크롤링 시 상위 5개 키워드 사용</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 기업리스트 크롤링 결과 모달 ──────────────────────────────────── */}
      {showDiscoverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[680px] max-h-[85vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">기업리스트 크롤링</h2>
                {searchedKeywords.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-400">검색 키워드:</span>
                    {searchedKeywords.slice(0, 5).map(kw => (
                      <span key={kw} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowDiscoverModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {discoverLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-violet-500" />
                  <p className="text-sm font-medium text-gray-700">구글 뉴스 검색 중...</p>
                  <p className="text-xs text-gray-400 mt-1">키워드별 뉴스에서 잠재 고객을 분석하고 있습니다</p>
                </div>
              ) : discoverError ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-red-600 mb-2">크롤링 실패</p>
                  <p className="text-xs text-gray-500 mb-4">{discoverError}</p>
                  <button
                    onClick={runCompanyDiscover}
                    className="px-4 py-2 bg-[#3d4659] text-white rounded-lg text-sm hover:bg-[#4a5568] transition-all"
                  >
                    다시 시도
                  </button>
                </div>
              ) : discoveredCompanies.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  <p className="mb-2">뉴스 {newsCount}건을 수집했으나 기업명을 추출하지 못했습니다.</p>
                  <p className="text-xs text-gray-400 mb-4">키워드를 더 구체적으로 입력하거나 다시 시도해보세요.</p>
                  {sampleTitles.length > 0 && (
                    <div className="text-left bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                      <p className="font-medium text-gray-600 mb-1">수집된 뉴스 샘플:</p>
                      {sampleTitles.map((t, i) => <p key={i}>· {t}</p>)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">
                    기존 기업 리스트를 제외한 신규 잠재 고객 <strong className="text-gray-800">{discoveredCompanies.length}개</strong>를 발견했습니다.
                  </p>
                  {discoveredCompanies.map((company, idx) => {
                    const isAdded = addedCompanies.has(company.name);
                    const isAdding = addingCompany[company.name];

                    return (
                      <div
                        key={idx}
                        className={`flex items-start justify-between p-4 rounded-lg border transition-all ${
                          isAdded
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-violet-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">{company.name}</span>
                            {company.industry && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{company.industry}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{company.reason}</p>
                        </div>

                        <button
                          onClick={() => !isAdded && addDiscoveredCompany(company)}
                          disabled={isAdded || !!isAdding}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isAdded
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : 'bg-[#3d4659] text-white hover:bg-[#4a5568] disabled:opacity-50'
                          }`}
                        >
                          {isAdding
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : isAdded
                              ? <><CheckCircle className="w-3.5 h-3.5" />추가됨</>
                              : <><Plus className="w-3.5 h-3.5" />추가</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 푸터 */}
            {!discoverLoading && !discoverError && discoveredCompanies.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {addedCompanies.size > 0 ? `${addedCompanies.size}개 추가됨` : '추가 버튼으로 기업 리스트에 등록하세요'}
                </span>
                <button
                  onClick={runCompanyDiscover}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 검색
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
