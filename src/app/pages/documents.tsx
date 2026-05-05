import { useState, useEffect, useRef } from 'react';
import {
  Search, Upload, Download, Edit2, Trash2, X,
  FileText, FileCheck, ChevronDown, ChevronRight, Plus, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SalesDocument, SalesProject } from '@/lib/database.types';

// ── 상수 ────────────────────────────────────────────────────────
const DOC_TYPE = {
  quotation: {
    label: '견적서',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    addBtn: 'text-blue-600 border-blue-200 hover:bg-blue-50',
    sectionBg: 'bg-blue-50/40',
    icon: FileText,
    countBg: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  contract: {
    label: '계약서',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    addBtn: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50',
    sectionBg: 'bg-emerald-50/40',
    icon: FileCheck,
    countBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
} as const;
type DocTypeKey = keyof typeof DOC_TYPE;

const STAGE_BADGE: Record<string, string> = {
  '미팅 요청': 'bg-gray-100 text-gray-600',
  '미팅 진행': 'bg-blue-100 text-blue-600',
  '견적서 발송': 'bg-yellow-100 text-yellow-700',
  '가격 협의': 'bg-orange-100 text-orange-600',
  '계약 진행': 'bg-green-100 text-green-700',
};

// ── 유틸 ────────────────────────────────────────────────────────
function fmtSize(b: number | null) {
  if (!b) return '';
  if (b < 1024) return `${b}B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(0)}KB`;
  return `${(b / 1024 ** 2).toFixed(1)}MB`;
}

function fileEmoji(mime: string | null) {
  if (!mime) return '📄';
  if (mime.includes('pdf')) return '📕';
  if (mime.includes('word') || mime.includes('doc')) return '📝';
  if (mime.includes('excel') || mime.includes('sheet') || mime.includes('csv')) return '📊';
  if (mime.includes('image')) return '🖼️';
  if (mime.includes('zip') || mime.includes('compress')) return '🗜️';
  return '📄';
}

// ── 문서 섹션 서브컴포넌트 ────────────────────────────────────
function DocSection({
  type, docs, onAdd, onEdit, onDownload, onDelete,
}: {
  type: DocTypeKey;
  docs: SalesDocument[];
  onAdd: () => void;
  onEdit: (d: SalesDocument) => void;
  onDownload: (d: SalesDocument) => void;
  onDelete: (d: SalesDocument) => void;
}) {
  const cfg = DOC_TYPE[type];
  const Icon = cfg.icon;

  return (
    <div className="px-5 py-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          {docs.length > 0 && (
            <span className="text-xs text-gray-400">{docs.length}건</span>
          )}
        </div>
        <button
          onClick={onAdd}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border rounded-lg transition-colors bg-white ${cfg.addBtn}`}
        >
          <Plus className="w-3 h-3" />{cfg.label} 추가
        </button>
      </div>

      {/* 문서 목록 */}
      {docs.length === 0 ? (
        <div className="py-3 text-center text-xs text-gray-400 bg-white border border-dashed border-gray-200 rounded-lg">
          등록된 {cfg.label}가 없습니다
        </div>
      ) : (
        <div className="space-y-1.5">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all group"
            >
              <span className="text-xl shrink-0">{fileEmoji(doc.file_mime)}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 truncate">{doc.file_name}</span>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <ExternalLink className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {doc.quotation_date && (
                    <span className="text-[11px] text-gray-400">견적: <span className="text-gray-600">{doc.quotation_date}</span></span>
                  )}
                  {doc.contract_date && (
                    <span className="text-[11px] text-gray-400">계약: <span className="text-gray-600">{doc.contract_date}</span></span>
                  )}
                  {doc.file_size && (
                    <span className="text-[11px] text-gray-400">{fmtSize(doc.file_size)}</span>
                  )}
                  {doc.notes && (
                    <span className="text-[11px] text-gray-400 truncate max-w-[160px]" title={doc.notes}>
                      💬 {doc.notes}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-300">{doc.created_at.slice(0, 10)}</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onDownload(doc)} disabled={!doc.file_url}
                  title="다운로드"
                  className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30">
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                </button>
                <button onClick={() => onEdit(doc)} title="수정"
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button onClick={() => onDelete(doc)} title="삭제"
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export function Documents() {
  const [projects, setProjects] = useState<SalesProject[]>([]);
  const [docs, setDocs] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SalesDocument | null>(null);
  const [modalProjectId, setModalProjectId] = useState('');
  const [modalDocType, setModalDocType] = useState<DocTypeKey>('quotation');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    setFetchError(null);
    try {
      const [projRes, docsRes] = await Promise.all([
        supabase.from('sales_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
      ]);
      if (projRes.error) throw new Error(`영업프로젝트 조회 실패: ${projRes.error.message}`);
      if (docsRes.error) throw new Error(`문서 조회 실패: ${docsRes.error.message}`);
      setProjects(projRes.data ?? []);
      setDocs(docsRes.data ?? []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : '데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 프로젝트별 문서 그룹핑
  const docsByProject = docs.reduce<Record<string, SalesDocument[]>>((acc, d) => {
    const key = d.sales_project_id ?? '__none__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const filteredProjects = projects.filter(p => {
    const q = searchTerm.toLowerCase();
    return !q || p.project_name.toLowerCase().includes(q) || p.company_name.toLowerCase().includes(q);
  });

  const toggleProject = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(filteredProjects.map(p => p.id)));
  const collapseAll = () => setExpandedIds(new Set());

  // 모달 열기
  const openAdd = (projectId: string, docType: DocTypeKey) => {
    setEditingDoc(null);
    setSelectedFile(null);
    setModalProjectId(projectId);
    setModalDocType(docType);
    setShowModal(true);
  };

  const openEdit = (doc: SalesDocument) => {
    setEditingDoc(doc);
    setSelectedFile(null);
    setModalProjectId(doc.sales_project_id ?? '');
    setModalDocType(doc.doc_type as DocTypeKey);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingDoc(null); setSelectedFile(null); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setSelectedFile(f);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDoc && !selectedFile) { alert('파일을 선택해 주세요.'); return; }
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const projectId = modalProjectId || null;
    const project = projects.find(p => p.id === projectId);
    const projectName = project?.project_name ?? '';

    let fileUrl = editingDoc?.file_url ?? null;
    let filePath = editingDoc?.file_path ?? null;
    let fileName = editingDoc?.file_name ?? '';
    let fileSize = editingDoc?.file_size ?? null;
    let fileMime = editingDoc?.file_mime ?? null;

    if (selectedFile) {
      setUploading(true);
      const ext = selectedFile.name.includes('.') ? selectedFile.name.split('.').pop()!.replace(/[^a-zA-Z0-9]/g, '') : '';
      const storagePath = `${projectId ?? 'general'}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext ? '.' + ext : ''}`;
      const { error: upErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: false });
      if (upErr) {
        alert(`파일 업로드 실패: ${upErr.message}`);
        setSaving(false); setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
      fileUrl = urlData.publicUrl;
      filePath = storagePath;
      fileName = selectedFile.name;
      fileSize = selectedFile.size;
      fileMime = selectedFile.type || null;
      setUploading(false);
    }

    const payload = {
      sales_project_id: projectId,
      project_name: projectName,
      doc_type: modalDocType,
      file_name: fileName,
      file_path: filePath,
      file_url: fileUrl,
      file_size: fileSize,
      file_mime: fileMime,
      quotation_date: (fd.get('quotation_date') as string) || null,
      contract_date: (fd.get('contract_date') as string) || null,
      notes: (fd.get('notes') as string) || null,
    };

    if (editingDoc) {
      const { error } = await supabase.from('documents').update(payload).eq('id', editingDoc.id);
      if (error) { alert(`수정 실패: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('documents').insert(payload);
      if (error) { alert(`저장 실패: ${error.message}`); setSaving(false); return; }
    }

    // 신규 추가 시: 조건 충족 여부 확인 후 자동 등급·단계 변경
    let autoUpgradedName = '';
    if (!editingDoc && projectId) {
      const project = projects.find(p => p.id === projectId);
      if (
        project &&
        (project.stage === '미팅 요청' || project.stage === '미팅 진행') &&
        (project.issue_grade === 'D' || project.issue_grade === 'E')
      ) {
        const existingProjectDocs = docs.filter(d => d.sales_project_id === projectId);
        const hasQuotation = modalDocType === 'quotation' || existingProjectDocs.some(d => d.doc_type === 'quotation');
        const hasContract  = modalDocType === 'contract'  || existingProjectDocs.some(d => d.doc_type === 'contract');

        if (hasQuotation && hasContract) {
          const { error: upgradeErr } = await supabase
            .from('sales_projects')
            .update({ issue_grade: 'C', stage: '견적서 발송' })
            .eq('id', projectId);
          if (!upgradeErr) autoUpgradedName = project.project_name;
        }
      }
    }

    setSaving(false);
    closeModal();
    await fetchAll();

    if (autoUpgradedName) {
      alert(`"${autoUpgradedName}" 프로젝트에 견적서와 계약서가 모두 등록되어\n안건 등급이 C등급으로, 영업 단계가 "견적서 발송"으로 자동 변경되었습니다.`);
    }
  };

  const handleDownload = (doc: SalesDocument) => {
    if (!doc.file_url) { alert('다운로드 가능한 파일이 없습니다.'); return; }
    const a = window.document.createElement('a');
    a.href = doc.file_url;
    a.download = doc.file_name;
    a.target = '_blank';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handleDelete = async (doc: SalesDocument) => {
    if (!window.confirm(`"${doc.file_name}"을(를) 삭제하시겠습니까?`)) return;
    if (doc.file_path) await supabase.storage.from('documents').remove([doc.file_path]);
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) { alert(`삭제 실패: ${error.message}`); return; }
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  // 모달에서 표시할 프로젝트 이름
  const modalProject = projects.find(p => p.id === modalProjectId);

  return (
    <div className="flex flex-col h-full bg-[#f5f6fa]">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">견적서 / 계약서 관리</h1>
        <p className="text-sm text-gray-400 mt-0.5">영업프로젝트별 문서를 관리합니다</p>
      </div>

      <div className="flex-1 overflow-auto p-8">

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">전체 문서</div>
              <div className="text-2xl font-black text-gray-900">{docs.length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">견적서</div>
              <div className="text-2xl font-black text-blue-600">{docs.filter(d => d.doc_type === 'quotation').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">계약서</div>
              <div className="text-2xl font-black text-emerald-600">{docs.filter(d => d.doc_type === 'contract').length}<span className="text-sm font-normal text-gray-400 ml-1">건</span></div>
            </div>
          </div>
        </div>

        {/* 검색 + 전체 펼치기/접기 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="영업프로젝트명 또는 기업명으로 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={expandAll}
            className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap">
            전체 펼치기
          </button>
          <button onClick={collapseAll}
            className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap">
            전체 접기
          </button>
        </div>

        {/* 프로젝트 아코디언 리스트 */}
        {loading ? (
          <div className="py-24 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : fetchError ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="text-sm font-semibold text-red-500">{fetchError}</div>
            <button onClick={fetchAll} className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-600">
              다시 시도
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-24 text-center text-sm text-gray-400">
            {searchTerm ? '검색 결과가 없습니다' : '등록된 영업프로젝트가 없습니다'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map(project => {
              const projectDocs = docsByProject[project.id] ?? [];
              const quotDocs = projectDocs.filter(d => d.doc_type === 'quotation');
              const contDocs = projectDocs.filter(d => d.doc_type === 'contract');
              const isExpanded = expandedIds.has(project.id);

              return (
                <div key={project.id}
                  className={`bg-white rounded-xl shadow-sm border transition-all ${isExpanded ? 'border-blue-200 shadow-md' : 'border-gray-200'}`}>

                  {/* 프로젝트 행 (클릭으로 토글) */}
                  <div
                    onClick={() => toggleProject(project.id)}
                    className={`flex items-center gap-4 px-5 py-4 cursor-pointer select-none transition-colors ${isExpanded ? 'bg-blue-50/30 rounded-t-xl' : 'hover:bg-gray-50 rounded-xl'}`}
                  >
                    {/* 펼치기 아이콘 */}
                    <div className={`shrink-0 transition-colors ${isExpanded ? 'text-blue-500' : 'text-gray-400'}`}>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                      }
                    </div>

                    {/* 프로젝트 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold truncate ${isExpanded ? 'text-blue-700' : 'text-gray-900'}`}>
                          {project.project_name}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STAGE_BADGE[project.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                          {project.stage}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{project.company_name}</div>
                    </div>

                    {/* 문서 카운트 배지 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        quotDocs.length > 0 ? DOC_TYPE.quotation.countBg : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        <FileText className="w-3 h-3" />
                        <span>견적 {quotDocs.length}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        contDocs.length > 0 ? DOC_TYPE.contract.countBg : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        <FileCheck className="w-3 h-3" />
                        <span>계약 {contDocs.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* 확장 영역 */}
                  {isExpanded && (
                    <div className="border-t border-blue-100">
                      {/* 견적서 섹션 */}
                      <DocSection
                        type="quotation"
                        docs={quotDocs}
                        onAdd={() => openAdd(project.id, 'quotation')}
                        onEdit={openEdit}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                      />
                      {/* 구분선 */}
                      <div className="mx-5 border-t border-dashed border-gray-200" />
                      {/* 계약서 섹션 */}
                      <DocSection
                        type="contract"
                        docs={contDocs}
                        onAdd={() => openAdd(project.id, 'contract')}
                        onEdit={openEdit}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 업로드 / 수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingDoc ? '문서 정보 수정' : `${DOC_TYPE[modalDocType].label} 업로드`}
                </h3>
                {modalProject && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {modalProject.project_name} · {modalProject.company_name}
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto flex-1">
              <div className="px-6 py-5 space-y-5">

                {/* 문서 유형 선택 (토글) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">문서 유형</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['quotation', 'contract'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setModalDocType(t)}
                        className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                          modalDocType === t
                            ? t === 'quotation'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                        }`}>
                        {DOC_TYPE[t].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 파일 영역 */}
                {!editingDoc ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">파일 선택 *</label>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none ${
                        dragOver        ? 'border-blue-400 bg-blue-50'
                        : selectedFile  ? 'border-emerald-400 bg-emerald-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}>
                      <input ref={fileRef} type="file" className="hidden"
                        onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                      {selectedFile ? (
                        <div>
                          <div className="text-3xl mb-2">{fileEmoji(selectedFile.type)}</div>
                          <div className="text-sm font-semibold text-emerald-700 truncate px-2">{selectedFile.name}</div>
                          <div className="text-xs text-gray-400 mt-1">{fmtSize(selectedFile.size)}</div>
                          <button type="button"
                            onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                            className="mt-2 text-xs text-red-400 hover:text-red-600">
                            파일 취소
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <div className="text-sm text-gray-500 font-medium">드래그하거나 클릭하여 파일 선택</div>
                          <div className="text-xs text-gray-400 mt-1">PDF, Word, Excel, 이미지 등</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-2xl">{fileEmoji(editingDoc.file_mime)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-700 truncate">{editingDoc.file_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{fmtSize(editingDoc.file_size)}</div>
                    </div>
                    {editingDoc.file_url && (
                      <a href={editingDoc.file_url} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-blue-500 hover:text-blue-700 shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* 날짜 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">견적 발송일</label>
                    <input name="quotation_date" type="date"
                      defaultValue={editingDoc?.quotation_date ?? ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">계약 체결일</label>
                    <input name="contract_date" type="date"
                      defaultValue={editingDoc?.contract_date ?? ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">메모</label>
                  <textarea name="notes" rows={2}
                    defaultValue={editingDoc?.notes ?? ''}
                    placeholder="버전 정보, 수정 이력 등"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  취소
                </button>
                <button type="submit" disabled={saving || uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-50">
                  {uploading
                    ? <><Upload className="w-4 h-4 animate-bounce" />업로드 중...</>
                    : saving ? '저장 중...'
                    : editingDoc ? '수정 완료'
                    : <><Upload className="w-4 h-4" />업로드</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
