import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Plus, Calendar, Tag, LayoutGrid, List, ChevronRight, CheckCircle2, Circle, Trash2, Edit2, X, User, Phone, FileText, ExternalLink, Clock } from 'lucide-react';

type Priority = 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'completed';

type HistoryEntry = {
  date: string;
  action: string;
  user: string;
};

type Attachment = {
  name: string;
  url: string;
  type: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  category: string;
  tags: string[];
  createdAt: string;
  assignee: {
    name: string;
    contact: string;
  };
  history: HistoryEntry[];
  attachments: Attachment[];
  projectId?: string;
  projectName?: string;
};

const initialTasks: Task[] = [
  {
    id: '1',
    title: '삼성전자 미팅 준비',
    description: '견적서 및 제안서 최종 검토',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-04-07',
    category: '영업',
    tags: ['미팅', '견적서'],
    createdAt: '2026-04-05',
    assignee: {
      name: '김영업',
      contact: '010-1234-5678',
    },
    history: [
      { date: '2026-04-07 09:00', action: '할일 생성됨', user: '김영업' },
      { date: '2026-04-06 14:30', action: '견적서 초안 작성 완료', user: '김영업' },
      { date: '2026-04-05 11:00', action: '미팅 일정 확정', user: '박대리' },
    ],
    attachments: [
      { name: '삼성전자_견적서_v2.pdf', url: '#', type: 'pdf' },
      { name: '제안서_초안.docx', url: '#', type: 'docx' },
    ],
    projectId: 'samsung-2024-001',
    projectName: 'ERP 시스템 구축',
  },
  {
    id: '2',
    title: 'LG전자 계약서 작성',
    description: '법무팀 검토 후 최종안 작성',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-04-07',
    category: '계약',
    tags: ['계약', '법무검토'],
    createdAt: '2026-04-04',
    assignee: {
      name: '이과장',
      contact: '010-2345-6789',
    },
    history: [
      { date: '2026-04-07 10:15', action: '법무팀 검토 완료', user: '법무팀' },
      { date: '2026-04-06 16:00', action: '계약서 초안 전달', user: '이과장' },
      { date: '2026-04-04 09:00', action: '할일 생성됨', user: '이과장' },
    ],
    attachments: [
      { name: 'LG전자_계약서_최종본.pdf', url: '#', type: 'pdf' },
    ],
    projectId: 'lg-2024-005',
    projectName: 'CRM 플랫폼 개발',
  },
  {
    id: '3',
    title: '현대자동차 후속 미팅 일정 조율',
    description: '담당자와 4월 둘째주 일정 협의',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-09',
    category: '영업',
    tags: ['미팅', '일정조율'],
    createdAt: '2026-04-06',
    assignee: {
      name: '박대리',
      contact: '010-3456-7890',
    },
    history: [
      { date: '2026-04-06 15:30', action: '할일 생성됨', user: '박대리' },
    ],
    attachments: [],
    projectId: 'hyundai-2024-003',
    projectName: '클라우드 인프라 구축',
  },
  {
    id: '4',
    title: '주간 영업 보고서 작성',
    description: '이번주 영업 실적 및 다음주 계획',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-07',
    category: '보고',
    tags: ['보고서', '주간'],
    createdAt: '2026-04-07',
    assignee: {
      name: '최팀장',
      contact: '010-4567-8901',
    },
    history: [
      { date: '2026-04-07 08:00', action: '할일 생성됨', user: '최팀장' },
    ],
    attachments: [],
  },
  {
    id: '5',
    title: 'SK하이닉스 견적서 발송',
    description: '최종 단가 조정 후 견적서 이메일 발송',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-04-06',
    category: '영업',
    tags: ['견적서', '발송'],
    createdAt: '2026-04-03',
    assignee: {
      name: '정차장',
      contact: '010-5678-9012',
    },
    history: [
      { date: '2026-04-06 15:45', action: '할일 완료', user: '정차장' },
      { date: '2026-04-06 14:00', action: '견적서 발송 완료', user: '정차장' },
      { date: '2026-04-05 11:30', action: '최종 단가 조정', user: '정차장' },
      { date: '2026-04-03 09:00', action: '할일 생성됨', user: '정차장' },
    ],
    attachments: [
      { name: 'SK하이닉스_견적서_최종.pdf', url: '#', type: 'pdf' },
    ],
    projectId: 'sk-2024-007',
    projectName: '모바일 앱 개발',
  },
  {
    id: '6',
    title: '네이버 제안서 초안 작성',
    description: 'AI 솔루션 제안서 1차 드래프트',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-10',
    category: '영업',
    tags: ['제안서', 'AI'],
    createdAt: '2026-04-07',
    assignee: {
      name: '강사원',
      contact: '010-6789-0123',
    },
    history: [
      { date: '2026-04-07 10:00', action: '할일 생성됨', user: '강사원' },
    ],
    attachments: [],
    projectId: 'naver-2024-002',
    projectName: '데이터 분석 플랫폼 구축',
  },
  {
    id: '7',
    title: '카카오 기술미팅 참석',
    description: '기술팀과 협업 방안 논의',
    status: 'completed',
    priority: 'low',
    dueDate: '2026-04-05',
    category: '미팅',
    tags: ['기술', '협업'],
    createdAt: '2026-04-02',
    assignee: {
      name: '송부장',
      contact: '010-7890-1234',
    },
    history: [
      { date: '2026-04-05 16:00', action: '할일 완료', user: '송부장' },
      { date: '2026-04-05 14:00', action: '미팅 참석 완료', user: '송부장' },
      { date: '2026-04-02 09:00', action: '할일 생성됨', user: '송부장' },
    ],
    attachments: [
      { name: '카카오_미팅_회의록.docx', url: '#', type: 'docx' },
    ],
    projectId: 'kakao-2024-001',
    projectName: '전자결재 시스템 구축',
  },
  {
    id: '8',
    title: '영업팀 회의 준비',
    description: '월간 실적 및 2분기 목표 발표 자료',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-04-12',
    category: '내부',
    tags: ['회의', '발표'],
    createdAt: '2026-04-06',
    assignee: {
      name: '임과장',
      contact: '010-8901-2345',
    },
    history: [
      { date: '2026-04-06 13:00', action: '할일 생성됨', user: '임과장' },
    ],
    attachments: [],
  },
];

