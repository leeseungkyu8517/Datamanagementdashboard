import { useState } from 'react';
import { Search, Plus, ChevronDown, Calendar, Edit2, Trash2, X } from 'lucide-react';

type SalesStage = '미팅 요청' | '미팅 진행' | '견적서 발송' | '가격 협의' | '계약 진행';

type MeetingNote = {
  id: string;
  date: string;
  attendees: string;
  content: string;
};

type SalesProject = {
  id: string;
  projectName: string;
  companyName: string;
  businessNumber: string;
  companyPhone: string; // 기관전화번호 추가
  stage: SalesStage;
  amount: string;
  minAmount: string;
  maxAmount: string;
  summary: string;
  projectOverview: string; // 프로젝트 개요 필드 추가
  lastUpdate: string;
  manager: string;
  meetingNotes: MeetingNote[];
};

const mockProjects: SalesProject[] = [
  {
    id: '1',
    projectName: 'ERP 시스템 구축',
    companyName: '테크코리아',
    businessNumber: '123-86-12345',
    companyPhone: '02-1234-5678', // 기관전화번호 추가
    stage: '견적서 발송',
    amount: '450,000,000',
    minAmount: '400,000,000',
    maxAmount: '500,000,000',
    summary: 'ERP 시스템 도입 필요성 및 주요 기능 협의를 진행함.',
    projectOverview: 'ERP 시스템을 통해 생산성 향상 및 비용 절감을 목표로 합니다.',
    lastUpdate: '2024-03-10',
    manager: '김영수',
    meetingNotes: [
      {
        id: 'n1',
        date: '2024-03-15',
        attendees: '김영수, 박부장 외 1명',
        content: '초기 미팅. 1차 요구사항 청취. ERP 시스템 도입 필요성 및 주요 기능 협의를 진행함. 추가 보완사항 정리 예정.',
      },
      {
        id: 'n2',
        date: '2024-02-20',
        attendees: '이과장 외 4',
        content: '기능별 일정 및 예산 조율. 각 부서 요구사항을 청취하고 시스템 구축 로드맵 수립.',
      },
    ],
  },
  {
    id: '2',
    projectName: 'CRM 플랫폼 개발',
    companyName: '글로벌상사',
    businessNumber: '602-00-00488',
    companyPhone: '02-2345-6789', // 기관전화번호 추가
    stage: '미팅 진행',
    amount: '320,000,000',
    minAmount: '300,000,000',
    maxAmount: '350,000,000',
    summary: 'CRM 도입 배경 및 현황 파악. 기존 시스템 문제점 분석.',
    projectOverview: 'CRM을 통해 고객 관계 관리 및 마케팅 효과 향상을 목표로 합니다.',
    lastUpdate: '2024-03-12',
    manager: '박민지',
    meetingNotes: [
      {
        id: 'n3',
        date: '2024-03-12',
        attendees: '박민지, 최대리',
        content: 'CRM 도입 배경 및 현황 파악. 기존 시스템 문제점 분석.',
      },
    ],
  },
  {
    id: '3',
    projectName: '클라우드 인프라 구축',
    companyName: '스마트솔루션',
    businessNumber: '456-88-30458',
    companyPhone: '02-3456-7890', // 기관전화번호 추가
    stage: '계약 진행',
    amount: '680,000,000',
    minAmount: '650,000,000',
    maxAmount: '700,000,000',
    summary: '계약서 최종 검토 진행. 보안 요구사항 추가 논의.',
    projectOverview: '클라우드 인프라를 통해 데이터 보안 및 확장성을 향상시킵니다.',
    lastUpdate: '2024-03-14',
    manager: '최동욱',
    meetingNotes: [
      {
        id: 'n4',
        date: '2024-03-14',
        attendees: '최동욱, IT팀장',
        content: '계약서 최종 검토 진행. 보안 요구사항 추가 논의.',
      },
      {
        id: 'n5',
        date: '2024-03-01',
        attendees: '최동욱, 김부장 외 2명',
        content: '클라우드 아키텍처 설계 발표. 비용 및 일정 협의.',
      },
    ],
  },
  {
    id: '4',
    projectName: 'AI 기반 품질관리',
    companyName: 'SK하이닉스',
    businessNumber: '120-81-00679',
    companyPhone: '02-4567-8901', // 기관전화번호 추가
    stage: '가격 협의',
    amount: '890,000,000',
    minAmount: '850,000,000',
    maxAmount: '900,000,000',
    summary: 'AI 모델 정확도 개선안 논의. 추가 개발 비용 산정.',
    projectOverview: 'AI 기반 품질관리 시스템을 통해 품질 향상 및 비용 절감을 목표로 합니다.',
    lastUpdate: '2024-03-08',
    manager: '윤재현',
    meetingNotes: [
      {
        id: 'n6',
        date: '2024-03-08',
        attendees: '윤재현, 품질팀',
        content: 'AI 모델 정확도 개선안 논의. 추가 개발 비용 산정.',
      },
    ],
  },
  {
    id: '5',
    projectName: '데이터센터 보안',
    companyName: '네이버',
    businessNumber: '220-81-62517',
    companyPhone: '02-5678-9012', // 기관전화번호 추가
    stage: '미팅 요청',
    amount: '230,000,000',
    minAmount: '200,000,000',
    maxAmount: '250,000,000',
    summary: '데이터센터 보안 강화 필요성 파악.',
    projectOverview: '데이터센터 보안 강화를 통해 정보 보호 및 비즈니스 연속성을 확보합니다.',
    lastUpdate: '2024-03-13',
    manager: '정수진',
    meetingNotes: [],
  },
  {
    id: '6',
    projectName: '모바일 앱 개발',
    companyName: '카카오',
    businessNumber: '120-88-02649',
    companyPhone: '02-6789-0123', // 기관전화번호 추가
    stage: '계약 진행',
    amount: '180,000,000',
    minAmount: '170,000,000',
    maxAmount: '190,000,000',
    summary: '앱 기능 명세서 확정. 디자인 가이드 공유.',
    projectOverview: '모바일 앱을 통해 사용자 경험 향상 및 고객 만족도 증가를 목표로 합니다.',
    lastUpdate: '2024-03-11',
    manager: '김민수',
    meetingNotes: [
      {
        id: 'n7',
        date: '2024-03-11',
        attendees: '김민수, 개발팀장',
        content: '앱 기능 명세서 확정. 디자인 가이드 공유.',
      },
    ],
  },
  {
    id: '7',
    projectName: '생산관리 시스템',
    companyName: '포스코',
    businessNumber: '104-81-21738',
    companyPhone: '02-7890-1234', // 기관전화번호 추가
    stage: '가격 협의',
    amount: '520,000,000',
    minAmount: '500,000,000',
    maxAmount: '550,000,000',
    summary: '시스템 커스터마이징 범위 조정. 유지보수 비용 협의.',
    projectOverview: '생산관리 시스템을 통해 생산 효율성 향상 및 비용 절감을 목표로 합니다.',
    lastUpdate: '2024-03-09',
    manager: '이철민',
    meetingNotes: [
      {
        id: 'n8',
        date: '2024-03-09',
        attendees: '이철민, 생산팀',
        content: '시스템 커스터마이징 범위 조정. 유지보수 비용 협의.',
      },
    ],
  },
  {
    id: '8',
    projectName: 'IT 인프라 현대화',
    companyName: '두산중공업',
    businessNumber: '134-81-03215',
    companyPhone: '02-8901-2345', // 기관전화번호 추가
    stage: '견적서 발송',
    amount: '410,000,000',
    minAmount: '390,000,000',
    maxAmount: '430,000,000',
    summary: '레거시 시스템 마이그레이션 계획 수립.',
    projectOverview: '레거시 시스템을 현대화하여 성능 향상 및 유지보수 용이성을 목표로 합니다.',
    lastUpdate: '2024-03-07',
    manager: '박진우',
    meetingNotes: [
      {
        id: 'n9',
        date: '2024-03-07',
        attendees: '박진우, IT실장',
        content: '레거시 시스템 마이그레이션 계획 수립.',
      },
    ],
  },
  {
    id: '9',
    projectName: '물류 자동화',
    companyName: 'CJ제일제당',
    businessNumber: '104-86-09535',
    companyPhone: '02-9012-3456', // 기관전화번호 추가
    stage: '미팅 진행',
    amount: '350,000,000',
    minAmount: '330,000,000',
    maxAmount: '370,000,000',
    summary: '물류 자동화 시스템 도입 필요성 파악.',
    projectOverview: '물류 자동화를 통해 효율성 향상 및 비용 절감을 목표로 합니다.',
    lastUpdate: '2024-03-06',
    manager: '최민정',
    meetingNotes: [],
  },
  {
    id: '10',
    projectName: '공정 최적화',
    companyName: '롯데케미칼',
    businessNumber: '117-81-00138',
    companyPhone: '02-0123-4567', // 기관전화번호 추가
    stage: '미팅 요청',
    amount: '280,000,000',
    minAmount: '260,000,000',
    maxAmount: '300,000,000',
    summary: '공정 최적화 필요성 파악.',
    projectOverview: '공정 최적화를 통해 생산 효율성 향상 및 비용 절감을 목표로 합니다.',
    lastUpdate: '2024-03-05',
    manager: '한지영',
    meetingNotes: [],
  },
  {
    id: '11',
    projectName: '프로젝트 관리 도구',
    companyName: 'GS건설',
    businessNumber: '120-81-01392',
    companyPhone: '02-1234-5678', // 기관전화번호 추가
    stage: '계약 진행',
    amount: '150,000,000',
    minAmount: '140,000,000',
    maxAmount: '160,000,000',
    summary: '프로젝트 관리 도구 도입 필요성 파악.',
    projectOverview: '프로젝트 관리 도구를 통해 프로젝트 효율성 향상 및 리스크 관리를 목표로 합니다.',
    lastUpdate: '2024-03-04',
    manager: '서준호',
    meetingNotes: [],
  },
  {
    id: '12',
    projectName: '제조 실행 시스템',
    companyName: '한화에어로스페이스',
    businessNumber: '114-81-06311',
    companyPhone: '02-2345-6789', // 기관전화번호 추가
    stage: '가격 협의',
    amount: '470,000,000',
    minAmount: '450,000,000',
    maxAmount: '490,000,000',
    summary: '제조 실행 시스템 도입 필요성 파악.',
    projectOverview: '제조 실행 시스템을 통해 생산 효율성 향상 및 비용 절감을 목표로 합니다.',
    lastUpdate: '2024-03-03',
    manager: '노승민',
    meetingNotes: [],
  },
  {
    id: '13',
    projectName: '선박 관리 시스템',
    companyName: '대우조선해양',
    businessNumber: '135-81-00210',
    companyPhone: '02-3456-7890', // 기관전화번호 추가
    stage: '견적서 발송',
    amount: '390,000,000',
    minAmount: '370,000,000',
    maxAmount: '410,000,000',
    summary: '선박 관리 시스템 도입 필요성 파악.',
    projectOverview: '선박 관리 시스템을 통해 운영 효율성 향상 및 비용 절감을 목표로 합니다.',
    lastUpdate: '2024-03-02',
    manager: '김태현',
    meetingNotes: [],
  },
  {
    id: '14',
    projectName: 'IoT 센서 네트워크',
    companyName: '코웨이',
    businessNumber: '117-81-43611',
    companyPhone: '02-4567-8901', // 기관전화번호 추가
    stage: '미팅 진행',
    amount: '120,000,000',
    minAmount: '110,000,000',
    maxAmount: '130,000,000',
    summary: 'IoT 센서 네트워크 도입 필요성 파악.',
    projectOverview: 'IoT 센서 네트워크를 통해 실시간 모니터링 및 데이터 분석을 목표로 합니다.',
    lastUpdate: '2024-03-01',
    manager: '임하늘',
    meetingNotes: [],
  },
  {
    id: '15',
    projectName: 'CRM 시스템',
    companyName: '아모레퍼시픽',
    businessNumber: '106-86-43373',
    companyPhone: '02-5678-9012', // 기관전화번호 추가
    stage: '미팅 요청',
    amount: '210,000,000',
    minAmount: '200,000,000',
    maxAmount: '220,000,000',
    summary: 'CRM 시스템 도입 필요성 파악.',
    projectOverview: 'CRM 시스템을 통해 고객 관계 관리 및 마케팅 효과 향상을 목표로 합니다.',
    lastUpdate: '2024-02-28',
    manager: '오지현',
    meetingNotes: [],
  },
];

