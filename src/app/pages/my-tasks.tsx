import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Calendar, Tag, CheckCircle2, Circle, Trash2, Edit2, X, User, Phone, FileText, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Task, TaskTag, TaskHistory, TaskAttachment, TaskPriority, TaskStatus } from '@/lib/database.types';

function getPriorityColor(priority: TaskPriority) {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

function getPriorityLabel(priority: TaskPriority) {
  switch (priority) {
    case 'high': return '높음';
    case 'medium': return '보통';
    case 'low': return '낮음';
  }
}

function getDueDateColor(dueDate: string | null) {
  if (!dueDate) return 'text-gray-500';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-600';
  if (diffDays === 0) return 'text-orange-600';
  if (diffDays <= 2) return 'text-yellow-600';
  return 'text-gray-600';
}

function isToday(dueDate: string | null) {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  return (
    today.getFullYear() === due.getFullYear() &&
    today.getMonth() === due.getMonth() &&
    today.getDate() === due.getDate()
  );
}

export function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTags, setAllTags] = useState<Record<string, string[]>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeSection, setActiveSection] = useState<'today' | 'inprogress' | 'completed'>('today');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: taskData }, { data: tagData }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('task_tags').select('*'),
    ]);
    setTasks(taskData ?? []);
    const grouped: Record<string, string[]> = {};
    (tagData ?? []).forEach(t => {
      grouped[t.task_id] = [...(grouped[t.task_id] ?? []), t.tag];
    });
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

  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category).filter(Boolean) as string[]))];

  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'all' || task.category === filterCategory;
    return matchSearch && matchCat;
  });

  const todayTasks = filteredTasks.filter(t => t.status !== 'completed' && isToday(t.due_date));
  const incompleteTasks = filteredTasks.filter(t => t.status === 'todo' && !isToday(t.due_date));
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const toggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'todo' ? 'completed' : 'todo';
    const { data } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id).select().single();
    if (data) {
      setTasks(tasks.map(t => t.id === task.id ? data : t));
      if (selectedTask?.id === task.id) setSelectedTask(data);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('이 할일을 삭제하시겠습니까?')) return;
    await supabase.from('tasks').delete().eq('id', taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const tagsInput = (fd.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      title: fd.get('title') as string,
      description: fd.get('description') as string || null,
      status: (editingTask?.status ?? 'todo') as TaskStatus,
      priority: fd.get('priority') as TaskPriority,
      due_date: fd.get('due_date') as string || null,
      category: fd.get('category') as string || null,
      assignee_name: fd.get('assignee_name') as string || null,
      assignee_contact: fd.get('assignee_contact') as string || null,
      sales_project_id: null as string | null,
      project_name: fd.get('project_name') as string || null,
    };

    let savedTask: Task | null = null;
    if (editingTask) {
      const { data } = await supabase.from('tasks').update(payload).eq('id', editingTask.id).select().single();
      savedTask = data;
      if (data) setTasks(tasks.map(t => t.id === editingTask.id ? data : t));
    } else {
      const { data } = await supabase.from('tasks').insert(payload).select().single();
      savedTask = data;
      if (data) {
        setTasks([data, ...tasks]);
        await supabase.from('task_history').insert({ task_id: data.id, date: new Date().toISOString().slice(0, 16).replace('T', ' '), action: '할일 생성됨', user_name: payload.assignee_name });
      }
    }

    if (savedTask && tagsInput.length > 0) {
      await supabase.from('task_tags').delete().eq('task_id', savedTask.id);
      await supabase.from('task_tags').insert(tagsInput.map(tag => ({ task_id: savedTask!.id, tag })));
      setAllTags(prev => ({ ...prev, [savedTask!.id]: tagsInput }));
    } else if (savedTask) {
      await supabase.from('task_tags').delete().eq('task_id', savedTask.id);
      setAllTags(prev => ({ ...prev, [savedTask!.id]: [] }));
    }

    if (selectedTask?.id === savedTask?.id && savedTask) setSelectedTask(savedTask);

    setSaving(false);
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const TaskListItem = ({ task }: { task: Task }) => {
    const isSelected = selectedTask?.id === task.id;
    const tags = allTags[task.id] ?? [];
    return (
      <div onClick={() => handleSelectTask(task)}
        className={`border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${task.status === 'completed' ? 'opacity-60' : ''} ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}>
        <div className="flex items-center gap-3">
          <button onClick={e => { e.stopPropagation(); toggleStatus(task); }} className="flex-shrink-0">
            {task.status === 'completed'
              ? <CheckCircle2 className="w-5 h-5 text-green-600" />
              : <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />}
          </button>
          <div className="flex-1 min-w-0">
            {task.project_name && <div className="text-base font-semibold text-gray-800 mb-1.5">{task.project_name}</div>}
            <h3 className={`text-sm text-gray-900 font-medium mb-1 ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              {task.due_date && (
                <span className={`inline-flex items-center gap-1 text-xs ${getDueDateColor(task.due_date)}`}>
                  <Calendar className="w-3 h-3" />{task.due_date}
                </span>
              )}
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                  <Tag className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">나의 할일</h1>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{todayTasks.length}</span>
          <span className="text-lg text-gray-700">개의 할일이 오늘 마감이에요</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f5f6fa]">
        <div className="flex h-full">
          {/* Left Panel */}
          <div className="w-1/2 border-r border-gray-300 bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="할일 검색" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? '전체 카테고리' : cat}</option>)}
                  </select>
                  <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] text-sm whitespace-nowrap">
                    <Plus className="w-4 h-4" />추가
                  </button>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-200">
              {(['today', 'inprogress', 'completed'] as const).map(section => {
                const count = section === 'today' ? todayTasks.length : section === 'inprogress' ? incompleteTasks.length : completedTasks.length;
                const label = section === 'today' ? '오늘 마감' : section === 'inprogress' ? '진행중' : '완료';
                return (
                  <button key={section} onClick={() => setActiveSection(section)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeSection === section ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">데이터를 불러오는 중...</div>
            ) : (
              <div>
                {activeSection === 'today' && (todayTasks.length === 0
                  ? <div className="p-8 text-center text-gray-500">오늘 마감인 할일이 없습니다.</div>
                  : todayTasks.map(t => <TaskListItem key={t.id} task={t} />))}
                {activeSection === 'inprogress' && (incompleteTasks.length === 0
                  ? <div className="p-8 text-center text-gray-500">진행중인 할일이 없습니다.</div>
                  : incompleteTasks.map(t => <TaskListItem key={t.id} task={t} />))}
                {activeSection === 'completed' && (completedTasks.length === 0
                  ? <div className="p-8 text-center text-gray-500">완료된 할일이 없습니다.</div>
                  : completedTasks.map(t => <TaskListItem key={t.id} task={t} />))}
              </div>
            )}
          </div>

          {/* Right Panel - Task Detail */}
          <div className="w-1/2 bg-[#f5f6fa] p-6 overflow-y-auto">
            {selectedTask ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded text-sm border ${getPriorityColor(selectedTask.priority)}`}>
                        {getPriorityLabel(selectedTask.priority)}
                      </span>
                      {selectedTask.category && (
                        <span className="inline-flex items-center px-3 py-1 rounded text-sm bg-gray-100 text-gray-700">{selectedTask.category}</span>
                      )}
                      {selectedTask.due_date && (
                        <span className={`inline-flex items-center gap-1 text-sm ${getDueDateColor(selectedTask.due_date)}`}>
                          <Calendar className="w-4 h-4" />{selectedTask.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingTask(selectedTask); setShowTaskModal(true); }} className="p-2 hover:bg-gray-100 rounded transition-colors">
                      <Edit2 className="w-5 h-5 text-gray-500" />
                    </button>
                    <button onClick={() => deleteTask(selectedTask.id)} className="p-2 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                {selectedTask.project_name && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">프로젝트</h3>
                    <p className="text-base font-semibold text-gray-900">{selectedTask.project_name}</p>
                  </div>
                )}

                {selectedTask.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">상세사항</h3>
                    <p className="text-sm text-gray-600">{selectedTask.description}</p>
                  </div>
                )}

                {(allTags[selectedTask.id] ?? []).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">태그</h3>
                    <div className="flex flex-wrap gap-2">
                      {(allTags[selectedTask.id] ?? []).map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                          <Tag className="w-3 h-3" />{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedTask.assignee_name || selectedTask.assignee_contact) && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">담당자 정보</h3>
                    <div className="space-y-2">
                      {selectedTask.assignee_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">이름:</span>
                          <span className="text-gray-900 font-medium">{selectedTask.assignee_name}</span>
                        </div>
                      )}
                      {selectedTask.assignee_contact && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">연락처:</span>
                          <span className="text-gray-900 font-medium">{selectedTask.assignee_contact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {taskAttachments.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">첨부파일</h3>
                    <div className="space-y-2">
                      {taskAttachments.map((file) => (
                        <a key={file.id} href={file.url ?? '#'} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-900 flex-1">{file.name}</span>
                          {file.type && <span className="text-xs text-gray-500 uppercase">{file.type}</span>}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {taskHistory.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">히스토리</h3>
                    <div className="space-y-3">
                      {taskHistory.map((entry) => (
                        <div key={entry.id} className="flex gap-3">
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{entry.action}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{entry.date}{entry.user_name ? ` · ${entry.user_name}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.sales_project_id && (
                  <button onClick={() => navigate('/sales')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all">
                    <ExternalLink className="w-4 h-4" />관련 프로젝트로 가기
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                할일을 선택하면 상세 정보가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{editingTask ? '할일 수정' : '할일 추가'}</h2>
              <button onClick={() => { setShowTaskModal(false); setEditingTask(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">제목 *</label>
                <input name="title" type="text" defaultValue={editingTask?.title} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">설명</label>
                <textarea name="description" rows={3} defaultValue={editingTask?.description ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">우선순위 *</label>
                  <select name="priority" defaultValue={editingTask?.priority ?? 'medium'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">카테고리</label>
                  <input name="category" type="text" defaultValue={editingTask?.category ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">마감일</label>
                <input name="due_date" type="date" defaultValue={editingTask?.due_date ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">태그 (쉼표로 구분)</label>
                <input name="tags" type="text" defaultValue={(allTags[editingTask?.id ?? ''] ?? []).join(', ')} placeholder="예: 미팅, 견적서" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">담당자 이름</label>
                  <input name="assignee_name" type="text" defaultValue={editingTask?.assignee_name ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">담당자 연락처</label>
                  <input name="assignee_contact" type="text" defaultValue={editingTask?.assignee_contact ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">프로젝트 명</label>
                <input name="project_name" type="text" defaultValue={editingTask?.project_name ?? ''} placeholder="예: ERP 시스템 구축" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => { setShowTaskModal(false); setEditingTask(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
