import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Label,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Layers, Award, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SalesProject, Company } from '@/lib/database.types';

const STAGE_PALETTE: Record<string, { color: string; bg: string }> = {
  '미팅 요청':  { color: '#94A3B8', bg: '#F1F5F9' },
  '미팅 진행':  { color: '#60A5FA', bg: '#EFF6FF' },
  '견적서 발송': { color: '#FBBF24', bg: '#FFFBEB' },
  '가격 협의':  { color: '#FB923C', bg: '#FFF7ED' },
  '계약 진행':  { color: '#34D399', bg: '#ECFDF5' },
};

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const KPI_CONFIG = [
  { key: 'totalAmount',   label: '총 매출액',      sub: '거래처 기준 누적',    icon: DollarSign, color: '#6366F1', bg: '#EEF2FF', grad: ['#6366F1','#818CF8'] },
  { key: 'totalProjects', label: '총 프로젝트',     sub: '전체 영업 프로젝트',   icon: Layers,     color: '#0EA5E9', bg: '#F0F9FF', grad: ['#0EA5E9','#38BDF8'] },
  { key: 'avgDeal',       label: '평균 계약 규모',   sub: '예상 계약액 기준',    icon: TrendingUp, color: '#F59E0B', bg: '#FFFBEB', grad: ['#F59E0B','#FCD34D'] },
  { key: 'successRate',   label: '계약 진행률',     sub: '계약 진행 단계 기준',  icon: Award,      color: '#10B981', bg: '#ECFDF5', grad: ['#10B981','#34D399'] },
];

function fmt(n: number) { return n.toLocaleString('ko-KR'); }
function fmtShort(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000)      return `${Math.round(n / 10_000)}만`;
  return n.toLocaleString();
}

// ── Custom Tooltip ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: unknown; color: string; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter(p => p.value != null);
  if (!items.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 min-w-[180px]"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      {items.map(entry => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-gray-500">{entry.name || entry.dataKey}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: entry.color }}>{String(entry.value)}백만</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut center label ──────────────────────────────────────
