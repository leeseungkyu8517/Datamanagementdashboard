import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const monthlyData = [
  { id: 'month-1', month: '1월', 최대예상: 500, 실제매출: 450, 최소예상: 400 },
  { id: 'month-2', month: '2월', 최대예상: 580, 실제매출: 520, 최소예상: 450 },
  { id: 'month-3', month: '3월', 최대예상: 720, 실제매출: 680, 최소예상: 620 },
  { id: 'month-4', month: '4월', 최대예상: 650, 실제매출: 590, 최소예상: 530 },
  { id: 'month-5', month: '5월', 최대예상: 820, 실제매출: 750, 최소예상: 680 },
  { id: 'month-6', month: '6월', 최대예상: 900, 실제매출: 820, 최소예상: 750 },
];

const stageData = [
  { id: 's1', name: '미팅 요청', value: 5, color: '#64748B' },
  { id: 's2', name: '미팅 진행', value: 8, color: '#475569' },
  { id: 's3', name: '견적서 발송', value: 6, color: '#334155' },
  { id: 's4', name: '가격 협의', value: 4, color: '#1E293B' },
  { id: 's5', name: '계약 진행', value: 3, color: '#0F172A' },
];

const topCompanies = [
  { name: 'SK하이닉스', amount: '1,200,000,000', projects: 15, growth: '+25%' },
  { name: '삼성전자', amount: '850,000,000', projects: 12, growth: '+18%' },
  { name: 'LG전자', amount: '620,000,000', projects: 8, growth: '+12%' },
  { name: '현대자동차', amount: '430,000,000', projects: 5, growth: '+8%' },
  { name: '포스코', amount: '380,000,000', projects: 6, growth: '+15%' },
  { name: '네이버', amount: '320,000,000', projects: 7, growth: '+22%' },
  { name: '카카오', amount: '280,000,000', projects: 4, growth: '+10%' },
  { name: '한화그룹', amount: '250,000,000', projects: 5, growth: '+9%' },
  { name: '롯데그룹', amount: '220,000,000', projects: 3, growth: '+6%' },
  { name: 'CJ그룹', amount: '190,000,000', projects: 4, growth: '+11%' },
  { name: 'GS칼텍스', amount: '170,000,000', projects: 2, growth: '+5%' },
  { name: '신세계그룹', amount: '150,000,000', projects: 3, growth: '+7%' },
];

export function SalesDashboard() {
  const totalRevenue = '3,100,000,000';
  const totalProjects = 40;
  const avgDealSize = '77,500,000';
  const successRate = '72%';

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(topCompanies.length / itemsPerPage);

  const paginatedCompanies = topCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">매출 예측 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">영업 성과 및 매출 현황을 한눈에 확인합니다</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">총 매출액</span>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalRevenue}원</div>
            <div className="text-xs text-green-600 font-medium">↑ 전월 대비 +15.3%</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">총 프로젝트</span>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalProjects}건</div>
            <div className="text-xs text-green-600 font-medium">↑ 전월 대비 +8건</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">평균 계약 규모</span>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{avgDealSize}원</div>
            <div className="text-xs text-green-600 font-medium">↑ 전월 대비 +5.2%</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">계약 성공률</span>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{successRate}</div>
            <div className="text-xs text-green-600 font-medium">↑ 전월 대비 +3%p</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 매출 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  key="line-max-forecast"
                  type="monotone" 
                  dataKey="최대예상" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="최대 예상"
                  isAnimationActive={false}
                />
                <Line 
                  key="line-actual-revenue"
                  type="monotone" 
                  dataKey="실제매출" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="실제 매출"
                  isAnimationActive={false}
                />
                <Line 
                  key="line-min-forecast"
                  type="monotone" 
                  dataKey="최소예상" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="최소 예상"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stage Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">영업 단계별 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 거래처 현황</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    기업명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    총 거래액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    프로젝트 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    성장률
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedCompanies.map((company, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={company.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">{globalIndex}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{company.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">{company.amount}원</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{company.projects}건</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                          {company.growth}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              전체 {topCompanies.length}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, topCompanies.length)}개 표시
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}