type ViewMode = 'card' | 'list';

export function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeSection, setActiveSection] = useState<'today' | 'inprogress' | 'completed'>('today');

  const categories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const todayTasks = filteredTasks.filter(task => {
    if (task.status === 'completed') return false;
    if (!task.dueDate) return false;
    const today = new Date('2026-04-07');
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  const incompleteTasks = filteredTasks.filter(t => t.status === 'todo' && !todayTasks.includes(t));
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const goToProject = (projectId?: string) => {
    if (projectId) {
      navigate('/sales', { state: { selectedProjectId: projectId } });
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'todo' ? 'completed' : 'todo' }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    if (window.confirm('이 할일을 삭제하시겠습니까?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
    }
  };

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return 'text-gray-500';
    const today = new Date('2026-04-07');
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600';
    if (diffDays === 0) return 'text-orange-600';
    if (diffDays <= 2) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newTask: Task = {
      id: editingTask?.id || Date.now().toString(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: editingTask?.status || 'todo',
      priority: formData.get('priority') as Priority,
      dueDate: formData.get('dueDate') as string || undefined,
      category: formData.get('category') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      createdAt: editingTask?.createdAt || new Date().toISOString().split('T')[0],
      assignee: {
        name: formData.get('assigneeName') as string || '미지정',
        contact: formData.get('assigneeContact') as string || '',
      },
      history: editingTask?.history || [
        { date: new Date().toISOString().slice(0, 16).replace('T', ' '), action: '할일 생성됨', user: formData.get('assigneeName') as string || '미지정' }
      ],
      attachments: editingTask?.attachments || [],
      projectId: formData.get('projectId') as string || undefined,
      projectName: formData.get('projectName') as string || undefined,
    };

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? newTask : t));
    } else {
      setTasks([newTask, ...tasks]);
    }

    setShowTaskModal(false);
    setEditingTask(null);
  };

  const TaskListItem = ({ task, isSelected }: { task: Task; isSelected: boolean }) => (
    <div
      onClick={() => setSelectedTask(task)}
      className={`border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        task.status === 'completed' ? 'opacity-60' : ''
      } ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskStatus(task.id);
          }}
          className="flex-shrink-0"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {task.projectName && (
            <div className="text-base font-semibold text-gray-800 mb-1.5">
              {task.projectName}
            </div>
          )}
          <h3 className={`text-sm text-gray-900 font-medium mb-1 ${task.status === 'completed' ? 'line-through' : ''}`}>
            {task.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getPriorityColor(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-xs ${getDueDateColor(task.dueDate)}`}>
                <Calendar className="w-3 h-3" />
                {task.dueDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const TaskDetailCard = ({ task }: { task: Task }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full overflow-y-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded text-sm border ${getPriorityColor(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded text-sm bg-gray-100 text-gray-700">
              {task.category}
            </span>
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 text-sm ${getDueDateColor(task.dueDate)}`}>
                <Calendar className="w-4 h-4" />
                {task.dueDate}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setEditingTask(task);
              setShowTaskModal(true);
            }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <Edit2 className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-2 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      {task.projectName && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">프로젝트</h3>
          <p className="text-base font-semibold text-gray-900">{task.projectName}</p>
        </div>
      )}

      {task.description && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">상세사항</h3>
          <p className="text-sm text-gray-600">{task.description}</p>
        </div>
      )}

      {task.tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">태그</h3>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">담당자 정보</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">이름:</span>
            <span className="text-gray-900 font-medium">{task.assignee.name}</span>
          </div>
          {task.assignee.contact && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">연락처:</span>
              <span className="text-gray-900 font-medium">{task.assignee.contact}</span>
            </div>
          )}
        </div>
      </div>

      {task.attachments.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">첨부파일</h3>
          <div className="space-y-2">
            {task.attachments.map((file, idx) => (
              <a
                key={idx}
                href={file.url}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-900 flex-1">{file.name}</span>
                <span className="text-xs text-gray-500 uppercase">{file.type}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {task.history.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">히스토리</h3>
          <div className="space-y-3">
            {task.history.map((entry, idx) => (
              <div key={idx} className="flex gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{entry.action}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {entry.date} · {entry.user}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {task.projectId && (
        <div>
          <button
            onClick={() => goToProject(task.projectId)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            관련 프로젝트로 가기
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">나의 할일</h1>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {todayTasks.length}
          </span>
          <span className="text-lg text-gray-700">
            개의 할일이 오늘 마감이에요
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa]">
        <div className="flex h-full">
          {/* Left Panel - Task List */}
          <div className="w-1/2 border-r border-gray-300 bg-white overflow-y-auto">
            {/* Search and Filters */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="할일 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? '전체 카테고리' : cat}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setShowTaskModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveSection('today')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeSection === 'today'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                오늘 마감 ({todayTasks.length})
              </button>
              <button
                onClick={() => setActiveSection('inprogress')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeSection === 'inprogress'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                진행중 ({incompleteTasks.length})
              </button>
              <button
                onClick={() => setActiveSection('completed')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeSection === 'completed'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                완료 ({completedTasks.length})
              </button>
            </div>

            {/* Task Lists */}
            <div>
              {activeSection === 'today' && todayTasks.length > 0 && (
                <div>
                  {todayTasks.map(task => (
                    <TaskListItem key={task.id} task={task} isSelected={selectedTask?.id === task.id} />
                  ))}
                </div>
              )}

              {activeSection === 'today' && todayTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  오늘 마감인 할일이 없습니다.
                </div>
              )}

              {activeSection === 'inprogress' && incompleteTasks.length > 0 && (
                <div>
                  {incompleteTasks.map(task => (
                    <TaskListItem key={task.id} task={task} isSelected={selectedTask?.id === task.id} />
                  ))}
                </div>
              )}

              {activeSection === 'inprogress' && incompleteTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  진행중인 할일이 없습니다.
                </div>
              )}

              {activeSection === 'completed' && completedTasks.length > 0 && (
                <div>
                  {completedTasks.map(task => (
                    <TaskListItem key={task.id} task={task} isSelected={selectedTask?.id === task.id} />
                  ))}
                </div>
              )}

              {activeSection === 'completed' && completedTasks.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  완료된 할일이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Task Detail */}
          <div className="w-1/2 bg-[#f5f6fa] p-6">
            {selectedTask ? (
              <TaskDetailCard task={selectedTask} />
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
                <textarea name="description" rows={3} defaultValue={editingTask?.description} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">우선순위 *</label>
                  <select name="priority" defaultValue={editingTask?.priority || 'medium'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">카테고리 *</label>
                  <input name="category" type="text" defaultValue={editingTask?.category} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">마감일</label>
                <input name="dueDate" type="date" defaultValue={editingTask?.dueDate} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">태그 (쉼표로 구분)</label>
                <input name="tags" type="text" defaultValue={editingTask?.tags.join(', ')} placeholder="예: 미팅, 견적서" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">담당자 이름</label>
                  <input name="assigneeName" type="text" defaultValue={editingTask?.assignee.name} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">담당자 연락처</label>
                  <input name="assigneeContact" type="text" defaultValue={editingTask?.assignee.contact} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">프로젝트 ID</label>
                  <input name="projectId" type="text" defaultValue={editingTask?.projectId} placeholder="예: samsung-2024-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">프로젝트 명</label>
                  <input name="projectName" type="text" defaultValue={editingTask?.projectName} placeholder="예: ERP 시스템 구축" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => { setShowTaskModal(false); setEditingTask(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568]">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