function DonutCenter({ cx, cy, total }: { cx?: number; cy?: number; total: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-8" fontSize={22} fontWeight={800} fill="#1E293B">{total}</tspan>
      <tspan x={cx} dy={22} fontSize={11} fill="#94A3B8">건</tspan>
    </text>
  );
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
      const [{ data: proj }, { data: comp }] = await Promise.all([
        supabase.from('sales_projects').select('*'),
        supabase.from('companies').select('*').order('total_amount', { ascending: false }),
      ]);
      setProjects(proj ?? []);
      setCompanies(comp ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalAmount   = companies.reduce((s, c) => s + c.total_amount, 0);
  const totalProjects = projects.length;
  const withAmt       = projects.filter(p => p.amount != null);
  const avgDeal       = withAmt.length > 0
    ? Math.round(withAmt.reduce((s, p) => s + (p.amount ?? 0), 0) / withAmt.length) : 0;
  const contracted    = projects.filter(p => p.stage === '계약 진행').length;
  const successRate   = totalProjects > 0 ? Math.round((contracted / totalProjects) * 100) : 0;

  const kpiValues: Record<string, string> = {
    totalAmount:   `${fmtShort(totalAmount)}원`,
    totalProjects: `${totalProjects}건`,
    avgDeal:       `${fmtShort(avgDeal)}원`,
    successRate:   `${successRate}%`,
  };

  // 월별 데이터
  const currentYear = new Date().getFullYear();
  const monthlyMap: Record<number, { 최대예상: number; 실제매출: number; 최소예상: number }> = {};
  projects.forEach(p => {
    const d = new Date(p.created_at);
    if (d.getFullYear() !== currentYear) return;
    const m = d.getMonth();
    if (!monthlyMap[m]) monthlyMap[m] = { 최대예상: 0, 실제매출: 0, 최소예상: 0 };
    monthlyMap[m].최대예상 += Math.round((p.max_amount ?? 0) / 1_000_000);
    monthlyMap[m].실제매출 += Math.round((p.amount    ?? 0) / 1_000_000);
    monthlyMap[m].최소예상 += Math.round((p.min_amount ?? 0) / 1_000_000);
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([m, v]) => ({ month: MONTH_LABELS[Number(m)], ...v }));

  // 단계별 분포
  const stageMap: Record<string, number> = {};
  projects.forEach(p => { stageMap[p.stage] = (stageMap[p.stage] ?? 0) + 1; });
  const stageData = Object.entries(stageMap).map(([name, value]) => ({
    name, value,
    color: STAGE_PALETTE[name]?.color ?? '#94A3B8',
    bg:    STAGE_PALETTE[name]?.bg    ?? '#F8FAFC',
  }));

  const totalPages       = Math.ceil(companies.length / itemsPerPage);
  const paginatedCompanies = companies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-indigo-400 animate-spin" />
          <span className="text-sm text-gray-400">데이터 불러오는 중…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">매출 예측 대시보드</h1>
        <p className="text-sm text-gray-400 mt-0.5">영업 성과 및 매출 현황 종합</p>
      </div>

      <div className="flex-1 overflow-auto p-8 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5">
          {KPI_CONFIG.map(cfg => {
            const Icon = cfg.icon;
            return (
              <div key={cfg.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, ${cfg.grad[0]}, ${cfg.grad[1]})` }} />
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: cfg.bg }}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300" />
                </div>
                <div className="text-2xl font-black tracking-tight mb-1" style={{ color: cfg.color }}>
                  {kpiValues[cfg.key]}
                </div>
                <div className="text-sm font-medium text-gray-600">{cfg.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{cfg.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-5 gap-5">

          {/* Monthly Chart – 3/5 width */}
          <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-800">월별 매출 추이</h3>
                <p className="text-xs text-gray-400 mt-0.5">단위: 백만원 · {currentYear}년</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block bg-indigo-500 opacity-80" />실제매출
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="18" height="10"><line x1="0" y1="5" x2="18" y2="5" stroke="#22C55E" strokeWidth="2" strokeDasharray="4 2"/></svg>
                  최대예상
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="18" height="10"><line x1="0" y1="5" x2="18" y2="5" stroke="#F97316" strokeWidth="2" strokeDasharray="4 2"/></svg>
                  최소예상
                </span>
              </div>
            </div>
            {monthlyData.length === 0 ? (
              <div className="h-[280px] flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-gray-300" />
                </div>
                <span className="text-sm text-gray-400">올해 등록된 프로젝트가 없습니다</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={monthlyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#818CF8" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 6 }} />
                  <Bar dataKey="실제매출" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} name="실제매출" />
                  <Line type="monotone" dataKey="최대예상" stroke="#22C55E" strokeWidth={2} strokeDasharray="5 3"
                    dot={{ r: 3, fill: '#22C55E', stroke: '#fff', strokeWidth: 1.5 }} name="최대예상" />
                  <Line type="monotone" dataKey="최소예상" stroke="#F97316" strokeWidth={2} strokeDasharray="5 3"
                    dot={{ r: 3, fill: '#F97316', stroke: '#fff', strokeWidth: 1.5 }} name="최소예상" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stage Donut – 2/5 width */}
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-800">영업 단계별 분포</h3>
              <p className="text-xs text-gray-400 mt-0.5">전체 {totalProjects}건</p>
            </div>
            {stageData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center">
                <span className="text-sm text-gray-400">프로젝트가 없습니다</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stageData}
                      cx="50%" cy="50%"
                      innerRadius={58} outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90} endAngle={-270}
                    >
                      {stageData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                      <Label content={<DonutCenter total={totalProjects} />} position="center" />
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown, name: string) => [`${value}건`, name]}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="space-y-2">
                  {stageData.map(entry => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-gray-600">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${totalProjects > 0 ? (entry.value / totalProjects) * 100 : 0}%`,
                            backgroundColor: entry.color,
                          }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-6 text-right">{entry.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Companies Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-7 py-5 border-b border-gray-50">
            <h3 className="text-base font-bold text-gray-800">주요 거래처 현황</h3>
            <p className="text-xs text-gray-400 mt-0.5">총 거래액 기준 정렬</p>
          </div>

          {companies.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">등록된 거래처가 없습니다</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/60">
                    {['순위','기업명','국가','총 거래액','프로젝트 수','상태'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((company, index) => {
                    const rank = (currentPage - 1) * itemsPerPage + index + 1;
                    const regionLabel = { korea: '한국', japan: '일본', vietnam: '베트남' }[company.region] ?? '';
                    const rankColor = rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : rank === 3 ? '#CD7F32' : '#CBD5E1';
                    return (
                      <tr key={company.id} className="border-t border-gray-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-black"
                            style={{ backgroundColor: `${rankColor}18`, color: rankColor }}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-800">{company.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                            {regionLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">{fmt(company.total_amount)}원</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{company.total_projects}건</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            company.status === '거래중' ? 'bg-emerald-50 text-emerald-600' :
                            company.status === '협의중' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {company.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {companies.length}개 중 {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, companies.length)}개 표시
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />이전
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                        {page}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    다음<ChevronRight className="w-3.5 h-3.5" />
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
