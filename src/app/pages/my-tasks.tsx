import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Calendar, Tag, Trash2, Edit2, X, User, Phone, FileText, ExternalLink, Clock } from 'lucide-react';
import { AiButton } from '@/app/components/ai-button';
import { supabase } from '@/lib/supabase';
import type { Task, TaskHistory, TaskAttachment, TaskPriority, TaskStatus, Schedule } from '@/lib/database.types';

const todayStr = new Date().toISOString().slice(0, 10);

function getPriorityColor(p: TaskPriority) {
  if (p === 'high')   return 'text-red-600 bg-red-50 border-red-200';
  if (p === 'medium') return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-blue-600 bg-blue-50 border-blue-200';
}
function getPriorityLabel(p: TaskPriority) {
  if (p === 'high')   return '높음';
  if (p === 'medium') return '보통';
  return '낮음';
}
function getDueDateColor(d: string | null) {
  if (!d) return 'text-gray-500';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((new Date(d).getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return 'text-red-600';
  if (diff === 0) return 'text-orange-600';
  if (diff <= 2) return 'text-yellow-600';
  return 'text-gray-500';
}

export function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [schedules, setSchedules]       = useState<Schedule[]>([]);
  const [allTags, setAllTags]           = useState<Record<string, string[]>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory]   = useState<TaskHistory[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showTaskModal, setShowTaskModal]   = useState(false);
  const [editingTask, setEditingTask]       = useState<Task | null>(null);
  const [saving, setSaving]                 = useState(false);
  const [draggingId, setDraggingId]         = useState<string | null>(null);
  const [dragOverCol, setDragOverCol]       = useState<string | null>(null);
  const [taskTitle, setTaskTitle]           = useState('');
  const [taskDesc, setTaskDesc]             = useState('');

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (showTaskModal) {
      setTaskTitle(editingTask?.title ?? '');
      setTaskDesc(editingTask?.description ?? '');
    }
  }, [showTaskModal]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: taskData }, { data: tagData }, { data: schedData }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('task_tags').select('*'),
      supabase.from('schedules').select('*').order('time'),
    ]);
    setTasks(taskData ?? []);
    setSchedules(schedData ?? []);
    const grouped: Record<string, string[]> = {};
    (tagData ?? []).forEach(t => { grouped[t.task_id] = [...(grouped[t.task_id] ?? []), t.tag]; });
    setAllTags(grouped);
    setLoading(false);
  }

  async function fetchTaskDetail(taskId: string) {
    const [{ data: hist }, { data: att }] = await Promise.all([
      supabase.from('task_history').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
      supabase.from('task_attachments').select('*').eq('task_id', taskId),
    ]);
    setTaskHistory(hist ?? []);
    setTaskAttachments(att ?? []);
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    fetchTaskDetail(task.id);
  };

  const updateStatus = async (taskId: string, newStatus: TaskStatus) => {
    const { data } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId).select().single();
    if (data) {
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
      if (selectedTask?.id === taskId) setSelectedTask(data);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('이 할일을 삭제하시겠습니까?')) return;
    await supabase.from('tasks').delete().eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const tagsInput = (fd.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      title:            fd.get('title') as string,
      description:      fd.get('description') as string || null,
      status:           (editingTask?.status ?? 'todo') as TaskStatus,
      priority:         fd.get('priority') as TaskPriority,
      due_date:         fd.get('due_date') as string || null,
      category:         fd.get('category') as string || null,
      assignee_name:    fd.get('assignee_name') as string || null,
      assignee_contact: fd.get('assignee_contact') as string || null,
      sales_project_id: null as string | null,
      project_name:     fd.get('project_name') as string || null,
    };
    let savedTask: Task | null = null;
    if (editingTask) {
      const { data } = await supabase.from('tasks').update(payload).eq('id', editingTask.id).select().single();
      savedTask = data;
      if (data) setTasks(prev => prev.map(t => t.id === editingTask.id ? data : t));
    } else {
      const { data } = await supabase.from('tasks').insert(payload).select().single();
      savedTask = data;
      if (data) {
        setTasks(prev => [data, ...prev]);
        await supabase.from('task_history').insert({ task_id: data.id, date: new Date().toISOString().slice(0, 16).replace('T', ' '), action: '할일 생성됨', user_name: payload.assignee_name });
      }
    }
    if (savedTask) {
      await supabase.from('task_tags').delete().eq('task_id', savedTask.id);
      if (tagsInput.length > 0) await supabase.from('task_tags').insert(tagsInput.map(tag => ({ task_id: savedTask!.id, tag })));
      setAllTags(prev => ({ ...prev, [savedTask!.id]: tagsInput }));
      if (selectedTask?.id === savedTask.id) setSelectedTask(savedTask);
    }
    setSaving(false);
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category).filter(Boolean) as string[]))];
  const filteredTasks = tasks.filter(t => {
    const q = searchTerm.toLowerCase();
    return (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)) &&
      (filterCategory === 'all' || t.category === filterCategory);
  });

  const sortTasks = (list: Task[]) => [...list].sort((a, b) => {
    const rank = (t: Task) => t.due_date === todayStr ? 0 : (t.due_date && t.due_date < todayStr) ? 1 : t.due_date ? 2 : 3;
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 1) return b.due_date!.localeCompare(a.due_date!); // 지연: 최근순
    if (ra === 2) return a.due_date!.localeCompare(b.due_date!); // 미래: 가까운순
    return 0;
  });

  const todoTasks      = sortTasks(filteredTasks.filter(t => t.status === 'todo'));
  const inProgTasks    = sortTasks(filteredTasks.filter(t => t.status === 'in_progress'));
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const todaySchedules = schedules.filter(s => s.date === todayStr);

  const COLUMNS = [
    { key: 'todo',        label: '해야할 일', tasks: todoTasks,      bg: 'bg-blue-50/60 border-blue-200',   hdr: 'bg-blue-100 text-blue-800'   },
    { key: 'in_progress', label: '진행 중',   tasks: inProgTasks,    bg: 'bg-amber-50/60 border-amber-200', hdr: 'bg-amber-100 text-amber-800' },
    { key: 'completed',   label: '완료',      tasks: completedTasks, bg: 'bg-green-50/60 border-green-200', hdr: 'bg-green-100 text-green-800' },
  ] as const;

  // 칸반 카드 (클로저로 상위 상태 접근)
  const KanbanCard = ({ task }: { task: Task }) => {
    const isDueToday = task.due_date === todayStr && task.status !== 'completed';
    const isOverdue  = !!task.due_date && task.due_date < todayStr && task.status !== 'completed';
    const tags = allTags[task.id] ?? [];
    return (
      <div
        onClick={() => handleSelectTask(task)}
        draggable
        onDragStart={e => { e.stopPropagation(); setDraggingId(task.id); }}
        onDragEnd={() => setDraggingId(null)}
        className={`bg-white rounded-xl border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggingId === task.id ? 'opacity-40' : ''}`}>

        {/* 행1: 우선순위·뱃지 왼쪽 | 드롭다운 오른쪽 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityColor(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
            {isDueToday && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">D-Day</span>}
            {isOverdue  && <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-300">날짜 지연</span>}
          </div>
          <select
            value={task.status}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); updateStatus(task.id, e.target.value as TaskStatus); }}
            className="shrink-0 text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none text-gray-600">
            <option value="todo">해야할일</option>
            <option value="in_progress">진행 중</option>
            <option value="completed">완료</option>
          </select>
        </div>

        {task.project_name && <div className="text-xs text-gray-400 mb-0.5 truncate">{task.project_name}</div>}

        {/* 행2: 제목 왼쪽 | 날짜·카테고리 오른쪽 */}
        <div className="flex items-start justify-between gap-2">
          <div className={`text-sm font-semibold flex-1 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {task.due_date && (
              <span className={`flex items-center gap-0.5 text-xs ${getDueDateColor(task.due_date)}`}>
                <Calendar className="w-3 h-3" />{task.due_date}
              </span>
            )}
            {task.category && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{task.category}</span>
            )}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-b border-gray-200 px-8 py-7 shrink-0">
        <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-2">MY TASKS</p>
        <h1 className="text-2xl font-bold text-gray-800">
          안녕하세요 <span className="text-violet-600">양현구</span>님 👋
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          오늘 해야할 일은 <span className="font-bold text-blue-600">{todoTasks.length}개</span>,
          아직 작업 중인 일은 <span className="font-bold text-amber-500">{inProgTasks.length}개</span>에요.
          아래 나의 칸반보드를 확인하세요.
        </p>
      </div>

      {/* 오늘 일정 + 할일 추가 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
        <div className="mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">오늘 일정</span>
        </div>
        {todaySchedules.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {todaySchedules.map(s => (
              <div key={s.id} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                {s.time && <span className="text-xs font-bold text-indigo-700">{s.time}</span>}
                <span className="text-xs font-semibold text-indigo-900">{s.title}</span>
                {s.company && <span className="text-xs text-indigo-500">· {s.company}</span>}
                {s.category && <span className="text-xs font-bold text-indigo-400">[{s.category}]</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">오늘 예정된 일정이 없습니다.</p>
        )}
      </div>

      {/* 검색/필터 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="할일 검색" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? '전체 카테고리' : cat}</option>)}
        </select>
        <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] text-sm font-medium whitespace-nowrap">
          <Plus className="w-4 h-4" />할일 추가
        </button>
      </div>

      {/* 칸반 보드 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">데이터를 불러오는 중...</div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-hidden p-5 bg-[#f5f6fa]">
          {COLUMNS.map(col => (
            <div key={col.key}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
              onDrop={e => { e.preventDefault(); if (draggingId) updateStatus(draggingId, col.key as TaskStatus); setDraggingId(null); setDragOverCol(null); }}
              className={`flex-1 flex flex-col rounded-xl border ${col.bg} overflow-hidden min-w-0 transition-all ${dragOverCol === col.key ? 'ring-2 ring-blue-400 scale-[1.01]' : ''}`}>
              <div className={`px-4 py-3 shrink-0 flex items-center justify-between ${col.hdr} rounded-t-xl`}>
                <span className="text-sm font-bold">{col.label}</span>
                <span className="text-xs font-semibold bg-white/60 px-2 py-0.5 rounded-full">{col.tasks.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {col.tasks.length === 0
                  ? <div className="text-xs text-gray-400 text-center py-8">항목 없음</div>
                  : col.tasks.map(task => <KanbanCard key={task.id} task={task} />)
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 팝업 */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-base font-bold text-gray-900 truncate pr-4">{selectedTask.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditingTask(selectedTask); setShowTaskModal(true); setSelectedTask(null); }}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => deleteTask(selectedTask.id)}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                <button onClick={() => setSelectedTask(null)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors ml-1">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded text-sm border ${getPriorityColor(selectedTask.priority)}`}>
                  {getPriorityLabel(selectedTask.priority)}
                </span>
                {selectedTask.category && (
                  <span className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-700">{selectedTask.category}</span>
                )}
                {selectedTask.due_date && (
                  <span className={`flex items-center gap-1 text-sm ${getDueDateColor(selectedTask.due_date)}`}>
                    <Calendar className="w-4 h-4" />{selectedTask.due_date}
                  </span>
                )}
              </div>
              {selectedTask.project_name && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">프로젝트</label>
                  <div className="text-sm font-semibold text-gray-900">{selectedTask.project_name}</div>
                </div>
              )}
              {selectedTask.description && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">상세사항</label>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTask.description}</div>
                </div>
              )}
              {(allTags[selectedTask.id] ?? []).length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">태그</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(allTags[selectedTask.id] ?? []).map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 flex items-center gap-1">
                        <Tag className="w-3 h-3" />{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(selectedTask.assignee_name || selectedTask.assignee_contact) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">담당자 정보</label>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    {selectedTask.assignee_name && (
                      <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400" />{selectedTask.assignee_name}</div>
                    )}
                    {selectedTask.assignee_contact && (
                      <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" />{selectedTask.assignee_contact}</div>
                    )}
                  </div>
                </div>
              )}
              {taskAttachments.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">첨부파일</label>
                  <div className="space-y-1.5">
                    {taskAttachments.map(file => (
                      <a key={file.id} href={file.url ?? '#'} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-900 flex-1">{file.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {taskHistory.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">히스토리</label>
                  <div className="space-y-2">
                    {taskHistory.map(entry => (
                      <div key={entry.id} className="flex gap-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm text-gray-900">{entry.action}</div>
                          <div className="text-xs text-gray-500">{entry.date}{entry.user_name ? ` · ${entry.user_name}` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedTask.sales_project_id && (
                <button onClick={() => navigate('/sales')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] text-sm font-medium">
                  <ExternalLink className="w-4 h-4" />관련 프로젝트로 가기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 할일 추가/수정 모달 */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingTask ? '할일 수정' : '할일 추가'}</h2>
              <button onClick={() => { setShowTaskModal(false); setEditingTask(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">제목 *</label>
                <input name="title" type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-700">설명</label>
                  <AiButton
                    getPrompt={() => `할일 "${taskTitle}" 에 대한 상세 설명을 2-3문장으로 작성해줘. 목적, 처리 방법, 주의사항 중심으로. 한국어, 간결하게.`}
                    onResult={setTaskDesc}
                  />
                </div>
                <textarea name="description" rows={3} value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">우선순위 *</label>
                  <select name="priority" defaultValue={editingTask?.priority ?? 'medium'} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">카테고리</label>
                  <input name="category" type="text" defaultValue={editingTask?.category ?? ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">마감일</label>
                <input name="due_date" type="date" defaultValue={editingTask?.due_date ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">태그 (쉼표로 구분)</label>
                <input name="tags" type="text" defaultValue={(allTags[editingTask?.id ?? ''] ?? []).join(', ')} placeholder="예: 미팅, 견적서"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">담당자 이름</label>
                  <input name="assignee_name" type="text" defaultValue={editingTask?.assignee_name ?? ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">담당자 연락처</label>
                  <input name="assignee_contact" type="text" defaultValue={editingTask?.assignee_contact ?? ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">프로젝트 명</label>
                <input name="project_name" type="text" defaultValue={editingTask?.project_name ?? ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">취소</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] text-sm disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
