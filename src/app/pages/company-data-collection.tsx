import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Globe, RefreshCw, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CompanyData, CompanyDataCrawling } from '@/lib/database.types';

const ITEMS_PER_PAGE = 8;

const getGradeColor = (grade: CompanyData['grade']): string => {
  if (grade === null || grade === undefined) return 'bg-gray-100 text-gray-500 border-gray-300';
  if (grade >= 5) return 'bg-amber-100 text-amber-700 border-amber-500';
  if (grade >= 4) return 'bg-purple-100 text-purple-700 border-purple-500';
  if (grade >= 3) return 'bg-blue-100 text-blue-700 border-blue-500';
  if (grade >= 2) return 'bg-green-100 text-green-700 border-green-500';
  return 'bg-gray-100 text-gray-500 border-gray-400';
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
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawlingMap, setCrawlingMap] = useState<Record<string, CompanyDataCrawling[]>>({});
  const [loadingCrawling, setLoadingCrawling] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 함수 호출 상태 (companyId → 'crawling' | 'grading' | null)
  const [functionLoading, setFunctionLoading] = useState<Record<string, string>>({});
  const [functionResult, setFunctionResult] = useState<Record<string, { type: string; message: string }>>({});

  useEffect(() => { fetchCompanies(); }, []);

  async function fetchCompanies() {
    setLoading(true);
    const { data } = await supabase.from('company_data').select('*').order('name');
    setCompanies(data ?? []);
    setLoading(false);
  }

  async function fetchCrawling(companyId: string) {
    if (crawlingMap[companyId] !== undefined) return;
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

  /** 크롤링 실행 */
  async function runCrawling(companyId: string) {
    setFunctionLoading(prev => ({ ...prev, [companyId]: 'crawling' }));
    setFunctionResult(prev => ({ ...prev, [companyId]: { type: '', message: '' } }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-crawling', {
        body: { company_id: companyId },
      });
      if (error) throw error;
      // 화면 반영: 키워드·요약 업데이트
      setCompanies(prev => prev.map(c =>
        c.id === companyId
          ? { ...c, keywords: data.keywords, ai_summary: data.summary }
          : c
      ));
      // 크롤링 이력 캐시 초기화 → 다시 로드
      setCrawlingMap(prev => {
        const next = { ...prev };
        delete next[companyId];
        return next;
      });
      if (expandedId === companyId) fetchCrawling(companyId);
      setFunctionResult(prev => ({ ...prev, [companyId]: { type: 'success', message: '크롤링 완료! 키워드가 업데이트됐습니다.' } }));
    } catch (e) {
      setFunctionResult(prev => ({ ...prev, [companyId]: { type: 'error', message: `크롤링 실패: ${String(e)}` } }));
    } finally {
      setFunctionLoading(prev => ({ ...prev, [companyId]: '' }));
    }
  }

  /** 등급 판정 실행 */
  async function runGrading(companyId: string) {
    setFunctionLoading(prev => ({ ...prev, [companyId]: 'grading' }));
    setFunctionResult(prev => ({ ...prev, [companyId]: { type: '', message: '' } }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-grading', {
        body: { company_id: companyId },
      });
      if (error) throw error;
      setCompanies(prev => prev.map(c =>
        c.id === companyId
          ? { ...c, grade: data.grade, ai_summary: data.reason }
          : c
      ));
      setFunctionResult(prev => ({
        ...prev,
        [companyId]: { type: 'success', message: `등급 판정 완료: ${data.grade}등급 (점수 ${data.score})` },
      }));
    } catch (e) {
      setFunctionResult(prev => ({ ...prev, [companyId]: { type: 'error', message: `등급 판정 실패: ${String(e)}` } }));
    } finally {
      setFunctionLoading(prev => ({ ...prev, [companyId]: '' }));
    }
  }

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

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">기업 정보 수집</h1>
        <p className="text-sm text-gray-500 mt-1">크롤링을 통해 수집된 기업 정보를 관리합니다</p>
      </div>

      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="기업명, 산업군, 키워드로 검색" value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button onClick={() => setCurrentPage(1)} className="p-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm text-gray-400">데이터를 불러오는 중...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-24 text-center text-sm text-gray-400">{searchTerm ? '검색 결과가 없습니다' : '등록된 기업 데이터가 없습니다'}</div>
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
                      {/* 헤더: 기업명 + 배지 + 액션 버튼 */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(company.id)}>
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg text-gray-900 font-bold">{company.name}</h3>
                            {company.grade && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${getGradeColor(company.grade)}`}>
                                {company.grade}등급
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
                                <a href={company.website} target="_blank" rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                  onClick={e => e.stopPropagation()}>
                                  <Globe className="w-4 h-4" />{company.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 우측: 버튼들 + 펼치기 */}
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          {/* 크롤링 버튼 */}
                          <button
                            onClick={e => { e.stopPropagation(); runCrawling(company.id); }}
                            disabled={!!fnLoading}
                            title="웹사이트 크롤링"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              fnLoading === 'crawling'
                                ? 'bg-blue-50 text-blue-400 border-blue-200 cursor-wait'
                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                            }`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${fnLoading === 'crawling' ? 'animate-spin' : ''}`} />
                            {fnLoading === 'crawling' ? '크롤링 중...' : '크롤링'}
                          </button>

                          {/* 등급 판정 버튼 */}
                          <button
                            onClick={e => { e.stopPropagation(); runGrading(company.id); }}
                            disabled={!!fnLoading}
                            title="AI 등급 판정"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              fnLoading === 'grading'
                                ? 'bg-amber-50 text-amber-400 border-amber-200 cursor-wait'
                                : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${fnLoading === 'grading' ? 'animate-pulse' : ''}`} />
                            {fnLoading === 'grading' ? '판정 중...' : '등급 판정'}
                          </button>

                          {/* 펼치기 */}
                          <button
                            onClick={() => toggleExpand(company.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                          </button>
                        </div>
                      </div>

                      {/* 함수 실행 결과 토스트 */}
                      {fnResult?.message && (
                        <div className={`mt-2 px-4 py-2 rounded-lg text-xs font-medium ${
                          fnResult.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {fnResult.message}
                        </div>
                      )}

                      {/* AI 요약 */}
                      {company.ai_summary && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-blue-700 font-semibold uppercase shrink-0">AI 요약</span>
                            <p className="text-sm text-gray-700 leading-relaxed">{company.ai_summary}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 크롤링 이력 패널 */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 p-6">
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
                                {crawlingData.map(data => (
                                  <tr key={data.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{company.name}</td>
                                    <td className="px-4 py-3">
                                      <a href={data.url} target="_blank" rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[300px]">
                                        {data.url}
                                      </a>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1">
                                        {(data.keywords ?? []).map((kw, i) => (
                                          <span key={i} className={getKeywordStyle(kw)}>{kw}</span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {new Date(data.collected_at).toLocaleString('ko-KR')}
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
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      currentPage === page ? 'bg-[#3d4659] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
