import { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SalesPersonnel as SP } from '@/lib/database.types';

export function SalesPersonnelJapan() {
  const [personnel, setPersonnel] = useState<SP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SP | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPersonnel(); }, []);

  async function fetchPersonnel() {
    setLoading(true);
    const { data } = await supabase.from('sales_personnel').select('*').eq('region', 'japan').order('name');
    setPersonnel(data ?? []);
    setLoading(false);
  }

  const filteredPersonnel = personnel.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.department ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.position ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`정말로 "${name}" 영업인력을 삭제하시겠습니까?`)) return;
    await supabase.from('sales_personnel').delete().eq('id', id);
    setPersonnel(personnel.filter(p => p.id !== id));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      region: 'japan' as const,
      name: fd.get('name') as string,
      position: fd.get('position') as string || null,
      department: fd.get('department') as string || null,
      phone: fd.get('phone') as string || null,
      email: fd.get('email') as string || null,
    };
    if (editingPerson) {
      const { data } = await supabase.from('sales_personnel').update(payload).eq('id', editingPerson.id).select().single();
      if (data) setPersonnel(personnel.map(p => p.id === editingPerson.id ? data : p));
    } else {
      const { data } = await supabase.from('sales_personnel').insert({ ...payload, projects_count: 0 }).select().single();
      if (data) setPersonnel([...personnel, data]);
    }
    setSaving(false);
    setShowModal(false);
    setEditingPerson(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">BRYCENJAPAN 영업인력 관리</h1>
        <p className="text-sm text-gray-500 mt-1">BRYCENJAPAN 소속 영업 인력 정보를 관리합니다</p>
      </div>

      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="이름, 부서, 직책으로 검색" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button onClick={() => { setEditingPerson(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm">
              <Plus className="w-4 h-4" />영업인력 추가
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-sm text-gray-400">데이터를 불러오는 중...</div>
          ) : filteredPersonnel.length === 0 ? (
            <div className="py-24 text-center text-sm text-gray-400">{searchTerm ? '검색 결과가 없습니다' : '등록된 영업인력이 없습니다'}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">직책</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">부서</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">연락처</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">담당 프로젝트</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{person.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.position ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.department ?? '-'}</td>
                    <td className="px-6 py-4">
                      {person.phone
                        ? <a href={`tel:${person.phone}`} className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]"><Phone className="w-4 h-4" />{person.phone}</a>
                        : <span className="text-sm text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {person.email
                        ? <a href={`mailto:${person.email}`} className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]"><Mail className="w-4 h-4" />{person.email}</a>
                        : <span className="text-sm text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{person.projects_count}건</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingPerson(person); setShowModal(true); }} className="p-1 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4 text-blue-600" /></button>
                        <button onClick={() => handleDelete(person.id, person.name)} className="p-1 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4 text-red-600" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{editingPerson ? '영업인력 수정' : '영업인력 추가'}</h2>
              <button onClick={() => { setShowModal(false); setEditingPerson(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="block text-sm text-gray-700 mb-1">이름 *</label><input name="name" type="text" defaultValue={editingPerson?.name} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">직책</label><input name="position" type="text" defaultValue={editingPerson?.position ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">부서</label><input name="department" type="text" defaultValue={editingPerson?.department ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">연락처</label><input name="phone" type="tel" defaultValue={editingPerson?.phone ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm text-gray-700 mb-1">이메일</label><input name="email" type="email" defaultValue={editingPerson?.email ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              {editingPerson && (
                <div><label className="block text-sm text-gray-700 mb-1">담당 프로젝트</label><input type="text" value={`${editingPerson.projects_count}건`} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600" /></div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditingPerson(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}