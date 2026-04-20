import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Globe } from 'lucide-react';

type CompanySize = '대기업' | '중소기업' | '중견기업';
type CompanyGrade = 'S등급' | 'A등급' | 'B등급' | 'C등급';

type CrawlingData = {
  id: string;
  url: string;
  collectedAt: string;
  keywords: string[];
};

type CompanyData = {
  id: string;
  name: string;
  industry: string;
  keywords: string[];
  size: CompanySize;
  revenue: string;
  country: string;
  website: string;
  aiSummary: string;
  grade: CompanyGrade;
  crawlingData: CrawlingData[];
};

const initialCompanies: CompanyData[] = [
  {
    id: '1',
    name: '삼성전자',
    industry: '전자제품 제조',
    keywords: ['반도체', '스마트폰', 'AI', '디스플레이', '디지털 전환 공표'],
    size: '대기업',
    revenue: '3,020억 달러',
    country: '대한민국',
    website: 'https://www.samsung.com',
    aiSummary: '글로벌 전자제품 및 반도체 분야 선도 기업으로, 스마트폰과 메모리 반도체 시장에서 압도적인 점유율을 보유. AI 및 5G 기술 개발에 주력하며 지속 가능한 경영 실천.',
    grade: 'S등급',
    crawlingData: [
      { id: 'c1-1', url: 'https://www.samsung.com/sec/about-us/', collectedAt: '2026-04-02 14:30:22', keywords: ['반도체', '디지털 전환 공표', 'AI'] },
      { id: 'c1-2', url: 'https://www.samsung.com/sec/ir/', collectedAt: '2026-03-28 09:15:44', keywords: ['실적', '주주가치'] },
      { id: 'c1-3', url: 'https://www.samsung.com/sec/newsroom/', collectedAt: '2026-03-20 16:42:11', keywords: ['채용', '뉴스', '제품출시'] },
    ],
  },
  {
    id: '2',
    name: 'LG전자',
    industry: '전자제품 제조',
    keywords: ['가전', '전장사업', 'B2B솔루션', '스마트홈', '채용'],
    size: '대기업',
    revenue: '630억 달러',
    country: '대한민국',
    website: 'https://www.lge.com',
    aiSummary: '프리미엄 가전과 전장사업에 집중하는 글로벌 기업. 스마트홈 및 B2B 솔루션 사업 확대 중이며, 전기차 부품 사업에서 강점을 보임.',
    grade: 'S등급',
    crawlingData: [
      { id: 'c2-1', url: 'https://www.lge.com/kr/about', collectedAt: '2026-04-01 11:20:33', keywords: ['기업소개', '채용', '전장사업'] },
      { id: 'c2-2', url: 'https://www.lge.com/kr/ir', collectedAt: '2026-03-25 14:55:28', keywords: ['투자정보', 'ESG'] },
    ],
  },
  {
    id: '3',
    name: 'SK하이닉스',
    industry: '반도체 제조',
    keywords: ['D램', 'SSD', 'AI반도체', '차세대메모리'],
    size: '대기업',
    revenue: '360억 달러',
    country: '대한민국',
    website: 'https://www.skhynix.com',
    aiSummary: '세계 2위 메모리 반도체 제조사. D램과 낸드플래시 시장에서 강력한 경쟁력 보유. AI 및 데이터센터용 고성능 메모리 개발에 주력.',
    grade: 'A등급',
    crawlingData: [
      { id: 'c3-1', url: 'https://www.skhynix.com/kor/about/intro.jsp', collectedAt: '2026-03-30 10:05:17', keywords: ['D램', 'AI반도체'] },
      { id: 'c3-2', url: 'https://www.skhynix.com/kor/ir/', collectedAt: '2026-03-22 13:40:55', keywords: ['실적', '주가'] },
      { id: 'c3-3', url: 'https://www.skhynix.com/kor/pr/', collectedAt: '2026-03-15 08:22:33', keywords: ['디지털 전환 공표', '공시'] },
      { id: 'c3-4', url: 'https://www.skhynix.com/kor/tech/', collectedAt: '2026-03-10 15:18:44', keywords: ['기술개발', 'R&D'] },
    ],
  },
  {
    id: '4',
    name: '현대자동차',
    industry: '자동차 제조',
    keywords: ['전기차', '수소차', '자율주행', '모빌리티'],
    size: '대기업',
    revenue: '1,090억 달러',
    country: '대한민국',
    website: 'https://www.hyundai.com',
    aiSummary: '글로벌 완성차 제조사. 전기차 및 수소차 개발 가속화하며 미래 모빌리티 사업 확장. 자율주행 기술과 스마트 모빌리티 솔루션 개발에 투자.',
    grade: 'A등급',
    crawlingData: [
      { id: 'c4-1', url: 'https://www.hyundai.com/kr/ko/company', collectedAt: '2026-03-29 09:35:21', keywords: ['전기차', '수소차', '채용'] },
      { id: 'c4-2', url: 'https://www.hyundai.com/kr/ko/ir', collectedAt: '2026-03-24 16:12:08', keywords: ['투자정보', '실적'] },
    ],
  },
  {
    id: '5',
    name: '네이버',
    industry: 'IT 서비스',
    keywords: ['검색', 'AI', '클라우드', '커머스'],
    size: '대기업',
    revenue: '85억 달러',
    country: '대한민국',
    website: 'https://www.navercorp.com',
    aiSummary: '한국 최대 인터넷 기업. 검색, 커머스, 클라우드, AI 기술 전반에 걸쳐 사업 확장. 글로벌 시장 진출 가속화 및 하이퍼클로바 AI 개발.',
    grade: 'A등급',
    crawlingData: [
      { id: 'c5-1', url: 'https://www.navercorp.com/company', collectedAt: '2026-04-01 14:22:45', keywords: ['AI', '디지털 전환 공표', '클라우드'] },
      { id: 'c5-2', url: 'https://www.navercorp.com/ir', collectedAt: '2026-03-27 11:08:33', keywords: ['재무', 'IR'] },
      { id: 'c5-3', url: 'https://www.navercorp.com/tech', collectedAt: '2026-03-18 10:45:12', keywords: ['기술', '하이퍼클로바'] },
    ],
  },
  {
    id: '6',
    name: '카카오',
    industry: 'IT 서비스',
    keywords: ['메신저', '모빌리티', '금융', '엔터테인먼트'],
    size: '대기업',
    revenue: '70억 달러',
    country: '대한민국',
    website: 'https://www.kakaocorp.com',
    aiSummary: '메신저 기반 플랫폼 기업. 모빌리티, 금융, 콘텐츠 사업 다각화. AI 기술 기반 서비스 확대 및 글로벌 시장 진출 추진.',
    grade: 'B등급',
    crawlingData: [
      { id: 'c6-1', url: 'https://www.kakaocorp.com/page/company', collectedAt: '2026-03-31 13:15:29', keywords: ['메신저', '모빌리티', '채용'] },
      { id: 'c6-2', url: 'https://www.kakaocorp.com/page/ir', collectedAt: '2026-03-26 09:52:44', keywords: ['실적', '공시'] },
    ],
  },
  {
    id: '7',
    name: '포스코',
    industry: '철강 제조',
    keywords: ['철강', '이차전지소재', '수소', '그린에너지'],
    size: '대기업',
    revenue: '630억 달러',
    country: '대한민국',
    website: 'https://www.posco.com',
    aiSummary: '글로벌 철강 제조 선도 기업. 이차전지 소재 및 수소 사업으로 사업 포트폴리오 확대. 탄소중립 및 친환경 철강 생산 기술 개발.',
    grade: 'A등급',
    crawlingData: [
      { id: 'c7-1', url: 'https://www.posco.com/company/', collectedAt: '2026-03-28 15:33:18', keywords: ['철강', '이차전지', '디지털 전환 공표'] },
      { id: 'c7-2', url: 'https://www.posco.com/ir/', collectedAt: '2026-03-19 12:28:55', keywords: ['재무정보', 'ESG'] },
    ],
  },
  {
    id: '8',
    name: '셀트리온',
    industry: '바이오제약',
    keywords: ['바이오시밀러', '항체치료제', 'CMO', '신약개발'],
    size: '중견기업',
    revenue: '25억 달러',
    country: '대한민국',
    website: 'https://www.celltrion.com',
    aiSummary: '바이오시밀러 글로벌 선도 기업. 항체 치료제 개발 및 생산에 특화. 유럽·미국 시장 진출 확대 중이며 차세대 신약 파이프라인 구축.',
    grade: 'B등급',
    crawlingData: [
      { id: 'c8-1', url: 'https://www.celltrion.com/ko-kr/company/', collectedAt: '2026-03-30 10:44:22', keywords: ['바이오시밀러', '신약', '채용'] },
      { id: 'c8-2', url: 'https://www.celltrion.com/ko-kr/ir/', collectedAt: '2026-03-23 14:19:37', keywords: ['IR', '투자'] },
      { id: 'c8-3', url: 'https://www.celltrion.com/ko-kr/rd/', collectedAt: '2026-03-16 09:05:51', keywords: ['R&D', '연구개발'] },
    ],
  },
  {
    id: '9',
    name: '쿠팡',
    industry: '이커머스',
    keywords: ['이커머스', '로켓배송', '물류', '푸드테크'],
    size: '대기업',
    revenue: '220억 달러',
    country: '대한민국',
    website: 'https://www.aboutcoupang.com',
    aiSummary: '한국 최대 이커머스 플랫폼. 로켓배송과 물류 인프라로 차별화. 쿠팡이츠 등 푸드테크 및 광고 사업으로 수익 다각화 추진.',
    grade: 'B등급',
    crawlingData: [
      { id: 'c9-1', url: 'https://www.aboutcoupang.com/about/', collectedAt: '2026-04-01 16:55:12', keywords: ['이커머스', '물류', '로켓배송'] },
      { id: 'c9-2', url: 'https://www.aboutcoupang.com/ir/', collectedAt: '2026-03-21 11:33:28', keywords: ['실적', '채용'] },
    ],
  },
  {
    id: '10',
    name: '크래프톤',
    industry: '게임',
    keywords: ['배틀그라운드', '모바일게임', '메타버스', 'e스포츠'],
    size: '중견기업',
    revenue: '18억 달러',
    country: '대한민국',
    website: 'https://www.krafton.com',
    aiSummary: 'PUBG 개발사로 글로벌 게임 시장 입지 확보. 메타버스 및 신작 게임 개발에 투자 확대. e스포츠 및 IP 확장 사업 추진.',
    grade: 'C등급',
    crawlingData: [
      { id: 'c10-1', url: 'https://www.krafton.com/company/', collectedAt: '2026-03-29 13:27:44', keywords: ['게임', 'PUBG', '채용'] },
      { id: 'c10-2', url: 'https://www.krafton.com/ir/', collectedAt: '2026-03-17 10:11:29', keywords: ['재무', 'IR'] },
    ],
  },
];

