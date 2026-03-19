import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Plus, Phone, Mail, ChevronLeft, ChevronRight, Edit2, Trash2, X, Users } from 'lucide-react';

type Manager = {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  department: string;
};

type CompanyRank = 'A' | 'B' | 'C' | 'D';

type Company = {
  id: string;
  name: string;
  rank: CompanyRank;
  businessNumber: string;
  ceo: string;
  industry: string;
  address: string;
  totalProjects: number;
  totalAmount: string;
  status: string;
  statusColor: 'blue' | 'green' | 'yellow';
  managers: Manager[];
};

const initialCompanies: Company[] = [
  {
    id: '1',
    name: '삼성전자',
    rank: 'A',
    businessNumber: '124-81-00998',
    ceo: '한종희',
    industry: '전자제품 제조',
    address: '경기도 수원시 영통구 삼성로 129',
    totalProjects: 12,
    totalAmount: '850,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm1', name: '김영호', position: '구매팀장', phone: '010-1234-5678', email: 'kim.yh@samsung.com', department: '구매팀' },
      { id: 'm2', name: '이미선', position: '과장', phone: '010-2345-6789', email: 'lee.ms@samsung.com', department: '구매팀' },
    ],
  },
  {
    id: '2',
    name: 'LG전자',
    rank: 'A',
    businessNumber: '107-86-14859',
    ceo: '조주완',
    industry: '전자제품 제조',
    address: '서울특별시 영등포구 여의대로 128',
    totalProjects: 8,
    totalAmount: '620,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm3', name: '박성민', position: '팀장', phone: '010-3456-7890', email: 'park.sm@lge.com', department: '조달팀' },
    ],
  },
  {
    id: '3',
    name: '현대자동차',
    rank: 'B',
    businessNumber: '101-81-24910',
    ceo: '장재훈',
    industry: '자동차 제조',
    address: '서울특별시 서초구 헌릉로 12',
    totalProjects: 5,
    totalAmount: '430,000,000',
    status: '협의중',
    statusColor: 'yellow',
    managers: [
      { id: 'm4', name: '최동욱', position: '차장', phone: '010-4567-8901', email: 'choi.du@hyundai.com', department: '구매부' },
      { id: 'm5', name: '강은지', position: '대리', phone: '010-5678-9012', email: 'kang.ej@hyundai.com', department: '구매부' },
    ],
  },
  {
    id: '4',
    name: 'SK하이닉스',
    rank: 'A',
    businessNumber: '120-81-00679',
    ceo: '곽노정',
    industry: '반도체 제조',
    address: '경기도 이천시 부발읍 경충대로 2091',
    totalProjects: 15,
    totalAmount: '1,200,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm6', name: '윤재현', position: '부장', phone: '010-6789-0123', email: 'yoon.jh@skhynix.com', department: '구매실' },
    ],
  },
  {
    id: '5',
    name: '네이버',
    rank: 'B',
    businessNumber: '220-81-62517',
    ceo: '최수연',
    industry: 'IT 서비스',
    address: '경기도 성남시 분당구 정자일로 95',
    totalProjects: 7,
    totalAmount: '380,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm7', name: '정수진', position: '팀장', phone: '010-7890-1234', email: 'jung.sj@naver.com', department: 'IT구매팀' },
    ],
  },
  {
    id: '6',
    name: '카카오',
    rank: 'B',
    businessNumber: '120-88-02649',
    ceo: '정신아',
    industry: 'IT 서비스',
    address: '경기도 성남시 분당구 판교역로 235',
    totalProjects: 6,
    totalAmount: '340,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm8', name: '김민수', position: '부장', phone: '010-8901-2345', email: 'kim.ms@kakao.com', department: '구매팀' },
    ],
  },
  {
    id: '7',
    name: '포스코',
    rank: 'A',
    businessNumber: '104-81-21738',
    ceo: '정기섭',
    industry: '철강 제조',
    address: '경상북도 포항시 남구 동해안로 6261',
    totalProjects: 10,
    totalAmount: '720,000,000',
    status: '거래',
    statusColor: 'green',
    managers: [
      { id: 'm9', name: '이철민', position: '차장', phone: '010-9012-3456', email: 'lee.cm@posco.com', department: '자재팀' },
    ],
  },
  {
    id: '8',
    name: '두산중공업',
    rank: 'C',
    businessNumber: '134-81-03215',
    ceo: '박지원',
    industry: '중공업',
    address: '경남 창원시 성산구 두산볼보로 22',
    totalProjects: 4,
    totalAmount: '280,000,000',
    status: '협의중',
    statusColor: 'yellow',
    managers: [
      { id: 'm10', name: '박진우', position: '과장', phone: '010-0123-4567', email: 'park.jw@doosan.com', department: '구매팀' },
    ],
  },
  {
    id: '9',
    name: 'CJ제일제당',
    rank: 'B',
    businessNumber: '104-86-09535',
    ceo: '강신호',
    industry: '식품 제조',
    address: '서울특별시 중구 동호로 330',
    totalProjects: 5,
    totalAmount: '310,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm11', name: '최민정', position: '팀장', phone: '010-1234-6789', email: 'choi.mj@cj.com', department: '구매팀' },
    ],
  },
  {
    id: '10',
    name: '롯데케미칼',
    rank: 'B',
    businessNumber: '117-81-00138',
    ceo: '김교현',
    industry: '화학 제조',
    address: '서울특별시 송파구 올림픽로 300',
    totalProjects: 6,
    totalAmount: '420,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm12', name: '한지영', position: '차장', phone: '010-2345-7890', email: 'han.jy@lotte.com', department: '자재팀' },
    ],
  },
  {
    id: '11',
    name: 'GS건설',
    rank: 'C',
    businessNumber: '120-81-01392',
    ceo: '허명수',
    industry: '건설업',
    address: '서울특별시 종로구 종로 33',
    totalProjects: 3,
    totalAmount: '210,000,000',
    status: '협의중',
    statusColor: 'yellow',
    managers: [
      { id: 'm13', name: '서준호', position: '대리', phone: '010-3456-8901', email: 'seo.jh@gsconst.com', department: '구매팀' },
    ],
  },
  {
    id: '12',
    name: '한화에어로스페이스',
    rank: 'B',
    businessNumber: '114-81-06311',
    ceo: '신현우',
    industry: '항공우주',
    address: '경남 창원시 성산구 완암로 462',
    totalProjects: 7,
    totalAmount: '560,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm14', name: '노승민', position: '팀장', phone: '010-4567-9012', email: 'no.sm@hanwha.com', department: '자재구매팀' },
    ],
  },
  {
    id: '13',
    name: '대우조선해양',
    rank: 'C',
    businessNumber: '135-81-00210',
    ceo: '정성립',
    industry: '조선업',
    address: '경상남도 거제시 거제대로 3370',
    totalProjects: 4,
    totalAmount: '320,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm15', name: '김태현', position: '과장', phone: '010-5678-0123', email: 'kim.th@dsme.com', department: '구매팀' },
    ],
  },
  {
    id: '14',
    name: '코웨이',
    rank: 'D',
    businessNumber: '117-81-43611',
    ceo: '서장원',
    industry: '환경가전',
    address: '서울특별시 중구 서소문로 100',
    totalProjects: 2,
    totalAmount: '150,000,000',
    status: '협의중',
    statusColor: 'yellow',
    managers: [
      { id: 'm16', name: '임하늘', position: '대리', phone: '010-6789-1234', email: 'lim.hn@coway.com', department: '구매팀' },
    ],
  },
  {
    id: '15',
    name: '아모레퍼시픽',
    rank: 'C',
    businessNumber: '106-86-43373',
    ceo: '서경배',
    industry: '화장품 제조',
    address: '서울특별시 용산구 한강대로 100',
    totalProjects: 3,
    totalAmount: '190,000,000',
    status: '거래중',
    statusColor: 'green',
    managers: [
      { id: 'm17', name: '오지현', position: '과장', phone: '010-7890-2345', email: 'oh.jh@apgroup.com', department: '구매팀' },
    ],
  },
];