const stages: SalesStage[] = [
  '미팅 요청',
  '미팅 진행',
  '견적서 발송',
  '가격 협의',
  '계약 진행',
];

export function SalesHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('전체');
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [newProject, setNewProject] = useState({
    projectName: '',
    companyName: '',
    manager: '',
    projectOverview: '',
  });

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStage === '전체' || project.stage === filterStage;
    return matchesSearch && matchesFilter;
  });

  const selectedProject = mockProjects.find((p) => p.id === selectedProjectId);

  // 프로세스별 통계 계산
  const stageStats = stages.map((stage) => ({
    stage,
    count: mockProjects.filter((p) => p.stage === stage).length,
  }));

  const getStageColor = (stage: SalesStage) => {
    switch (stage) {
      case '미팅 요청':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case '미팅 진행':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case '견적서 발송':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case '가격 협의':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case '계약 진행':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStageProgress = (stage: SalesStage) => {
    const stageIndex = stages.indexOf(stage);
    return ((stageIndex + 1) / stages.length) * 100;
  };

  const getProgressColor = (stage: SalesStage) => {
    switch (stage) {
      case '미팅 요청':
        return 'bg-gray-500';
      case '미팅 진행':
        return 'bg-blue-500';
      case '견적서 발송':
        return 'bg-yellow-500';
      case '가격 협의':
        return 'bg-orange-500';
      case '계약 진행':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatCardColor = (index: number) => {
    const colors = [
      'bg-gray-500',
      'bg-blue-500',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-green-500',
    ];
    return colors[index] || 'bg-gray-500';
  };

  // 최근 회의 날짜 가져오기
  const getLatestMeetingDate = (project: SalesProject) => {
    if (project.meetingNotes.length === 0) {
      return '회의록 없음';
    }
    const sortedDates = [...project.meetingNotes].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sortedDates[0].date;
  };

  return (
    <div className="flex h-full bg-[#f5f6fa]">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedProjectId ? 'mr-96' : ''}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">영업 이력 관리</h1>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Stats Section Title */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 font-medium">
              영업 프로세스별 현황 (지난 3개월 기준 프로젝트 수)
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {stageStats.map((stat, index) => (
              <div
                key={stat.stage}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{stat.stage}</span>
                  <div className={`w-2 h-2 rounded-full ${getStatCardColor(index)}`} />
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
                <input
                  type="text"
                  placeholder="프로젝트명 또는 기업명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer"
                >
                  <option value="전체">모든 단계</option>
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium whitespace-nowrap" onClick={() => setIsAddMode(true)}>
                <Plus className="w-4 h-4" />
                새 프로젝트
              </button>
            </div>
          </div>

          {/* Project List */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">영업 프로젝트 목록</h2>
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`bg-white rounded-lg shadow-sm border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
                    selectedProjectId === project.id
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        {project.projectName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <span>{project.companyName}</span>
                        <span className="text-gray-400">•</span>
                        <span>{project.businessNumber}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-700">예상 매출액:</span> {project.minAmount}원 ~ {project.maxAmount}원
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-700">영업 내용:</span> {project.summary}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">프로젝트 개요:</span> {project.projectOverview}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Progress Bar - Small Horizontal */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {stages.indexOf(project.stage) + 1}/{stages.length}
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-full rounded-full transition-all ${getProgressColor(project.stage)}`}
                            style={{ width: `${getStageProgress(project.stage)}%` }}
                          />
                        </div>
                      </div>
                      {/* Stage Badge */}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStageColor(
                          project.stage
                        )}`}
                      >
                        {project.stage}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">
                      최근 회의 진행 날짜: {getLatestMeetingDate(project)}
                    </span>
                    <span className="text-gray-600">담당: {project.manager}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Meeting Notes */}
      {selectedProjectId && selectedProject && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-end">
            <button
              onClick={() => setSelectedProjectId(null)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Project Info */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="space-y-3">
              {/* 영업 프로젝트 명 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">영업프로젝트 명</label>
                <h4 className="text-lg font-bold text-gray-900 mt-1">{selectedProject.projectName}</h4>
              </div>

              {/* 기관명 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">기관명</label>
                <p className="text-sm text-gray-800 mt-1 font-medium">{selectedProject.companyName}</p>
              </div>

              {/* 기관전화번호 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">기관전화번호</label>
                <p className="text-sm text-gray-800 mt-1">{selectedProject.companyPhone}</p>
              </div>

              {/* 주요 영업 내용 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">주요 영업 내용</label>
                <p className="text-sm text-gray-800 mt-1 leading-relaxed">{selectedProject.summary}</p>
              </div>

              {/* 프로젝트 개요 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">프로젝트 개요</label>
                <p className="text-sm text-gray-800 mt-1 leading-relaxed">{selectedProject.projectOverview}</p>
              </div>
            </div>
          </div>

          {/* Meeting Notes List */}
          <div className="flex-1 overflow-auto px-6 py-4">
            <h3 className="text-base font-bold text-gray-900 mb-4">회의록</h3>
            {selectedProject.meetingNotes.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">등록된 회의록이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProject.meetingNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {note.date}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Delete logic here
                        }}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      참석자: {note.attendees}
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">{note.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Note Button */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium">
              <Plus className="w-4 h-4" />
              회의록 추가
            </button>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddMode && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setIsAddMode(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">새 프로젝트 추가</h3>
              <button
                onClick={() => setIsAddMode(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 명</label>
                  <input
                    type="text"
                    value={newProject.projectName}
                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                    placeholder="프로젝트 명을 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">기업명</label>
                  <select
                    value={newProject.companyName}
                    onChange={(e) => setNewProject({ ...newProject, companyName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">기업을 선택하세요</option>
                    <option value="테크코리아">테크코리아</option>
                    <option value="글로벌상사">글로벌상사</option>
                    <option value="스마트솔루션">스마트솔루션</option>
                    <option value="SK하이닉스">SK하이닉스</option>
                    <option value="네이버">네이버</option>
                    <option value="카카오">카카오</option>
                    <option value="포스코">포스코</option>
                    <option value="두산중공업">두산중공업</option>
                    <option value="CJ제일제당">CJ제일제당</option>
                    <option value="롯데케미칼">롯데케미칼</option>
                    <option value="GS건설">GS건설</option>
                    <option value="한화에어로스페이스">한화에어로스페이스</option>
                    <option value="대우조선해양">대우조선해양</option>
                    <option value="코웨이">코웨이</option>
                    <option value="아모레퍼시픽">아모레퍼시픽</option>
                  </select>
                </div>

                {/* Manager */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">담당자</label>
                  <select
                    value={newProject.manager}
                    onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">담당자를 선택하세요</option>
                    <option value="김영수">김영수</option>
                    <option value="박민지">박민지</option>
                    <option value="최동욱">최동욱</option>
                    <option value="윤재현">윤재현</option>
                    <option value="정수진">정수진</option>
                    <option value="김민수">김민수</option>
                    <option value="이철민">이철민</option>
                    <option value="박진우">박진우</option>
                    <option value="최민정">최민정</option>
                    <option value="한지영">한지영</option>
                    <option value="서준호">서준호</option>
                    <option value="노승민">노승민</option>
                    <option value="김태현">김태현</option>
                    <option value="임하늘">임하늘</option>
                    <option value="오지현">오지현</option>
                  </select>
                </div>

                {/* Project Overview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 개요</label>
                  <textarea
                    value={newProject.projectOverview}
                    onChange={(e) => setNewProject({ ...newProject, projectOverview: e.target.value })}
                    placeholder="프로젝트 개요를 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setIsAddMode(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!newProject.projectName || !newProject.companyName || !newProject.manager) {
                    alert('모든 항목을 입력해주세요.');
                    return;
                  }
                  alert('프로젝트가 생성되었습니다.');
                  setIsAddMode(false);
                  setNewProject({ projectName: '', companyName: '', manager: '', projectOverview: '' });
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Note Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedNote(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">회의록 상세</h3>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">날짜</label>
                  <input
                    type="text"
                    defaultValue={selectedNote.date}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Attendees */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">참석자</label>
                  <input
                    type="text"
                    defaultValue={selectedNote.attendees}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">회의 내용</label>
                  <textarea
                    defaultValue={selectedNote.content}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => setSelectedNote(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-sm font-medium"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  alert('회의록이 저장되었습니다.');
                  setSelectedNote(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}