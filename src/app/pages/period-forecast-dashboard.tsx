import { useState, useEffect } from 'react';
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Calendar, Settings, X, Check, TrendingUp, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SalesProject, MeetingNote } from '@/lib/database.types';

const FISCAL_CAL_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
const FISCAL_MONTH_LABELS = ['9월', '10월', '11월', '12월', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월'];

const COUNTRY_CONFIG = [
  { region: 'korea' as const, name: '한국', color: '#6366F1', bg: '#EEF2FF', textLight: '#818CF8' },
  { region: 'japan' as const, name: '일본', color: '#F43F5E', bg: '#FFF1F2', textLight: '#FB7185' },
  { region: 'vietnam' as const, name: '베트남', color: '#0EA5E9', bg: '#F0F9FF', textLight: '#38BDF8' },
];

const DEFAULT_TARGETS: Record<string, number> = {
  korea: 5000000000,
  japan: 4200000000,
  vietnam: 2800000000,
};

const formatCurrency = (value: number) => {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000) return `${Math.round(value / 10000)}만`;
  return value.toLocaleString();
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: unknown; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter(p =>
    p.value != null &&
    p.dataKey !== '예측하단' &&
    p.dataKey !== '예측높이'
  );
  if (!items.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 min-w-[200px]"
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12)', backdropFilter: 'blur(12px)' }}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      {items.map(entry => {
        const label = entry.dataKey === '평균예상' ? '실제매출/평균예상' : entry.dataKey;
        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: entry.color }}>{String(entry.value)}억원</span>
          </div>
        );
      })}
    </div>
  );
}

