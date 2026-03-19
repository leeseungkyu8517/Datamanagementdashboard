import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Plus, Phone, Mail, ChevronLeft, ChevronRight, Edit2, Trash2, X } from 'lucide-react';

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
    name: 'トヨタ自動車',
    rank: 'A',
    businessNumber: '3180-01-029734',
    ceo: '佐藤恒治',
    industry: '自動車製造',
    address: '愛知県豊田市トヨタ町1番地',
    totalProjects: 18,
    totalAmount: '2,500,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm1', name: '田中一郎', position: '部長', phone: '+81-90-1234-5678', email: 'tanaka@toyota.co.jp', department: '調達部' },
      { id: 'm2', name: '鈴木花子', position: '課長', phone: '+81-90-2345-6789', email: 'suzuki@toyota.co.jp', department: '調達部' },
    ],
  },
  {
    id: '2',
    name: 'ソニーグループ',
    rank: 'A',
    businessNumber: '0100-01-067258',
    ceo: '吉田憲一郎',
    industry: '電子機器製造',
    address: '東京都港区港南1-7-1',
    totalProjects: 14,
    totalAmount: '1,800,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm3', name: '佐藤太郎', position: '部長', phone: '+81-90-3456-7890', email: 'sato@sony.co.jp', department: '購買部' },
    ],
  },
  {
    id: '3',
    name: '日立製作所',
    rank: 'A',
    businessNumber: '0100-01-009531',
    ceo: '小島啓二',
    industry: '電機製造',
    address: '東京都千代田区丸の内1-6-6',
    totalProjects: 12,
    totalAmount: '1,450,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm4', name: '山田美咲', position: '課長', phone: '+81-90-4567-8901', email: 'yamada@hitachi.co.jp', department: '資材部' },
      { id: 'm5', name: '中村健太', position: '係長', phone: '+81-90-5678-9012', email: 'nakamura@hitachi.co.jp', department: '資材部' },
    ],
  },
  {
    id: '4',
    name: 'パナソニック',
    rank: 'B',
    businessNumber: '2120-01-000142',
    ceo: '楠見雄規',
    industry: '電子機器製造',
    address: '大阪府門真市大字門真1006番地',
    totalProjects: 10,
    totalAmount: '1,120,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm6', name: '小林由美', position: '部長', phone: '+81-90-6789-0123', email: 'kobayashi@panasonic.co.jp', department: '調達部' },
    ],
  },
  {
    id: '5',
    name: '三菱電機',
    rank: 'B',
    businessNumber: '0100-01-013219',
    ceo: '漆間啓',
    industry: '電機製造',
    address: '東京都千代田区丸の内2-7-3',
    totalProjects: 8,
    totalAmount: '890,000,000',
    status: '協議中',
    statusColor: 'yellow',
    managers: [
      { id: 'm7', name: '加藤誠', position: '課長', phone: '+81-90-7890-1234', email: 'kato@mitsubishielectric.co.jp', department: '購買部' },
    ],
  },
  {
    id: '6',
    name: '富士通',
    rank: 'B',
    businessNumber: '1020-01-027916',
    ceo: '時田隆仁',
    industry: 'IT サービス',
    address: '東京都港区東新橋1-5-2',
    totalProjects: 9,
    totalAmount: '980,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm8', name: '伊藤麻衣', position: '部長', phone: '+81-90-8901-2345', email: 'ito@fujitsu.com', department: '調達部' },
    ],
  },
  {
    id: '7',
    name: 'キヤノン',
    rank: 'A',
    businessNumber: '0100-01-015599',
    ceo: '御手洗冨士夫',
    industry: '光学機器製造',
    address: '東京都大田区下丸子3-30-2',
    totalProjects: 11,
    totalAmount: '1,250,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm9', name: '高橋真', position: '部長', phone: '+81-90-9012-3456', email: 'takahashi@canon.co.jp', department: '資材部' },
    ],
  },
  {
    id: '8',
    name: '東芝',
    rank: 'C',
    businessNumber: '0100-01-014034',
    ceo: '島田太郎',
    industry: '電機製造',
    address: '東京都港区芝浦1-1-1',
    totalProjects: 6,
    totalAmount: '650,000,000',
    status: '協議中',
    statusColor: 'yellow',
    managers: [
      { id: 'm10', name: '渡辺浩二', position: '課長', phone: '+81-90-0123-4567', email: 'watanabe@toshiba.co.jp', department: '購買部' },
    ],
  },
  {
    id: '9',
    name: 'NEC',
    rank: 'B',
    businessNumber: '0100-01-002833',
    ceo: '森田隆之',
    industry: 'IT サービス',
    address: '東京都港区芝5-7-1',
    totalProjects: 7,
    totalAmount: '780,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm11', name: '松本明子', position: '部長', phone: '+81-90-1234-6789', email: 'matsumoto@nec.co.jp', department: '調達部' },
    ],
  },
  {
    id: '10',
    name: 'オムロン',
    rank: 'C',
    businessNumber: '1130-01-010526',
    ceo: '辻永順太',
    industry: '電子機器製造',
    address: '京都府京都市下京区塩小路通堀川東入',
    totalProjects: 5,
    totalAmount: '520,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm12', name: '井上春香', position: '課長', phone: '+81-90-2345-7890', email: 'inoue@omron.co.jp', department: '資材部' },
    ],
  },
  {
    id: '11',
    name: '村田製作所',
    rank: 'B',
    businessNumber: '1130-01-028605',
    ceo: '中島規巨',
    industry: '電子部品製造',
    address: '京都府長岡京市東神足1-10-1',
    totalProjects: 8,
    totalAmount: '850,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm13', name: '木村翔太', position: '部長', phone: '+81-90-3456-8901', email: 'kimura@murata.com', department: '購買部' },
    ],
  },
  {
    id: '12',
    name: 'デンソー',
    rank: 'A',
    businessNumber: '3180-01-001057',
    ceo: '有馬浩二',
    industry: '自動車部品製造',
    address: '愛知県刈谷市昭和町1-1',
    totalProjects: 13,
    totalAmount: '1,650,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm14', name: '林美紀', position: '部長', phone: '+81-90-4567-9012', email: 'hayashi@denso.co.jp', department: '調達部' },
    ],
  },
  {
    id: '13',
    name: 'ダイキン工業',
    rank: 'B',
    businessNumber: '1120-01-025809',
    ceo: '十河政則',
    industry: '空調機器製造',
    address: '大阪府大阪市北区中崎西2-4-12',
    totalProjects: 7,
    totalAmount: '720,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm15', name: '清水健一', position: '課長', phone: '+81-90-5678-0123', email: 'shimizu@daikin.co.jp', department: '資材部' },
    ],
  },
  {
    id: '14',
    name: 'ブリヂストン',
    rank: 'C',
    businessNumber: '0100-01-005770',
    ceo: '石橋秀一',
    industry: 'タイヤ製造',
    address: '東京都中央区京橋3-1-1',
    totalProjects: 5,
    totalAmount: '550,000,000',
    status: '協議中',
    statusColor: 'yellow',
    managers: [
      { id: 'm16', name: '森下愛', position: '係長', phone: '+81-90-6789-1234', email: 'morishita@bridgestone.co.jp', department: '購買部' },
    ],
  },
  {
    id: '15',
    name: '旭化成',
    rank: 'C',
    businessNumber: '0100-01-004702',
    ceo: '工藤幸四郎',
    industry: '化学製造',
    address: '東京都千代田区有楽町1-1-2',
    totalProjects: 6,
    totalAmount: '620,000,000',
    status: '取引中',
    statusColor: 'green',
    managers: [
      { id: 'm17', name: '大野健二', position: '部長', phone: '+81-90-7890-2345', email: 'ono@asahi-kasei.co.jp', department: '調達部' },
    ],
  },
];

const ITEMS_PER_PAGE = 10;

export function CompanyJapan() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

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
    if (window.confirm(`本当に「${name}」を削除しますか？`)) {
      setCompanies(companies.filter(c => c.id !== id));
      setExpandedId(null);
    }
  };

  const handleDeleteManager = (companyId: string, managerId: string, managerName: string) => {
    if (window.confirm(`本当に「${managerName}」を削除しますか？`)) {
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
        <h1 className="text-2xl font-bold text-gray-900">기업 관리 - BRYCENJAPAN</h1>
        <p className="text-sm text-gray-500 mt-1">일본 거래처 기업 정보 및 담당자를 관리합니다</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        {/* Search and Actions */}
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
                          <span className="ml-2 text-gray-900">{company.totalAmount}엔</span>
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
                  <select name="status" defaultValue={editingCompany?.status || '取引中'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="取引中">取引中</option>
                    <option value="協議中">協議中</option>
                    <option value="保留">保留</option>
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
                      <input type="text" value={`${editingCompany.totalAmount}엔`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
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