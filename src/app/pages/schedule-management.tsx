import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';

interface Schedule {
  id: number;
  date: string;
  title: string;
  time: string;
  type: 'meeting' | 'deadline' | 'event';
  company?: string;
  manager: string;
  clientName: string;
  clientPhone: string;
}

const scheduleData: Schedule[] = [
  { id: 1, date: '2026-03-03', title: 'SK하이닉스 미팅', time: '14:00', type: 'meeting', company: 'SK하이닉스', manager: '김철수', clientName: '박영희', clientPhone: '010-1234-5678' },
  { id: 2, date: '2026-03-03', title: '견적서 제출 마감', time: '17:00', type: 'deadline', company: '삼성전자', manager: '이영희', clientName: '김철수', clientPhone: '010-8765-4321' },
  { id: 3, date: '2026-03-05', title: 'LG전자 계약 미팅', time: '10:00', type: 'meeting', company: 'LG전자', manager: '박영희', clientName: '이영희', clientPhone: '010-5678-1234' },
  { id: 4, date: '2026-03-07', title: '현대자동차 프레젠테이션', time: '15:00', type: 'meeting', company: '현대자동차', manager: '김철수', clientName: '박영희', clientPhone: '010-1234-5678' },
  { id: 5, date: '2026-03-10', title: '월간 영업 회의', time: '09:00', type: 'event', manager: '이영희', clientName: '김철수', clientPhone: '010-8765-4321' },
  { id: 6, date: '2026-03-12', title: 'KT 견적 협의', time: '11:00', type: 'meeting', company: 'KT', manager: '박영희', clientName: '이영희', clientPhone: '010-5678-1234' },
  { id: 7, date: '2026-03-15', title: '포스코 계약서 검토', time: '16:00', type: 'deadline', company: '포스코', manager: '김철수', clientName: '박영희', clientPhone: '010-1234-5678' },
  { id: 8, date: '2026-03-17', title: 'SK텔레콤 미팅', time: '13:00', type: 'meeting', company: 'SK텔레콤', manager: '이영희', clientName: '김철수', clientPhone: '010-8765-4321' },
  { id: 9, date: '2026-03-18', title: '네이버 기술 미팅', time: '14:30', type: 'meeting', company: '네이버', manager: '박영희', clientName: '이영희', clientPhone: '010-5678-1234' },
  { id: 10, date: '2026-03-20', title: '분기 실적 보고', time: '10:00', type: 'event', manager: '김철수', clientName: '박영희', clientPhone: '010-1234-5678' },
  { id: 11, date: '2026-03-22', title: '카카오 파트너십 미팅', time: '15:00', type: 'meeting', company: '카카오', manager: '이영희', clientName: '김철수', clientPhone: '010-8765-4321' },
  { id: 12, date: '2026-03-24', title: '삼성SDS 제안서 제출', time: '18:00', type: 'deadline', company: '삼성SDS', manager: '박영희', clientName: '이영희', clientPhone: '010-5678-1234' },
  { id: 13, date: '2026-03-25', title: '롯데 그룹 미팅', time: '11:00', type: 'meeting', company: '롯데', manager: '김철수', clientName: '박영희', clientPhone: '010-1234-5678' },
  { id: 14, date: '2026-03-27', title: 'CJ 계약 논의', time: '14:00', type: 'meeting', company: 'CJ', manager: '이영희', clientName: '김철수', clientPhone: '010-8765-4321' },
  { id: 15, date: '2026-03-30', title: '월말 결산', time: '09:00', type: 'event', manager: '박영희', clientName: '이영희', clientPhone: '010-5678-1234' },
];

