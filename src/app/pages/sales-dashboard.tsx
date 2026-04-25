import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SalesProject, Company } from '@/lib/database.types';

const STAGE_COLORS: Record<string, string> = {
  '미팅 요청': '#64748B',
  '미팅 진행': '#475569',
  '견적서 발송': '#334155',
  '가격 협의': '#1E293B',
  '계약 진행': '#0F172A',
};

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export function SalesDashboard() {
  const [projects, setProjects] = useState<SalesProject[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: projectsData }, { data: companiesData }] = await Promise.all([
        supabase.from('sales_projects').select('*'),
        supabase.from('companies').select('*').order('total_amount', { ascending: false }),
      ]);
      setProjects(projectsData ?? []);
      setCompanies(companiesData ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // KPI 계산
  const totalAmount = companies.reduce((sum, c) => sum + c.total_amount, 0);
  const totalProjects = projects.length;
  const projectsWithAmount = projects.filter(p => p.amount != null);
  const avgDealSize = projectsWithAmount.length > 0
    ? Math.round(projectsWithAmount.reduce((sum, p) => sum + (p.amount ?? 0), 0) / projectsWithAmount.length)
    : 0;
  const contracted = projects.filter(p => p.stage === '계약 진행').length;
  const successRate = totalProjects > 0 ? Math.round((contracted / totalProjects) * 100) : 0;

  // 월별 매출 추이 (올해 데이터)
  const currentYear = new Date().getFullYear();
  const monthlyMap: Record<number, { 최대예상: number; 실제매출: number; 최소예상: number; count: number }> = {};
  projects.forEach(p => {
    const date = new Date(p.created_at);
    if (date.getFullYear() !== currentYear) return;
    const m = date.getMonth();
    if (!monthlyMap[m]) monthlyMap[m] = { 최대예상: 0, 실제매출: 0, 최소예상: 0, count: 0 };
    monthlyMap[m].최대예상 += Math.round((p.max_amount ?? 0) / 1_000_000);
    monthlyMap[m].실제매출 += Math.round((p.amount ?? 0) / 1_000_000);
    monthlyMap[m].최소예상 += Math.round((p.min_amount ?? 0) / 1_000_000);
    monthlyMap[m].count += 1;
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([m, v]) => ({ month: MONTH_LABELS[Number(m)], ...v }));

  // 영업 단계별 분포
  const stageMap: Record<string, number> = {};
  projects.forEach(p => {
    stageMap[p.stage] = (stageMap[p.stage] ?? 0) + 1;
  });
  const stageData = Object.entries(stageMap).map(([name, value]) => ({
    name,
    value,
    color: STAGE_COLORS[name] ?? '#94A3B8',
  }));

  // 주요 거래처 페이지네이션
  const totalPages = Math.ceil(companies.length / itemsPerPage);
  const paginatedCompanies = companies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">매출 예측 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">영업 성과 및 매출 현황을 한눈에 확인합니다</p>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[#f5f6fa]">
          <p className="text-gray-400 text-sm">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatAmount(totalAmount)}원</div>
            <div className="text-xs text-gray-400 font-medium">거래처 기준 누적</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">총 프로젝트</span>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalProjects}건</div>
            <div className="text-xs text-gray-400 font-medium">전체 영업 프로젝트</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">평균 계약 규모</span>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatAmount(avgDealSize)}원</div>
            <div className="text-xs text-gray-400 font-medium">예상 계약액 기준</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">계약 진행률</span>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{successRate}%</div>
            <div className="text-xs text-gray-400 font-medium">계약 진행 단계 기준</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Monthly Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 매출 추이 (백만원)</h3>
            {monthlyData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
                올해 등록된 프로젝트가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="최대예상" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} activeDot={{ r: 5 }} name="최대 예상" isAnimationActive={false} />
                  <Line type="monotone" dataKey="실제매출" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} name="실제 매출" isAnimationActive={false} />
                  <Line type="monotone" dataKey="최소예상" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5 }} name="최소 예상" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stage Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">영업 단계별 분포</h3>
            {stageData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
                등록된 프로젝트가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {stageData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 거래처 현황</h3>
          {companies.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">등록된 거래처가 없습니다</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">순위</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">기업명</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">국가</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">총 거래액</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">프로젝트 수</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedCompanies.map((company, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                      const regionLabel = { korea: '한국', japan: '일본', vietnam: '베트남' }[company.region];
                      return (
                        <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900">{globalIndex}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">{company.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">{regionLabel}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900">{formatAmount(company.total_amount)}원</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{company.total_projects}건</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              company.status === '거래중' ? 'bg-green-100 text-green-700' :
                              company.status === '협의중' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {company.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  전체 {companies.length}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, companies.length)}개 표시
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />이전
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
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    다음<ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