const ITEMS_PER_PAGE = 10;

export function CompanyKorea() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'sales'>('company');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.businessNumber.includes(searchTerm) ||
      company.ceo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedId(null);
  };

  const getStatusColor = (color: 'blue' | 'green' | 'yellow') => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-700';
      case 'green': return 'bg-green-100 text-green-700';
      case 'yellow': return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getRankBorderColor = (rank: CompanyRank) => {
    switch (rank) {
      case 'A': return 'border-red-500 text-red-700';
      case 'B': return 'border-blue-500 text-blue-700';
      case 'C': return 'border-green-500 text-green-700';
      case 'D': return 'border-gray-500 text-gray-700';
    }
  };

  const handleDeleteCompany = (id: string, name: string) => {
    if (window.confirm(`정말로 "${name}" 기업을 삭제하시겠습니까?`)) {
      setCompanies(companies.filter(c => c.id !== id));
      setExpandedId(null);
    }
  };

  const handleDeleteManager = (companyId: string, managerId: string, managerName: string) => {
    if (window.confirm(`정말로 "${managerName}" 담당자를 삭제하시겠습니까?`)) {
      setCompanies(companies.map(c => 
        c.id === companyId 
          ? { ...c, managers: c.managers.filter(m => m.id !== managerId) }
          : c
      ));
    }
  };

  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCompany: Company = {
      id: editingCompany?.id || Date.now().toString(),
      name: formData.get('name') as string,
      rank: formData.get('rank') as CompanyRank,
      businessNumber: formData.get('businessNumber') as string,
      ceo: formData.get('ceo') as string,
      industry: formData.get('industry') as string,
      address: formData.get('address') as string,
      totalProjects: editingCompany?.totalProjects || 0,
      totalAmount: editingCompany?.totalAmount || '0',
      status: formData.get('status') as string,
      statusColor: formData.get('statusColor') as 'blue' | 'green' | 'yellow',
      managers: editingCompany?.managers || [],
    };

    if (editingCompany) {
      setCompanies(companies.map(c => c.id === editingCompany.id ? newCompany : c));
    } else {
      setCompanies([newCompany, ...companies]);
    }
    
    setShowCompanyModal(false);
    setEditingCompany(null);
  };

  const handleSaveManager = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newManager: Manager = {
      id: editingManager?.id || Date.now().toString(),
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      department: formData.get('department') as string,
    };

    if (currentCompanyId) {
      setCompanies(companies.map(c => {
        if (c.id === currentCompanyId) {
          if (editingManager) {
            return { ...c, managers: c.managers.map(m => m.id === editingManager.id ? newManager : m) };
          } else {
            return { ...c, managers: [...c.managers, newManager] };
          }
        }
        return c;
      }));
    }
    
    setShowManagerModal(false);
    setEditingManager(null);
    setCurrentCompanyId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">기업 관리 - BRYCENKOREA</h1>
        <p className="text-sm text-gray-500 mt-1">한국 거래처 기업 정보 및 담당자를 관리합니다</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">{/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="기업명, 사업자번호, 대표자명으로 검색"
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
            <button 
              onClick={() => {
                setEditingCompany(null);
                setShowCompanyModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              기업 등록
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
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleExpand(company.id)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg text-gray-900 font-bold">{company.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${getRankBorderColor(company.rank)}`}>
                          {company.rank}등급
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">사업자번호:</span>
                          <span className="ml-2 text-gray-900">{company.businessNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">대표자:</span>
                          <span className="ml-2 text-gray-900">{company.ceo}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">업종:</span>
                          <span className="ml-2 text-gray-900">{company.industry}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">주소:</span>
                          <span className="ml-2 text-gray-900">{company.address}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">진행중인 프로젝트:</span>
                          <span className="ml-2 text-gray-900">{company.totalProjects}건</span>
                        </div>
                        <div>
                          <span className="text-gray-500">총 거래액:</span>
                          <span className="ml-2 text-gray-900">{company.totalAmount}원</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => {
                          setEditingCompany(company);
                          setShowCompanyModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                      <button 
                        onClick={() => toggleExpand(company.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Managers Table */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-gray-900">담당자 연락처</h4>
                      <button 
                        onClick={() => {
                          setCurrentCompanyId(company.id);
                          setEditingManager(null);
                          setShowManagerModal(true);
                        }}
                        className="text-sm text-[#3d4659] hover:text-[#4a5568]"
                      >
                        + 담당자 추가
                      </button>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">이름</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">부서</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">직책</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">연락처</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">이메일</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">작업</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {company.managers.map((manager) => (
                            <tr key={manager.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-900">{manager.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">{manager.department}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">{manager.position}</span>
                              </td>
                              <td className="px-4 py-3">
                                <a href={`tel:${manager.phone}`} className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]">
                                  <Phone className="w-4 h-4" />
                                  {manager.phone}
                                </a>
                              </td>
                              <td className="px-4 py-3">
                                <a href={`mailto:${manager.email}`} className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]">
                                  <Mail className="w-4 h-4" />
                                  {manager.email}
                                </a>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setCurrentCompanyId(company.id);
                                      setEditingManager(manager);
                                      setShowManagerModal(true);
                                    }}
                                    className="p-1 hover:bg-blue-50 rounded transition-colors"
                                    title="수정"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteManager(company.id, manager.id, manager.name)}
                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  </button>
                                </div>
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

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{editingCompany ? '기업 정보 수정' : '기업 등록'}</h2>
              <button onClick={() => { setShowCompanyModal(false); setEditingCompany(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveCompany} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">기업명</label>
                  <input name="name" type="text" defaultValue={editingCompany?.name} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">등급</label>
                  <select name="rank" defaultValue={editingCompany?.rank || 'B'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="A">A등급</option>
                    <option value="B">B등급</option>
                    <option value="C">C등급</option>
                    <option value="D">D등급</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">사업자번호</label>
                  <input name="businessNumber" type="text" defaultValue={editingCompany?.businessNumber} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">대표자</label>
                  <input name="ceo" type="text" defaultValue={editingCompany?.ceo} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">업종</label>
                  <input name="industry" type="text" defaultValue={editingCompany?.industry} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">상태</label>
                  <select name="status" defaultValue={editingCompany?.status || '거래중'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="거래중">거래중</option>
                    <option value="협의중">협의중</option>
                    <option value="보류">보류</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">주소</label>
                  <input name="address" type="text" defaultValue={editingCompany?.address} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {editingCompany && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">진행중인 프로젝트</label>
                      <input type="text" value={`${editingCompany.totalProjects}건`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">총 거래액</label>
                      <input type="text" value={`${editingCompany.totalAmount}원`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
                    </div>
                  </>
                )}
                <input name="statusColor" type="hidden" defaultValue={editingCompany?.statusColor || 'green'} />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => { setShowCompanyModal(false); setEditingCompany(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568]">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{editingManager ? '담당자 수정' : '담당자 추가'}</h2>
              <button onClick={() => { setShowManagerModal(false); setEditingManager(null); setCurrentCompanyId(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveManager} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">이름</label>
                <input name="name" type="text" defaultValue={editingManager?.name} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">부서</label>
                <input name="department" type="text" defaultValue={editingManager?.department} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">직책</label>
                <input name="position" type="text" defaultValue={editingManager?.position} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">연락처</label>
                <input name="phone" type="tel" defaultValue={editingManager?.phone} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">이메일</label>
                <input name="email" type="email" defaultValue={editingManager?.email} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => { setShowManagerModal(false); setEditingManager(null); setCurrentCompanyId(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568]">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}