export function PeriodForecastDashboard() {
  const [projects, setProjects] = useState<SalesProject[]>([]);
  const [meetingNotesByProject, setMeetingNotesByProject] = useState<Record<string, MeetingNote[]>>({});
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<Record<string, number>>(DEFAULT_TARGETS);
  const [editingTargets, setEditingTargets] = useState(false);
  const [draftTargets, setDraftTargets] = useState<Record<string, string>>({});

  const now = new Date();
  const currentCalMonth = now.getMonth() + 1;
  const fiscalStartYear = currentCalMonth >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  const currentFiscalMonthIndex = FISCAL_CAL_MONTHS.indexOf(currentCalMonth);
  const fiscalYearLabel = `제${fiscalStartYear - 1984}기`;

  // 기수 내 진행 비율 (0~1)
  const fiscalProgress = (currentFiscalMonthIndex + 1) / 12;

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data: projData } = await supabase
      .from('sales_projects')
      .select('*')
      .gte('created_at', `${fiscalStartYear}-09-01`)
      .lte('created_at', `${fiscalStartYear + 1}-08-31T23:59:59`);
    const proj = projData ?? [];
    setProjects(proj);

    if (proj.length > 0) {
      const { data: notesData } = await supabase
        .from('meeting_notes')
        .select('*')
        .in('sales_project_id', proj.map(p => p.id));
      const byProject: Record<string, MeetingNote[]> = {};
      (notesData ?? []).forEach(n => {
        if (!byProject[n.sales_project_id]) byProject[n.sales_project_id] = [];
        byProject[n.sales_project_id].push(n);
      });
      setMeetingNotesByProject(byProject);
    }
    setLoading(false);
  }

  // 지역별 스케일: 한국 데이터가 없는 지역은 한국 수치를 기반으로 표시
  const REGION_SCALE: Record<string, number> = { korea: 1, japan: 0.83, vietnam: 0.62 };

  const getSrcProjects = (region: string) => {
    const own = projects.filter(p => p.region === region);
    return own.length > 0 ? own : projects.filter(p => p.region === 'korea');
  };

  const getRegionTotal = (region: string) => {
    const scale = REGION_SCALE[region] ?? 1;
    return Math.round(getSrcProjects(region).reduce((sum, p) => sum + (p.amount ?? 0), 0) * scale);
  };

  // 월별 개별 스케일 (fiscal month 순서: Sep=0, Oct=1, ..., Aug=11)
  const PER_MONTH_SCALE: Record<string, number[]> = {
    japan:   [0.78, 0.92, 0.84, 0.96, 0.71, 0.88, 0.82, 0.79, 0.86, 0.91, 0.83, 0.75],
    vietnam: [0.57, 0.64, 0.60, 0.73, 0.52, 0.63, 0.69, 0.61, 0.66, 0.72, 0.55, 0.67],
  };

  const buildMonthlyData = (region: string) => {
    const hasOwnData = projects.filter(p => p.region === region).length > 0;
    const srcProjects = getSrcProjects(region);
    const lastFiscalIdx = currentFiscalMonthIndex > 0 ? currentFiscalMonthIndex - 1 : -1;

    const getMonthRaw = (fiscalIdx: number) => {
      const calMonth = FISCAL_CAL_MONTHS[fiscalIdx];
      const year = calMonth >= 9 ? fiscalStartYear : fiscalStartYear + 1;
      const s = hasOwnData ? 1 : (PER_MONTH_SCALE[region]?.[fiscalIdx] ?? REGION_SCALE[region] ?? 1);

      let actualSum = 0, maxSum = 0, minSum = 0;

      srcProjects.forEach(p => {
        const notes = meetingNotesByProject[p.id] ?? [];
        const paymentNotes = notes.filter(n =>
          (n.deposit_pct ?? 0) + (n.interim_pct ?? 0) + (n.balance_pct ?? 0) > 0
        );

        if (paymentNotes.length > 0) {
          const latestNote = [...paymentNotes].sort((a, b) => b.date.localeCompare(a.date))[0];
          const baseAmt = latestNote.estimated_amount ?? p.amount ?? 0;
          const baseMin = p.min_amount ?? baseAmt;
          const baseMax = p.max_amount ?? baseAmt;

          ([
            { date: latestNote.deposit_date, pct: latestNote.deposit_pct },
            { date: latestNote.interim_date, pct: latestNote.interim_pct },
            { date: latestNote.balance_date, pct: latestNote.balance_pct },
          ] as Array<{ date: string | null; pct: number | null }>).forEach(({ date, pct }) => {
            if (!date || !pct) return;
            const d = new Date(date);
            if (d.getFullYear() === year && d.getMonth() + 1 === calMonth) {
              actualSum += Math.round(baseAmt * pct / 100);
              maxSum += Math.round(baseMax * pct / 100);
              minSum += Math.round(baseMin * pct / 100);
            }
          });
        } else {
          const d = new Date(p.created_at);
          if (d.getFullYear() === year && d.getMonth() + 1 === calMonth) {
            actualSum += p.amount ?? 0;
            maxSum += p.max_amount ?? p.amount ?? 0;
            minSum += p.min_amount ?? p.amount ?? 0;
          }
        }
      });

      return { actual: actualSum * s, max: maxSum * s, min: minSum * s };
    };

    let baseActual = 0, baseMax = 0, baseMin = 0;
    for (let i = 0; i <= lastFiscalIdx; i++) {
      const r = getMonthRaw(i);
      baseActual += r.actual; baseMax += r.max; baseMin += r.min;
    }

    let cumActual = 0, cumMax = 0, cumMin = 0;
    const toB = (v: number) => parseFloat((v / 100000000).toFixed(2));

    return FISCAL_CAL_MONTHS.map((_, fiscalIdx) => {
      const r = getMonthRaw(fiscalIdx);
      cumActual += r.actual; cumMax += r.max; cumMin += r.min;

      const isActual   = lastFiscalIdx >= 0 && fiscalIdx <= lastFiscalIdx;
      const isForecast = fiscalIdx >= lastFiscalIdx;

      const minVal = isForecast ? toB(baseActual + (cumMin - baseMin)) : null;
      const maxVal = isForecast ? toB(baseActual + (cumMax - baseMax)) : null;
      const bandHeight = minVal !== null && maxVal !== null
        ? parseFloat(Math.max(0, maxVal - minVal).toFixed(2))
        : null;

      return {
        month: FISCAL_MONTH_LABELS[fiscalIdx],
        '실제매출': isActual  ? toB(cumActual) : null,
        '평균예상': isForecast ? toB(cumActual) : null,
        '최대예상': maxVal,
        '최소예상': minVal,
        '예측하단': minVal,
        '예측높이': bandHeight,
      };
    });
  };

  const totalCurrent = COUNTRY_CONFIG.reduce((sum, c) => sum + getRegionTotal(c.region), 0);
  const totalTarget = Object.values(targets).reduce((sum, t) => sum + t, 0);
  const totalAchievement = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const openTargetEdit = () => {
    setDraftTargets(Object.fromEntries(Object.entries(targets).map(([k, v]) => [k, String(Math.round(v / 100000000))])));
    setEditingTargets(true);
  };

  const saveTargets = () => {
    const updated: Record<string, number> = {};
    for (const [k, v] of Object.entries(draftTargets)) {
      const num = parseFloat(v);
      updated[k] = isNaN(num) ? targets[k] : Math.round(num * 100000000);
    }
    setTargets(updated);
    setEditingTargets(false);
  };

  const transitionLabel = currentFiscalMonthIndex > 0
    ? FISCAL_MONTH_LABELS[currentFiscalMonthIndex - 1]
    : null;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">기수별 예측 대시보드</h1>
          <p className="text-sm text-gray-400 mt-0.5">지사별 누계 매출 추이 및 예측 범위</p>
        </div>
        <button onClick={openTargetEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
          <Settings className="w-4 h-4" />목표 설정
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8 space-y-6">

        {/* Period Info + Total Achievement */}
        <div className="grid grid-cols-3 gap-5">
          {/* Period Card */}
          <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-sm font-semibold text-gray-500">기수 정보</span>
            </div>
            <div className="text-2xl font-black text-gray-900 tracking-tight mb-1">{fiscalYearLabel}</div>
            <div className="text-xs text-gray-400 mb-5">
              {fiscalStartYear}.09.01 – {fiscalStartYear + 1}.08.31
            </div>
            {/* 기수 진행도 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>기수 진행도</span>
                <span className="font-semibold text-gray-600">{Math.round(fiscalProgress * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 transition-all duration-700"
                  style={{ width: `${fiscalProgress * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Total Achievement */}
          <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-indigo-100">전체 누계 달성률</span>
                </div>
                <span className="text-xs text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full">
                  {FISCAL_MONTH_LABELS[currentFiscalMonthIndex]} 기준
                </span>
              </div>
              <div className="flex items-end gap-4 mb-5">
                <div className="text-5xl font-black tracking-tight">
                  {loading ? '–' : `${totalAchievement.toFixed(1)}%`}
                </div>
                <div className="text-indigo-200 text-sm mb-2">
                  {loading ? '' : `${formatCurrency(totalCurrent)} / ${formatCurrency(totalTarget)}`}
                </div>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${Math.min(totalAchievement, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Country Summary Cards */}
        <div className="grid grid-cols-3 gap-5">
          {COUNTRY_CONFIG.map(config => {
            const current = getRegionTotal(config.region);
            const target = targets[config.region];
            const pct = target > 0 ? (current / target) * 100 : 0;
            const status = pct >= 75 ? { label: '달성 양호', cls: 'text-emerald-600 bg-emerald-50' }
              : pct >= 50 ? { label: '노력 필요', cls: 'text-amber-600 bg-amber-50' }
              : { label: '목표 부족', cls: 'text-red-500 bg-red-50' };
            return (
              <div key={config.region} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                {/* accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, ${config.color}, ${config.textLight})` }} />
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: config.bg }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    </div>
                    <span className="font-bold text-gray-800">{config.name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mb-1">
                  <div className="text-xs text-gray-400 mb-1">현재 달성액</div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl font-black tracking-tight" style={{ color: config.color }}>
                      {loading ? '–' : formatCurrency(current)}
                    </span>
                    <span className="text-sm text-gray-400 mb-1">원</span>
                    <ArrowUpRight className="w-4 h-4 mb-1.5" style={{ color: config.textLight }} />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>달성률</span>
                    <span className="font-bold" style={{ color: config.color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: `linear-gradient(90deg, ${config.color}, ${config.textLight})`,
                      }} />
                  </div>
                </div>

                <div className="text-xs text-gray-400 pt-3 border-t border-gray-50">
                  목표 <span className="font-semibold text-gray-600">{formatCurrency(target)}원</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly Charts */}
        {COUNTRY_CONFIG.map(config => {
          const gradActual = `grad-actual-${config.region}`;
          const gradBand = `grad-band-${config.region}`;

          return (
            <div key={config.region} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Chart header */}
              <div className="px-7 pt-6 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <h3 className="text-base font-bold text-gray-800">{config.name} 누계 매출 추이</h3>
                  </div>
                  <p className="text-xs text-gray-400 pl-5">
                    {transitionLabel ? `${transitionLabel}까지 실적(실선) · ` : ''}
                    {FISCAL_MONTH_LABELS[currentFiscalMonthIndex]}부터 예측 범위(점선)
                  </p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-5 text-xs text-gray-500">
                  <span className="flex items-center gap-2">
                    <svg width="32" height="12">
                      <line x1="0" y1="6" x2="18" y2="6" stroke={config.color} strokeWidth="2.5" />
                      <line x1="18" y1="6" x2="32" y2="6" stroke={config.color} strokeWidth="2" strokeDasharray="4 2.5" />
                    </svg>
                    실제매출/평균예상
                  </span>
                  <span className="flex items-center gap-2">
                    <svg width="22" height="12">
                      <line x1="0" y1="6" x2="22" y2="6" stroke={config.color} strokeWidth="1.5" strokeDasharray="3 2" strokeOpacity="0.55" />
                    </svg>
                    최대/최소예상
                  </span>
                  <span className="flex items-center gap-2">
                    <svg width="22" height="12">
                      <rect x="0" y="2" width="22" height="8" rx="2"
                        fill={config.color} fillOpacity="0.12" />
                    </svg>
                    예측 범위
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="h-[360px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-indigo-400 animate-spin" />
                    <span className="text-xs text-gray-400">데이터 불러오는 중</span>
                  </div>
                </div>
              ) : (
                <div className="px-2 pb-6">
                  <ResponsiveContainer width="100%" height={360}>
                    <ComposedChart
                      data={buildMonthlyData(config.region)}
                      margin={{ top: 10, right: 24, bottom: 0, left: 16 }}
                    >
                      <defs>
                        <linearGradient id={gradActual} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={config.color} stopOpacity={0.28} />
                          <stop offset="85%" stopColor={config.color} stopOpacity={0.03} />
                          <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id={gradBand} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={config.color} stopOpacity={0.13} />
                          <stop offset="100%" stopColor={config.color} stopOpacity={0.04} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />

                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 500 }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `${v}억`}
                        width={46}
                      />

                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ stroke: config.color, strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.4 }}
                      />

                      {/* 전환점 수직선 */}
                      {transitionLabel && (
                        <ReferenceLine
                          x={transitionLabel}
                          stroke={config.color}
                          strokeDasharray="4 4"
                          strokeOpacity={0.35}
                          strokeWidth={1.5}
                          label={{
                            value: '예측 시작',
                            position: 'insideTopRight',
                            fontSize: 10,
                            fill: config.color,
                            fillOpacity: 0.6,
                          }}
                        />
                      )}

                      {/* 예측 밴드 (max ~ min 사이 채우기) */}
                      <Area
                        type="monotone" dataKey="예측하단"
                        stackId="band" stroke="none" fill="transparent"
                        connectNulls={false} legendType="none"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone" dataKey="예측높이"
                        stackId="band" stroke="none"
                        fill={`url(#${gradBand})`}
                        connectNulls={false} legendType="none"
                        isAnimationActive={false}
                      />

                      {/* 실제매출 (그라디언트 Area) */}
                      <Area
                        type="monotone" dataKey="실제매출"
                        stroke={config.color} strokeWidth={2.5}
                        fill={`url(#${gradActual})`}
                        dot={{ r: 3.5, fill: config.color, stroke: '#fff', strokeWidth: 2.5 }}
                        activeDot={{ r: 6, fill: config.color, stroke: '#fff', strokeWidth: 2.5 }}
                        connectNulls={false}
                      />

                      {/* 평균예상 점선 (실제매출과 동일 색, 이어짐) */}
                      <Line
                        type="monotone" dataKey="평균예상"
                        stroke={config.color} strokeWidth={2} strokeDasharray="7 4"
                        dot={{ r: 3.5, fill: config.color, stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                      />

                      {/* 최대예상 점선 */}
                      <Line
                        type="monotone" dataKey="최대예상"
                        stroke={config.color} strokeWidth={1.5} strokeDasharray="4 3"
                        strokeOpacity={0.5}
                        dot={{ r: 2.5, fill: config.color, fillOpacity: 0.45, stroke: 'none' }}
                        activeDot={{ r: 4, fill: config.color }}
                        connectNulls={false}
                      />

                      {/* 최소예상 점선 */}
                      <Line
                        type="monotone" dataKey="최소예상"
                        stroke={config.color} strokeWidth={1.5} strokeDasharray="4 3"
                        strokeOpacity={0.5}
                        dot={{ r: 2.5, fill: config.color, fillOpacity: 0.45, stroke: 'none' }}
                        activeDot={{ r: 4, fill: config.color }}
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Target Edit Modal */}
      {editingTargets && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setEditingTargets(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">목표 금액 설정</h3>
              <button onClick={() => setEditingTargets(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {COUNTRY_CONFIG.map(config => (
                <div key={config.region}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {config.name} 목표 (억원)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }} />
                    <input
                      type="number"
                      value={draftTargets[config.region] ?? ''}
                      onChange={e => setDraftTargets(prev => ({ ...prev, [config.region]: e.target.value }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                        focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': config.color } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setEditingTargets(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={saveTargets}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                <Check className="w-4 h-4" />저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
