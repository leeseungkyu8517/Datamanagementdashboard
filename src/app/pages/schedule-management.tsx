import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Schedule } from '@/lib/database.types';

export function ScheduleManagement() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    title: '',
    date: '',
    time: '',
    type: 'meeting',
    company: '',
    manager: '',
    client_name: '',
    client_phone: '',
  });

  useEffect(() => { fetchSchedules(); }, []);

  async function fetchSchedules() {
    setLoading(true);
    const { data } = await supabase.from('schedules').select('*').order('date').order('time');
    setSchedules(data ?? []);
    setLoading(false);
  }

  const getTypeColor = (type: Schedule['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'deadline': return 'bg-red-100 text-red-700 border-red-300';
      case 'event': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getSchedulesForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return schedules.filter(s => s.date === `${year}-${month}-${dayStr}`);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const filteredSchedules = schedules.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveSchedule = async () => {
    if (!newSchedule.title || !newSchedule.date || !newSchedule.time || !newSchedule.manager || !newSchedule.client_name || !newSchedule.client_phone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }
    setSaving(true);
    const payload = {
      title: newSchedule.title!,
      date: newSchedule.date!,
      time: newSchedule.time || null,
      type: (newSchedule.type ?? 'meeting') as Schedule['type'],
      company: newSchedule.company || null,
      manager: newSchedule.manager || null,
      client_name: newSchedule.client_name || null,
      client_phone: newSchedule.client_phone || null,
    };
    const { data } = await supabase.from('schedules').insert(payload).select().single();
    if (data) setSchedules(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')));
    setSaving(false);
    setIsAddMode(false);
    setNewSchedule({ title: '', date: '', time: '', type: 'meeting', company: '', manager: '', client_name: '', client_phone: '' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;
    await supabase.from('schedules').delete().eq('id', id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    setSelectedSchedule(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">스케줄 관리</h1>
            <p className="text-sm text-gray-500 mt-1">월별 일정을 관리합니다</p>
          </div>
          <button onClick={() => { setIsAddMode(true); setNewSchedule({ title: '', date: '', time: '', type: 'meeting', company: '', manager: '', client_name: '', client_phone: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm font-medium">
            <Plus className="w-4 h-4" />일정 추가
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="스케줄 명으로 검색..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          {searchTerm && (
            <div className="mt-4 max-h-60 overflow-auto">
              <div className="text-xs font-semibold text-gray-600 mb-2">검색 결과</div>
              <div className="space-y-2">
                {filteredSchedules.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">검색 결과가 없습니다</div>
                ) : filteredSchedules.map(schedule => (
                  <div key={schedule.id} onClick={() => { setSelectedSchedule(schedule); setSearchTerm(''); }}
                    className={`px-3 py-2 rounded-lg border ${getTypeColor(schedule.type)} cursor-pointer hover:shadow-md transition-shadow`}>
                    <div className="text-sm font-bold">{schedule.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {schedule.date} {schedule.time}
                      {schedule.company && <span className="ml-2">• {schedule.company}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{monthYear}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-24 text-center text-sm text-gray-400">데이터를 불러오는 중...</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                    <div key={day} className={`text-center font-semibold text-sm py-2 ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const daySchedules = day ? getSchedulesForDate(day) : [];
                    const today = isToday(day);
                    return (
                      <div key={index} className={`min-h-[120px] border rounded-lg p-2 ${
                        day ? (today ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300') : 'bg-gray-50 border-gray-100'
                      } transition-colors`}>
                        {day && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${today ? 'text-blue-600' : 'text-gray-700'}`}>
                              {day}{today && <span className="ml-1 text-xs">(오늘)</span>}
                            </div>
                            <div className="space-y-1">
                              {daySchedules.map(schedule => (
                                <div key={schedule.id} onClick={() => setSelectedSchedule(schedule)}
                                  className={`text-xs px-2 py-1 rounded border ${getTypeColor(schedule.type)} truncate cursor-pointer hover:shadow-sm transition-shadow`}
                                  title={`${schedule.time} - ${schedule.title}`}>
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
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-gray-700">범례:</span>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div><span className="text-sm text-gray-600">미팅</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div><span className="text-sm text-gray-600">마감</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div><span className="text-sm text-gray-600">이벤트</span></div>
            </div>
          </div>
        </div>
      </div>

      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedSchedule(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">스케줄 상세 정보</h3>
              <button onClick={() => setSelectedSchedule(null)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">스케줄 명</label>
                <div className="text-base font-bold text-gray-900">{selectedSchedule.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">날짜</label><div className="text-sm text-gray-900">{selectedSchedule.date}</div></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">시간</label><div className="text-sm text-gray-900">{selectedSchedule.time ?? '-'}</div></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">유형</label>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedSchedule.type)}`}>
                  {selectedSchedule.type === 'meeting' ? '미팅' : selectedSchedule.type === 'deadline' ? '마감' : '이벤트'}
                </span>
              </div>
              {selectedSchedule.company && (
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">담당업체</label><div className="text-sm text-gray-900">{selectedSchedule.company}</div></div>
              )}
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">담당자</label><div className="text-sm text-gray-900">{selectedSchedule.manager ?? '-'}</div></div>
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-xs font-semibold text-gray-500 mb-3">고객 담당자 정보</label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">성함</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSchedule.client_name ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">연락처</span>
                    <span className="text-sm font-medium text-gray-900">{selectedSchedule.client_phone ?? '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-2">
              <button onClick={() => handleDelete(selectedSchedule.id)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">
                <Trash2 className="w-4 h-4" />삭제
              </button>
              <button onClick={() => setSelectedSchedule(null)}
                className="flex-1 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] text-sm font-medium">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddMode && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setIsAddMode(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">새 일정 추가</h3>
              <button onClick={() => setIsAddMode(false)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">스케줄 명 *</label>
                <input type="text" value={newSchedule.title ?? ''} onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">날짜 *</label>
                  <input type="date" value={newSchedule.date ?? ''} onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">시간 *</label>
                  <input type="time" value={newSchedule.time ?? ''} onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">유형</label>
                <select value={newSchedule.type} onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value as Schedule['type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="meeting">미팅</option>
                  <option value="deadline">마감</option>
                  <option value="event">이벤트</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">담당업체</label>
                <input type="text" value={newSchedule.company ?? ''} onChange={(e) => setNewSchedule({ ...newSchedule, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">담당자 *</label>
                <input type="text" value={newSchedule.manager ?? ''} onChange={(e) => setNewSchedule({ ...newSchedule, manager: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-xs font-semibold text-gray-500 mb-3">고객 담당자 정보 *</label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">성함</label>
                    <input type="text" value={newSchedule.client_name ?? ''} onChange={(e) => setNewSchedule({ ...newSchedule, client_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">연락처</label>
                    <input type="text" value={newSchedule.client_phone ?? ''} onChange={(e) => setNewSchedule({ ...newSchedule, client_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={handleSaveSchedule} disabled={saving}
                className="w-full px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] text-sm font-medium disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}