import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Plus, Phone, Mail, ChevronLeft, ChevronRight, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Company, CompanyManager, CompanyRank, CompanyStatus } from '@/lib/database.types';

const ITEMS_PER_PAGE = 10;

function getStatusColor(status: CompanyStatus) {
  switch (status) {
    case '거래중': return 'bg-green-100 text-green-700';
    case '협의중': return 'bg-yellow-100 text-yellow-700';
    case '보류': return 'bg-gray-100 text-gray-600';
  }
}

function rankToLabel(score: number): string {
  if (score >= 5) return 'S';
  if (score >= 4) return 'A';
  if (score >= 3) return 'B';
  if (score >= 2) return 'C';
  if (score >= 1) return 'D';
  return 'E';
}

function getRankBorderColor(score: number): string {
  if (score >= 5) return 'border-purple-500 text-purple-700';
  if (score >= 4) return 'border-red-500 text-red-700';
  if (score >= 3) return 'border-blue-500 text-blue-700';
  if (score >= 2) return 'border-green-500 text-green-700';
  if (score >= 1) return 'border-gray-500 text-gray-700';
  return 'border-gray-400 text-gray-500';
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export function CompanyVietnam() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Record<string, CompanyManager[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingManager, setEditingManager] = useState<CompanyManager | null>(null);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCompanies(); }, []);

  async function fetchCompanies() {
    setLoading(true);
    const { data } = await supabase.from('companies').select('*').eq('region', 'vietnam').order('name');
    setCompanies(data ?? []);
    setLoading(false);
  }

  async function fetchManagers(companyId: string) {
    if (managers[companyId]) return;
    const { data } = await supabase.from('company_managers').select('*').eq('company_id', companyId).order('name');
    setManagers(prev => ({ ...prev, [companyId]: data ?? [] }));
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); } else { setExpandedId(id); fetchManagers(id); }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.business_number ?? '').includes(searchTerm) ||
    (c.ceo ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => { setCurrentPage(page); setExpandedId(null); };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!window.confirm(`정말로 "${name}" 기업을 삭제하시겠습니까?`)) return;
    await supabase.from('companies').delete().eq('id', id);
    setCompanies(companies.filter(c => c.id !== id));
    setExpandedId(null);
  };

  const handleDeleteManager = async (companyId: string, managerId: string, managerName: string) => {
    if (!window.confirm(`정말로 "${managerName}" 담당자를 삭제하시겠습니까?`)) return;
    await supabase.from('company_managers').delete().eq('id', managerId);
    setManagers(prev => ({ ...prev, [companyId]: (prev[companyId] ?? []).filter(m => m.id !== managerId) }));
  };

  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      region: 'vietnam' as const,
      name: fd.get('name') as string,
      rank: Number(fd.get('rank')),
      business_number: fd.get('business_number') as string || null,
      ceo: fd.get('ceo') as string || null,
      industry: fd.get('industry') as string || null,
      address: fd.get('address') as string || null,
      status: fd.get('status') as CompanyStatus,
    };
    if (editingCompany) {
      const { data } = await supabase.from('companies').update(payload).eq('id', editingCompany.id).select().single();
      if (data) setCompanies(companies.map(c => c.id === editingCompany.id ? data : c));
    } else {
      const { data } = await supabase.from('companies').insert({ ...payload, total_projects: 0, total_amount: 0, contact_attempts: 0, successful_contacts: 0 }).select().single();
      if (data) setCompanies([data, ...companies]);
    }
    setSaving(false);
    setShowCompanyModal(false);
    setEditingCompany(null);
  };

  const handleSaveManager = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentCompanyId) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      company_id: currentCompanyId,
      name: fd.get('name') as string,
      department: fd.get('department') as string || null,
      position: fd.get('position') as string || null,
      phone: fd.get('phone') as string || null,
      email: fd.get('email') as string || null,
    };
    if (editingManager) {
      const { data } = await supabase.from('company_managers').update(payload).eq('id', editingManager.id).select().single();
      if (data) setManagers(prev => ({ ...prev, [currentCompanyId]: (prev[currentCompanyId] ?? []).map(m => m.id === editingManager.id ? data : m) }));
    } else {
      const { data } = await supabase.from('company_managers').insert(payload).select().single();
      if (data) setManagers(prev => ({ ...prev, [currentCompanyId]: [...(prev[currentCompanyId] ?? []), data] }));
    }
    setSaving(false);
    setShowManagerModal(false);
    setEditingManager(null);
    setCurrentCompanyId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">기업 관리 - BRYCENVIETNAM</h1>
        <p className="text-sm text-gray-500 mt-1">베트남 거래처 기업 정보 및 담당자를 관리합니다</p>
      </div>

      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="기업명, 사업자번호, 대표자명으로 검색" value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button onClick={() => { setEditingCompany(null); setShowCompanyModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm">
              <Plus className="w-4 h-4" />기업 등록
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">데이터를 불러오는 중...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
            {searchTerm ? '검색 결과가 없습니다' : '등록된 거래처가 없습니다'}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedCompanies.map((company) => {
              const isExpanded = expandedId === company.id;
              const companyManagers = managers[company.id] ?? [];
              return (
                <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(company.id)}>
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg text-gray-900 font-bold">{company.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${getRankBorderColor(company.rank)}`}>{rankToLabel(company.rank)}등급</span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(company.status)}`}>{company.status}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div><span className="text-gray-500">사업자번호:</span><span className="ml-2 text-gray-900">{company.business_number ?? '-'}</span></div>
                          <div><span className="text-gray-500">대표자:</span><span className="ml-2 text-gray-900">{company.ceo ?? '-'}</span></div>
                          <div><span className="text-gray-500">업종:</span><span className="ml-2 text-gray-900">{company.industry ?? '-'}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">주소:</span><span className="ml-2 text-gray-900">{company.address ?? '-'}</span></div>
                          <div><span className="text-gray-500">총 프로젝트:</span><span className="ml-2 text-gray-900">{company.total_projects}건</span></div>
                          <div><span className="text-gray-500">총 거래액:</span><span className="ml-2 text-gray-900">{formatAmount(company.total_amount)}원</span></div>
                          <div>
                            <span className="text-gray-500">컨택률:</span>
                            <span className="ml-2 text-gray-900 font-semibold">{company.contact_attempts > 0 ? ((company.successful_contacts / company.contact_attempts) * 100).toFixed(1) : 0}%</span>
                            <span className="ml-2 text-xs text-gray-600">(컨택 {company.successful_contacts}건 / 시도 {company.contact_attempts}건)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button onClick={() => { setEditingCompany(company); setShowCompanyModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-blue-600" /></button>
                        <button onClick={() => handleDeleteCompany(company.id, company.name)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-600" /></button>
                        <button onClick={() => toggleExpand(company.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-gray-900">담당자 연락처</h4>
                        <button onClick={() => { setCurrentCompanyId(company.id); setEditingManager(null); setShowManagerModal(true); }} className="text-sm text-[#3d4659] hover:text-[#4a5568]">+ 담당자 추가</button>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {companyManagers.length === 0 ? (
                          <div className="py-8 text-center text-sm text-gray-400">등록된 담당자가 없습니다</div>
                        ) : (
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">이름</th>
                                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">부서</th>
                                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">직책</th>
                                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">연락처</th>
                                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">이메일</th>
                                <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase">작업</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {companyManagers.map((manager) => (
                                <tr key={manager.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{manager.name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{manager.department ?? '-'}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{manager.position ?? '-'}</td>
                                  <td className="px-4 py-3">{manager.phone ? <a href={`tel:${manager.phone}`} className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]"><Phone className="w-4 h-4" />{manager.phone}</a> : <span className="text-sm text-gray-400">-</span>}</td>
                                  <td className="px-4 py-3">{manager.email ? <a href={`mailto:${manager.email}`} className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]"><Mail className="w-4 h-4" />{manager.email}</a> : <span className="text-sm text-gray-400">-</span>}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => { setCurrentCompanyId(company.id); setEditingManager(manager); setShowManagerModal(true); }} className="p-1 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button>
                                      <button onClick={() => handleDeleteManager(company.id, manager.id, manager.name)} className="p-1 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => handlePageChange(page)} className={`px-4 py-2 rounded-lg text-sm ${currentPage === page ? 'bg-[#3d4659] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
            ))}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
          </div>
        )}
      </div>

      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{editingCompany ? '기업 정보 수정' : '기업 등록'}</h2>
              <button onClick={() => { setShowCompanyModal(false); setEditingCompany(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveCompany} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-700 mb-1">기업명 *</label><input name="name" type="text" defaultValue={editingCompany?.name} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">등급 *</label>
                  <select name="rank" defaultValue={String(editingCompany?.rank ?? 3)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="5">S등급 (5점)</option><option value="4">A등급 (4점)</option><option value="3">B등급 (3점)</option><option value="2">C등급 (2점)</option><option value="1">D등급 (1점)</option><option value="0">E등급 (0점)</option>
                  </select>
                </div>
                <div><label className="block text-sm text-gray-700 mb-1">사업자번호</label><input name="business_number" type="text" defaultValue={editingCompany?.business_number ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">대표자</label><input name="ceo" type="text" defaultValue={editingCompany?.ceo ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">업종</label><input name="industry" type="text" defaultValue={editingCompany?.industry ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm text-gray-700 mb-1">상태 *</label>
                  <select name="status" defaultValue={editingCompany?.status ?? '거래중'} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="거래중">거래중</option><option value="협의중">협의중</option><option value="보류">보류</option>
                  </select>
                </div>
                <div className="col-span-2"><label className="block text-sm text-gray-700 mb-1">주소</label><input name="address" type="text" defaultValue={editingCompany?.address ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                {editingCompany && (
                  <>
                    <div><label className="block text-sm text-gray-700 mb-1">총 프로젝트</label><input type="text" value={`${editingCompany.total_projects}건`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" /></div>
                    <div><label className="block text-sm text-gray-700 mb-1">총 거래액</label><input type="text" value={`${formatAmount(editingCompany.total_amount)}원`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" /></div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => { setShowCompanyModal(false); setEditingCompany(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{editingManager ? '담당자 수정' : '담당자 추가'}</h2>
              <button onClick={() => { setShowManagerModal(false); setEditingManager(null); setCurrentCompanyId(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveManager} className="p-6 space-y-4">
              <div><label className="block text-sm text-gray-700 mb-1">이름 *</label><input name="name" type="text" defaultValue={editingManager?.name} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">부서</label><input name="department" type="text" defaultValue={editingManager?.department ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">직책</label><input name="position" type="text" defaultValue={editingManager?.position ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">연락처</label><input name="phone" type="tel" defaultValue={editingManager?.phone ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">이메일</label><input name="email" type="email" defaultValue={editingManager?.email ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => { setShowManagerModal(false); setEditingManager(null); setCurrentCompanyId(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
