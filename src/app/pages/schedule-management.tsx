import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Schedule } from '@/lib/database.types';

// ── 카테고리 & 관리사항 상수 ─────────────────────────────────
const CATEGORIES = [
  { key: 'P', label: '신규 발굴',   color: 'bg-teal-100   text-teal-700   border-teal-300',   active: 'bg-teal-500   text-white border-teal-500',   cal: 'bg-teal-100   text-teal-800   border-teal-300'   },
  { key: 'M', label: '미팅 및 제안', color: 'bg-blue-100   text-blue-700   border-blue-300',   active: 'bg-blue-500   text-white border-blue-500',   cal: 'bg-blue-100   text-blue-800   border-blue-300'   },
  { key: 'D', label: '문서 작업',   color: 'bg-amber-100  text-amber-700  border-amber-300',  active: 'bg-amber-500  text-white border-amber-500',  cal: 'bg-amber-100  text-amber-800  border-amber-300'  },
  { key: 'C', label: '클로징',      color: 'bg-purple-100 text-purple-700 border-purple-300', active: 'bg-purple-500 text-white border-purple-500', cal: 'bg-purple-100 text-purple-800 border-purple-300' },
  { key: 'R', label: '사후 관리',   color: 'bg-orange-100 text-orange-700 border-orange-300', active: 'bg-orange-500 text-white border-orange-500', cal: 'bg-orange-100 text-orange-800 border-orange-300' },
  { key: 'E', label: '기타',        color: 'bg-gray-100   text-gray-700   border-gray-300',   active: 'bg-gray-500   text-white border-gray-500',   cal: 'bg-gray-100   text-gray-700   border-gray-300'   },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

const MANAGEMENT_ITEMS: Record<CategoryKey, string[]> = {
  P: ['잠재 고객 타겟 리스트', '첫 컨택용 콜드 메일/제안 문구 템플릿', '고객사 사전 분석 요약본', '직접 작성'],
  M: ['미팅 회의록', '고객 맞춤형 제안서 (Solution Deck)', '제품 시연 시나리오 및 Q&A 답변지', '직접 작성'],
  D: ['견적서', '계약서', '내부 보고용 매출 기안서 및 승인 서류', '직접 작성'],
  C: ['최종 수정 견적서 및 최종 협약서', '세금계산서 발행 요청서 및 영수증', '수주 성공/실패 사유 분석 보고서', '직접 작성'],
  R: ['정기 방문 보고서 및 서비스 만족도 설문', '신규 기능/제품 안내 공문 및 뉴스레터', '주요 고객 기념일 및 인사 이동 기록지', '직접 작성'],
  E: ['직접 작성'],
};

const CATEGORY_TO_TYPE: Record<CategoryKey, Schedule['type']> = {
  P: 'meeting', M: 'meeting', D: 'deadline', C: 'event', R: 'event', E: 'event',
};

function getCatConfig(key: string | null | undefined) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[0];
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
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

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', company: '', manager: '', client_name: '', client_phone: '',
  });
  const [category, setCategory] = useState<CategoryKey | ''>('');
  const [managementItem, setManagementItem] = useState('');
  const [directInput, setDirectInput] = useState('');
  const [detail, setDetail] = useState('');

  useEffect(() => { fetchSchedules(); }, []);

  async function fetchSchedules() {
    setLoading(true);
    const { data } = await supabase.from('schedules').select('*').order('date').order('time');
    setSchedules(data ?? []);
    setLoading(false);
  }

  const resetForm = () => {
    setFormData({ title: '', date: '', time: '', company: '', manager: '', client_name: '', client_phone: '' });
    setCategory('P');
    setManagementItem('');
    setDirectInput('');
    setDetail('');
  };

  const getScheduleColor = (s: Schedule) => {
    if (s.category) return getCatConfig(s.category).cal;
    switch (s.type) {
      case 'meeting':  return 'bg-blue-100   text-blue-700   border-blue-300';
      case 'deadline': return 'bg-red-100    text-red-700    border-red-300';
      case 'event':    return 'bg-purple-100 text-purple-700 border-purple-300';
      default:         return 'bg-gray-100   text-gray-700   border-gray-300';
    }
  };

  const getDaysInMonth  = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const getSchedulesForDate = (day: number) => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return schedules.filter(s => s.date === `${y}-${m}-${d}`);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay    = getFirstDayOfMonth(currentDate);
  const monthYear   = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const filteredSchedules = schedules.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveSchedule = async () => {
    if (!formData.title || !formData.date || !formData.time || !formData.manager || !formData.client_name || !formData.client_phone || !category) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }
    setSaving(true);
    const managementItemValue = managementItem === '직접 작성' ? directInput : managementItem;
    const payload = {
      title:           formData.title,
      date:            formData.date,
      time:            formData.time || null,
      type:            CATEGORY_TO_TYPE[category],
      company:         formData.company || null,
      manager:         formData.manager || null,
      client_name:     formData.client_name || null,
      client_phone:    formData.client_phone || null,
      category,
      management_item: managementItemValue || null,
      detail:          detail || null,
    };
    const { data, error } = await supabase.from('schedules').insert(payload).select().single();
    if (error) { alert(`저장 실패: ${error.message}`); setSaving(false); return; }
    if (data) setSchedules(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')));
    setSaving(false);
    setIsAddMode(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;
    await supabase.from('schedules').delete().eq('id', id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    setSelectedSchedule(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">스케줄 관리</h1>
            <p className="text-sm text-gray-500 mt-1">월별 일정을 관리합니다</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsAddMode(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm font-medium">
            <Plus className="w-4 h-4" />일정 추가
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="스케줄 명으로 검색..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          {searchTerm && (
            <div className="mt-4 max-h-60 overflow-auto">
              <div className="text-xs font-semibold text-gray-600 mb-2">검색 결과</div>
              <div className="space-y-2">
                {filteredSchedules.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">검색 결과가 없습니다</div>
                ) : filteredSchedules.map(s => (
                  <div key={s.id}
                    onClick={() => { setSelectedSchedule(s); setSearchTerm(''); }}
                    className={`px-3 py-2 rounded-lg border ${getScheduleColor(s)} cursor-pointer hover:shadow-md transition-shadow`}>
                    <div className="text-sm font-bold">{s.title}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {s.date} {s.time}
                      {s.company && <span className="ml-2">• {s.company}</span>}
                      {s.category && <span className="ml-2 font-semibold">[{s.category}]</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 캘린더 */}
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
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                    <div key={day} className={`text-center font-semibold text-sm py-2 ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-700'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const daySchedules = day ? getSchedulesForDate(day) : [];
                    const today = isToday(day);
                    return (
                      <div key={index} className={`min-h-[120px] border rounded-lg p-2 transition-colors ${
                        day ? (today ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300') : 'bg-gray-50 border-gray-100'
                      }`}>
                        {day && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${today ? 'text-blue-600' : 'text-gray-700'}`}>
                              {day}{today && <span className="ml-1 text-xs">(오늘)</span>}
                            </div>
                            <div className="space-y-1">
                              {daySchedules.map(s => (
                                <div key={s.id}
                                  onClick={() => setSelectedSchedule(s)}
                                  className={`text-xs px-2 py-1 rounded border ${getScheduleColor(s)} truncate cursor-pointer hover:shadow-sm transition-shadow`}
                                  title={`${s.time} - ${s.title}`}>
                                  <div className="font-medium">{s.time}</div>
                                  <div className="truncate">{s.title}</div>
                                  {s.category && <div className="text-[10px] font-bold opacity-60">{s.category}</div>}
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

          {/* 범례 */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="text-xs font-semibold text-gray-500">범례</span>
              {CATEGORIES.map(cat => (
                <div key={cat.key} className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded border ${cat.cal}`} />
                  <span className="text-xs text-gray-600">{cat.key} {cat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 상세 보기 모달 ── */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setSelectedSchedule(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-base font-bold text-gray-900">스케줄 상세 정보</h3>
              <button onClick={() => setSelectedSchedule(null)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">스케줄 명</label>
                <div className="text-base font-bold text-gray-900">{selectedSchedule.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">날짜</label><div className="text-sm text-gray-900">{selectedSchedule.date}</div></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">시간</label><div className="text-sm text-gray-900">{selectedSchedule.time ?? '-'}</div></div>
              </div>
              {selectedSchedule.category && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">카테고리</label>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getCatConfig(selectedSchedule.category).color}`}>
                      {getCatConfig(selectedSchedule.category).key} {getCatConfig(selectedSchedule.category).label}
                    </span>
                  </div>
                  {selectedSchedule.management_item && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">관리사항</label>
                      <div className="text-sm text-gray-800 font-medium">{selectedSchedule.management_item}</div>
                    </div>
                  )}
                </div>
              )}
              {selectedSchedule.company && (
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">담당업체</label><div className="text-sm text-gray-900">{selectedSchedule.company}</div></div>
              )}
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">담당자</label><div className="text-sm text-gray-900">{selectedSchedule.manager ?? '-'}</div></div>
              <div className="border-t border-gray-200 pt-3">
                <label className="block text-xs font-semibold text-gray-500 mb-2">고객 담당자 정보</label>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-gray-500">성함</span><span className="text-sm font-medium text-gray-900">{selectedSchedule.client_name ?? '-'}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-gray-500">연락처</span><span className="text-sm font-medium text-gray-900">{selectedSchedule.client_phone ?? '-'}</span></div>
                </div>
              </div>
              {selectedSchedule.detail && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">상세 내용</label>
                  <div className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2.5 whitespace-pre-wrap">{selectedSchedule.detail}</div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-2 shrink-0">
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

      {/* ── 일정 추가 모달 ── */}
      {isAddMode && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setIsAddMode(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-base font-bold text-gray-900">새 일정 추가</h3>
              <button onClick={() => setIsAddMode(false)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* 스케줄 명 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">스케줄 명 *</label>
                <input type="text" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* 날짜 + 시간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">날짜 *</label>
                  <input type="date" value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">시간 *</label>
                  <input type="time" value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* 담당업체 + 담당자 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">담당업체</label>
                  <input type="text" value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">담당자 *</label>
                  <input type="text" value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* 성함 + 연락처 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">고객 성함 *</label>
                  <input type="text" value={formData.client_name}
                    onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">고객 연락처 *</label>
                  <input type="text" value={formData.client_phone}
                    onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* 카테고리 드롭다운 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">카테고리 *</label>
                <select value={category}
                  onChange={e => { setCategory(e.target.value as CategoryKey | ''); setManagementItem(''); setDirectInput(''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- 카테고리 선택 --</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.key} {cat.label}</option>
                  ))}
                </select>
              </div>

              {/* 관리사항 (카테고리 선택 후 표시) */}
              {category && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">관리사항</label>
                  <div className="flex gap-2">
                    <select value={managementItem}
                      onChange={e => { setManagementItem(e.target.value); setDirectInput(''); }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- 선택 --</option>
                      {MANAGEMENT_ITEMS[category].map(item => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {managementItem === '직접 작성' && (
                      <input type="text" value={directInput}
                        onChange={e => setDirectInput(e.target.value)}
                        placeholder="직접 입력..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    )}
                  </div>
                </div>
              )}

              {/* 상세 내용 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">상세 내용</label>
                <textarea value={detail}
                  onChange={e => setDetail(e.target.value)}
                  rows={3}
                  placeholder="상세 내용을 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button onClick={handleSaveSchedule} disabled={saving}
                className="w-full px-4 py-2.5 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] text-sm font-semibold disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