const ITEMS_PER_PAGE = 8;

export function CompanyDataCollection() {
  const [companies] = useState<CompanyData[]>(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedId(null);
  };

  const getGradeColor = (grade: CompanyGrade) => {
    switch (grade) {
      case 'S등급': return 'bg-purple-100 text-purple-700 border-purple-500';
      case 'A등급': return 'bg-red-100 text-red-700 border-red-500';
      case 'B등급': return 'bg-blue-100 text-blue-700 border-blue-500';
      case 'C등급': return 'bg-green-100 text-green-700 border-green-500';
    }
  };

  const getSizeColor = (size: CompanySize) => {
    switch (size) {
      case '대기업': return 'bg-indigo-100 text-indigo-700';
      case '중견기업': return 'bg-teal-100 text-teal-700';
      case '중소기업': return 'bg-amber-100 text-amber-700';
    }
  };

  const getKeywordStyle = (keyword: string) => {
    if (keyword === '디지털 전환 공표') {
      return 'px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-300 rounded text-xs font-semibold';
    } else if (keyword === '채용') {
      return 'px-2 py-0.5 bg-pink-100 text-pink-700 border border-pink-300 rounded text-xs font-semibold';
    }
    return 'px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">기업 정보 수집</h1>
        <p className="text-sm text-gray-500 mt-1">크롤링을 통해 수집된 기업 정보를 관리합니다</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="기업명, 산업군, 키워드로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="p-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Companies List */}
        <div className="space-y-4">
          {paginatedCompanies.map((company) => {
            const isExpanded = expandedId === company.id;
            return (
              <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Company Info */}
                <div className="p-6">
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpand(company.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg text-gray-900 font-bold">{company.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${getGradeColor(company.grade)}`}>
                            {company.grade}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${getSizeColor(company.size)}`}>
                            {company.size}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">산업군:</span>
                            <span className="ml-2 text-gray-900">{company.industry}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">매출:</span>
                            <span className="ml-2 text-gray-900">{company.revenue}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">국가:</span>
                            <span className="ml-2 text-gray-900">{company.country}</span>
                          </div>
                          <div className="col-span-3">
                            <span className="text-gray-500">키워드:</span>
                            <div className="inline-flex flex-wrap gap-1 ml-2">
                              {company.keywords.map((keyword, idx) => (
                                <span key={idx} className={getKeywordStyle(keyword)}>
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <span className="text-gray-500">홈페이지:</span>
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-4 h-4" />
                              {company.website}
                            </a>
                          </div>
                        </div>
                      </div>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </button>
                    </div>

                    {/* AI Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-blue-700 font-semibold uppercase shrink-0">AI 요약</span>
                        <p className="text-sm text-gray-700 leading-relaxed">{company.aiSummary}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crawling Data Table */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="text-gray-900 mb-4">크롤링 데이터 ({company.crawlingData.length}건)</h4>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase w-[150px]">회사명</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">크롤링 수집 URL</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase w-[200px]">수집 키워드</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase w-[180px]">수집일시</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {company.crawlingData.map((data) => (
                            <tr key={data.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-900">{company.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <a
                                  href={data.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {data.url}
                                </a>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {data.keywords.map((keyword, idx) => (
                                    <span key={idx} className={getKeywordStyle(keyword)}>
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">{data.collectedAt}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
