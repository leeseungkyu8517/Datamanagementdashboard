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
    name: 'Vingroup',
    rank: 'A',
    businessNumber: '0104672772',
    ceo: 'Pham Nhat Vuong',
    industry: '부동산 개발',
    address: '458 Minh Khai, Hai Ba Trung, Hanoi',
    totalProjects: 16,
    totalAmount: '1,850,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm1', name: 'Nguyen Van An', position: 'Giám đốc', phone: '+84-90-123-4567', email: 'nva@vingroup.vn', department: 'Mua hàng' },
      { id: 'm2', name: 'Tran Thi Bich', position: 'Trưởng phòng', phone: '+84-90-234-5678', email: 'ttb@vingroup.vn', department: 'Mua hàng' },
    ],
  },
  {
    id: '2',
    name: 'Viettel Group',
    rank: 'A',
    businessNumber: '0100109106',
    ceo: 'Le Dang Dung',
    industry: '통신 서비스',
    address: 'Tầng 10, Tòa Viettel, Nguyễn Chí Thanh, Hà Nội',
    totalProjects: 14,
    totalAmount: '1,650,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm3', name: 'Pham Van Cuong', position: 'Giám đốc', phone: '+84-90-345-6789', email: 'pvc@viettel.vn', department: 'Thu mua' },
    ],
  },
  {
    id: '3',
    name: 'FPT Corporation',
    rank: 'A',
    businessNumber: '0100122243',
    ceo: 'Truong Gia Binh',
    industry: 'IT 서비스',
    address: 'FPT Building, Duy Tan, Cau Giay, Hanoi',
    totalProjects: 12,
    totalAmount: '1,320,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm4', name: 'Le Thi Dung', position: 'Phó giám đốc', phone: '+84-90-456-7890', email: 'ltd@fpt.vn', department: 'Mua sắm' },
      { id: 'm5', name: 'Hoang Van Hai', position: 'Trưởng phòng', phone: '+84-90-567-8901', email: 'hvh@fpt.vn', department: 'Mua sắm' },
    ],
  },
  {
    id: '4',
    name: 'Vietnam Airlines',
    rank: 'B',
    businessNumber: '0100107518',
    ceo: 'Dang Ngoc Hoa',
    industry: '항공 운송',
    address: '200 Nguyen Son, Long Bien, Hanoi',
    totalProjects: 10,
    totalAmount: '1,080,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm6', name: 'Vu Thi Kim', position: 'Giám đốc', phone: '+84-90-678-9012', email: 'vtk@vietnamairlines.com', department: 'Thu mua' },
    ],
  },
  {
    id: '5',
    name: 'Masan Group',
    rank: 'B',
    businessNumber: '0101468579',
    ceo: 'Nguyen Dang Quang',
    industry: '소비재 제조',
    address: 'Keangnam Hanoi, Pham Hung, Tu Liem, Hanoi',
    totalProjects: 8,
    totalAmount: '820,000,000',
    status: 'Đang thảo luận',
    statusColor: 'yellow',
    managers: [
      { id: 'm7', name: 'Dao Van Long', position: 'Trưởng phòng', phone: '+84-90-789-0123', email: 'dvl@masan.vn', department: 'Mua hàng' },
    ],
  },
  {
    id: '6',
    name: 'PetroVietnam',
    rank: 'A',
    businessNumber: '0100105157',
    ceo: 'Le Manh Hung',
    industry: '석유 가스',
    address: '18 Lang Ha, Dong Da, Hanoi',
    totalProjects: 15,
    totalAmount: '1,720,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm8', name: 'Bui Van Minh', position: 'Giám đốc', phone: '+84-90-890-1234', email: 'bvm@pvn.vn', department: 'Thu mua' },
    ],
  },
  {
    id: '7',
    name: 'Hoa Phat Group',
    rank: 'B',
    businessNumber: '0100101353',
    ceo: 'Tran Dinh Long',
    industry: '철강 제조',
    address: 'Hoa Phat Building, Duong Dinh Nghe, Hanoi',
    totalProjects: 9,
    totalAmount: '950,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm9', name: 'Nguyen Thi Nga', position: 'Phó giám đốc', phone: '+84-90-901-2345', email: 'ntn@hoaphat.vn', department: 'Vật tư' },
    ],
  },
  {
    id: '8',
    name: 'Techcombank',
    rank: 'C',
    businessNumber: '0100105858',
    ceo: 'Nguyen Le Quoc Anh',
    industry: '은행 서비스',
    address: '191 Ba Trieu, Hai Ba Trung, Hanoi',
    totalProjects: 6,
    totalAmount: '620,000,000',
    status: 'Đang thảo luận',
    statusColor: 'yellow',
    managers: [
      { id: 'm10', name: 'Phan Van Phong', position: 'Trưởng phòng', phone: '+84-90-012-3456', email: 'pvp@techcombank.vn', department: 'Mua sắm' },
    ],
  },
  {
    id: '9',
    name: 'VinFast',
    rank: 'B',
    businessNumber: '0108926276',
    ceo: 'Le Thi Thu Thuy',
    industry: '자동차 제조',
    address: 'Vinhomes Ocean Park, Gia Lam, Hanoi',
    totalProjects: 11,
    totalAmount: '1,150,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm11', name: 'Tran Van Quang', position: 'Giám đốc', phone: '+84-90-123-4567', email: 'tvq@vinfast.vn', department: 'Thu mua' },
    ],
  },
  {
    id: '10',
    name: 'VNG Corporation',
    rank: 'C',
    businessNumber: '0312120782',
    ceo: 'Le Hong Minh',
    industry: 'IT 서비스',
    address: '182 Le Dai Hanh, Hai Ba Trung, Hanoi',
    totalProjects: 7,
    totalAmount: '680,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm12', name: 'Dang Thi Hoa', position: 'Trưởng phòng', phone: '+84-90-234-5678', email: 'dth@vng.vn', department: 'Mua hàng' },
    ],
  },
  {
    id: '11',
    name: 'Saigon Beer',
    rank: 'B',
    businessNumber: '0300938336',
    ceo: 'Koh Poh Tiong',
    industry: '음료 제조',
    address: '256 Nguyen Van Linh, Q7, HCMC',
    totalProjects: 8,
    totalAmount: '780,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm13', name: 'Vo Van Son', position: 'Phó giám đốc', phone: '+84-90-345-6789', email: 'vvs@sabeco.vn', department: 'Thu mua' },
    ],
  },
  {
    id: '12',
    name: 'Mobile World',
    rank: 'B',
    businessNumber: '0303217354',
    ceo: 'Nguyen Duc Tai',
    industry: '소매 유통',
    address: '129 Tran Quang Khai, Tan Dinh, HCMC',
    totalProjects: 9,
    totalAmount: '870,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm14', name: 'Le Van Tai', position: 'Giám đốc', phone: '+84-90-456-7890', email: 'lvt@thegioididong.com', department: 'Mua sắm' },
    ],
  },
  {
    id: '13',
    name: 'Vietcombank',
    rank: 'A',
    businessNumber: '0100116556',
    ceo: 'Pham Quang Dung',
    industry: '은행 서비스',
    address: '198 Tran Quang Khai, Hoan Kiem, Hanoi',
    totalProjects: 13,
    totalAmount: '1,420,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm15', name: 'Ha Thi Uyen', position: 'Phó giám đốc', phone: '+84-90-567-8901', email: 'htu@vietcombank.vn', department: 'Thu mua' },
    ],
  },
  {
    id: '14',
    name: 'Novaland',
    rank: 'C',
    businessNumber: '0303717799',
    ceo: 'Bui Thanh Nhon',
    industry: '부동산 개발',
    address: 'Nova Center, 115 Tran Hung Dao, HCMC',
    totalProjects: 5,
    totalAmount: '520,000,000',
    status: 'Đang thảo luận',
    statusColor: 'yellow',
    managers: [
      { id: 'm16', name: 'Nguyen Van Vinh', position: 'Trưởng phòng', phone: '+84-90-678-9012', email: 'nvv@novaland.vn', department: 'Mua hàng' },
    ],
  },
  {
    id: '15',
    name: 'Vinamilk',
    rank: 'A',
    businessNumber: '0300588569',
    ceo: 'Mai Kieu Lien',
    industry: '유제품 제조',
    address: '10 Tan Trao, Tan Phu, HCMC',
    totalProjects: 10,
    totalAmount: '1,050,000,000',
    status: 'Đang giao dịch',
    statusColor: 'green',
    managers: [
      { id: 'm17', name: 'Tran Thi Xuan', position: 'Giám đốc', phone: '+84-90-789-0123', email: 'ttx@vinamilk.vn', department: 'Thu mua' },
    ],
  },
];

const ITEMS_PER_PAGE = 10;

export function CompanyVietnam() {
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
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}" không?`)) {
      setCompanies(companies.filter(c => c.id !== id));
      setExpandedId(null);
    }
  };

  const handleDeleteManager = (companyId: string, managerId: string, managerName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${managerName}" không?`)) {
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
        <h1 className="text-2xl font-bold text-gray-900">기업 관리 - BRYCENVIETNAM</h1>
        <p className="text-sm text-gray-500 mt-1">베트남 거래처 기업 정보 및 담당자를 관리합니다</p>
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
                          <span className="ml-2 text-gray-900">{company.totalAmount}동</span>
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
                  <select name="status" defaultValue={editingCompany?.status || 'Đang giao dịch'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Đang giao dịch">Đang giao dịch</option>
                    <option value="Đang thảo luận">Đang thảo luận</option>
                    <option value="Bảo lưu">Bảo lưu</option>
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
                      <input type="text" value={`${editingCompany.totalAmount}동`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" />
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