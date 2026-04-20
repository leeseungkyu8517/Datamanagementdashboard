import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

const periodData = {
  periodName: '2026년 1기',
  startDate: '2026-01-01',
  currentMonth: '2026-04',
  countries: [
    {
      name: '한국',
      target: 5000000000,
      current: 3100000000,
      color: '#3B82F6',
      monthlyData: [
        { month: '1월', 목표: 1000, 예상: 950, 현재매출: 900 },
        { month: '2월', 목표: 2000, 예상: 1900, 현재매출: 1850 },
        { month: '3월', 목표: 3000, 예상: 2850, 현재매출: 2700 },
        { month: '4월', 목표: 4000, 예상: 3800, 현재매출: 3100 },
        { month: '5월', 목표: 5000, 예상: 4750, 현재매출: null },
        { month: '6월', 목표: 6000, 예상: 5700, 현재매출: null },
        { month: '7월', 목표: 7000, 예상: 6650, 현재매출: null },
        { month: '8월', 목표: 8000, 예상: 7600, 현재매출: null },
        { month: '9월', 목표: 9000, 예상: 8550, 현재매출: null },
        { month: '10월', 목표: 10000, 예상: 9500, 현재매출: null },
        { month: '11월', 목표: 11000, 예상: 10450, 현재매출: null },
        { month: '12월', 목표: 12000, 예상: 11400, 현재매출: null },
      ],
    },
    {
      name: '일본',
      target: 4200000000,
      current: 2800000000,
      color: '#8B5CF6',
      monthlyData: [
        { month: '1월', 목표: 840, 예상: 800, 현재매출: 750 },
        { month: '2월', 목표: 1680, 예상: 1600, 현재매출: 1550 },
        { month: '3월', 목표: 2520, 예상: 2400, 현재매출: 2300 },
        { month: '4월', 목표: 3360, 예상: 3200, 현재매출: 2800 },
        { month: '5월', 목표: 4200, 예상: 4000, 현재매출: null },
        { month: '6월', 목표: 5040, 예상: 4800, 현재매출: null },
        { month: '7월', 목표: 5880, 예상: 5600, 현재매출: null },
        { month: '8월', 목표: 6720, 예상: 6400, 현재매출: null },
        { month: '9월', 목표: 7560, 예상: 7200, 현재매출: null },
        { month: '10월', 목표: 8400, 예상: 8000, 현재매출: null },
        { month: '11월', 목표: 9240, 예상: 8800, 현재매출: null },
        { month: '12월', 목표: 10080, 예상: 9600, 현재매출: null },
      ],
    },
    {
      name: '베트남',
      target: 2800000000,
      current: 1650000000,
      color: '#10B981',
      monthlyData: [
        { month: '1월', 목표: 560, 예상: 520, 현재매출: 480 },
        { month: '2월', 목표: 1120, 예상: 1040, 현재매출: 1000 },
        { month: '3월', 목표: 1680, 예상: 1560, 현재매출: 1450 },
        { month: '4월', 목표: 2240, 예상: 2080, 현재매출: 1650 },
        { month: '5월', 목표: 2800, 예상: 2600, 현재매출: null },
        { month: '6월', 목표: 3360, 예상: 3120, 현재매출: null },
        { month: '7월', 목표: 3920, 예상: 3640, 현재매출: null },
        { month: '8월', 목표: 4480, 예상: 4160, 현재매출: null },
        { month: '9월', 목표: 5040, 예상: 4680, 현재매출: null },
        { month: '10월', 목표: 5600, 예상: 5200, 현재매출: null },
        { month: '11월', 목표: 6160, 예상: 5720, 현재매출: null },
        { month: '12월', 목표: 6720, 예상: 6240, 현재매출: null },
      ],
    },
  ],
};

const formatCurrency = (value: number) => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  return `${(value / 10000).toFixed(0)}만`;
};

const calculateAchievement = (current: number, target: number) => {
  return ((current / target) * 100).toFixed(1);
};

export function PeriodForecastDashboard() {
  const totalAchievement = calculateAchievement(
    periodData.countries.reduce((sum, c) => sum + c.current, 0),
    periodData.countries.reduce((sum, c) => sum + c.target, 0)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">기수별 예측 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">각 지사별 목표 대비 달성 현황을 확인합니다</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        {/* Period Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">기수 정보</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">{periodData.periodName}</div>
              <div className="text-sm text-gray-500 mt-1">
                {periodData.startDate} ~ 현재 ({periodData.currentMonth})
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">전체 달성률</div>
              <div className="text-3xl font-bold text-blue-600">{totalAchievement}%</div>
            </div>
          </div>
        </div>

        {/* Country Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {periodData.countries.map((country) => {
            const achievement = calculateAchievement(country.current, country.target);

            return (
              <div key={country.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{country.name}</h3>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: country.color }}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">목표 금액</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(country.target)}원</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">현재 달성액</div>
                    <div className="text-xl font-bold" style={{ color: country.color }}>
                      {formatCurrency(country.current)}원
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">달성률</span>
                      <span className="font-bold" style={{ color: country.color }}>
                        {achievement}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(parseFloat(achievement), 100)}%`,
                          backgroundColor: country.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="pt-2">
                    {parseFloat(achievement) >= 75 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        목표 달성 양호
                      </span>
                    ) : parseFloat(achievement) >= 50 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        추가 노력 필요
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        목표 대비 부족
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly Progress Charts */}
        {periodData.countries.map((country) => (
          <div key={country.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{country.name} 월별 진척사항</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={country.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 14 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: '억 원', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => (value ? `${value}억원` : '데이터 없음')} />
                <Legend />
                <Line type="monotone" dataKey="목표" stroke="#94A3B8" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="예상" stroke="#FFA500" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" connectNulls />
                <Line type="monotone" dataKey="현재매출" stroke={country.color} strokeWidth={3} dot={{ r: 5 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