export function ScheduleManagement() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>(scheduleData);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    title: '',
    date: '',
    time: '',
    type: 'meeting',
    company: '',
    manager: '',
    clientName: '',
    clientPhone: '',
  });

  const getTypeColor = (type: Schedule['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'deadline':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'event':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getSchedulesForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  // Create calendar grid
  const calendarDays = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === 15 && // Today is March 15, 2026
      currentDate.getMonth() === 2 &&
      currentDate.getFullYear() === 2026
    );
  };

  const handleAddSchedule = () => {
    setIsAddMode(true);
    setNewSchedule({
      title: '',
      date: '',
      time: '',
      type: 'meeting',
      company: '',
      manager: '',
      clientName: '',
      clientPhone: '',
    });
  };

  const handleSaveSchedule = () => {
    if (!newSchedule.title || !newSchedule.date || !newSchedule.time || !newSchedule.manager || !newSchedule.clientName || !newSchedule.clientPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    const newId = Math.max(...schedules.map(s => s.id), 0) + 1;
    const scheduleToAdd: Schedule = {
      id: newId,
      title: newSchedule.title,
      date: newSchedule.date,
      time: newSchedule.time,
      type: newSchedule.type as 'meeting' | 'deadline' | 'event',
      company: newSchedule.company,
      manager: newSchedule.manager,
      clientName: newSchedule.clientName,
      clientPhone: newSchedule.clientPhone,
    };

    setSchedules([...schedules, scheduleToAdd]);
    setIsAddMode(false);
    setNewSchedule({
      title: '',
      date: '',
      time: '',
      type: 'meeting',
      company: '',
      manager: '',
      clientName: '',
      clientPhone: '',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">스케줄 관리</h1>
            <p className="text-sm text-gray-500 mt-1">월별 일정을 관리합니다</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm font-medium" onClick={handleAddSchedule}>
            <Plus className="w-4 h-4" />
            일정 추가
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="스케줄 명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          {searchTerm && (
            <div className="mt-4 max-h-60 overflow-auto">
              <div className="text-xs font-semibold text-gray-600 mb-2">검색 결과</div>
              <div className="space-y-2">
                {scheduleData
                  .filter(schedule => schedule.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(schedule => (
                    <div
                      key={schedule.id}
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setSearchTerm('');
                      }}
                      className={`px-3 py-2 rounded-lg border ${getTypeColor(schedule.type)} cursor-pointer hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold">{schedule.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {schedule.date} {schedule.time}
                            {schedule.company && <span className="ml-2">• {schedule.company}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {scheduleData.filter(schedule => schedule.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">검색 결과가 없습니다</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{monthYear}</h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div
                  key={day}
                  className={`text-center font-semibold text-sm py-2 ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const schedules = day ? getSchedulesForDate(day) : [];
                const today = isToday(day);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border rounded-lg p-2 ${
                      day
                        ? today
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                        : 'bg-gray-50 border-gray-100'
                    } transition-colors`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${
                          today ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {day}
                          {today && <span className="ml-1 text-xs">(오늘)</span>}
                        </div>
                        <div className="space-y-1">
                          {schedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              onClick={() => setSelectedSchedule(schedule)}
                              className={`text-xs px-2 py-1 rounded border ${getTypeColor(
                                schedule.type
                              )} truncate cursor-pointer hover:shadow-sm transition-shadow`}
                              title={`${schedule.time} - ${schedule.title}`}
                            >
                              <div className="font-medium">{schedule.time}</div>
                              <div className="truncate">{schedule.title}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-gray-700">범례:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                <span className="text-sm text-gray-600">미팅</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                <span className="text-sm text-gray-600">마감</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
                <span className="text-sm text-gray-600">이벤트</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Detail Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedSchedule(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">스케줄 상세 정보</h3>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">스케줄 명</label>
                  <div className="text-base font-bold text-gray-900">{selectedSchedule.title}</div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">날짜</label>
                    <div className="text-sm text-gray-900">{selectedSchedule.date}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">시간</label>
                    <div className="text-sm text-gray-900">{selectedSchedule.time}</div>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">유형</label>
                  <div className="inline-flex">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedSchedule.type)}`}>
                      {selectedSchedule.type === 'meeting' ? '미팅' : selectedSchedule.type === 'deadline' ? '마감' : '이벤트'}
                    </span>
                  </div>
                </div>

                {/* Company */}
                {selectedSchedule.company && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">담당업체</label>
                    <div className="text-sm text-gray-900">{selectedSchedule.company}</div>
                  </div>
                )}

                {/* Manager */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">담당자</label>
                  <div className="text-sm text-gray-900">{selectedSchedule.manager}</div>
                </div>

                {/* Client Info */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 mb-3">고객 담당자 정보</label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">성함</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSchedule.clientName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">연락처</span>
                      <span className="text-sm font-medium text-gray-900">{selectedSchedule.clientPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedSchedule(null)}
                className="w-full px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {isAddMode && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setIsAddMode(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">새 일정 추가</h3>
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
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">스케줄 명</label>
                  <input
                    type="text"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">날짜</label>
                    <input
                      type="date"
                      value={newSchedule.date}
                      onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">시간</label>
                    <input
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">유형</label>
                  <select
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value as 'meeting' | 'deadline' | 'event' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="meeting">미팅</option>
                    <option value="deadline">마감</option>
                    <option value="event">이벤트</option>
                  </select>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">담당업체</label>
                  <input
                    type="text"
                    value={newSchedule.company}
                    onChange={(e) => setNewSchedule({ ...newSchedule, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Manager */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">담당자</label>
                  <input
                    type="text"
                    value={newSchedule.manager}
                    onChange={(e) => setNewSchedule({ ...newSchedule, manager: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Client Info */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 mb-3">고객 담당자 정보</label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">성함</label>
                      <input
                        type="text"
                        value={newSchedule.clientName}
                        onChange={(e) => setNewSchedule({ ...newSchedule, clientName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">연락처</label>
                      <input
                        type="text"
                        value={newSchedule.clientPhone}
                        onChange={(e) => setNewSchedule({ ...newSchedule, clientPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSaveSchedule}
                className="w-full px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm font-medium"
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