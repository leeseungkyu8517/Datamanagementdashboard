import { useState } from 'react';
import { Search, Plus, Phone, Mail, Edit2, Trash2, X } from 'lucide-react';

type SalesPersonnel = {
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  projects: number;
};

const initialPersonnel: SalesPersonnel[] = [
  {
    id: '1',
    name: 'Nguyen Van An',
    position: 'Sales Manager',
    department: 'Sales Team 1',
    phone: '+84-90-123-4567',
    email: 'nguyen.va@brycen.vn',
    projects: 9,
  },
  {
    id: '2',
    name: 'Tran Thi Bao',
    position: 'Sales Leader',
    department: 'Sales Team 1',
    phone: '+84-90-234-5678',
    email: 'tran.tb@brycen.vn',
    projects: 7,
  },
  {
    id: '3',
    name: 'Le Minh Chau',
    position: 'Sales Executive',
    department: 'Sales Team 2',
    phone: '+84-90-345-6789',
    email: 'le.mc@brycen.vn',
    projects: 5,
  },
  {
    id: '4',
    name: 'Pham Hoang Dung',
    position: 'Sales Manager',
    department: 'Sales Team 2',
    phone: '+84-90-456-7890',
    email: 'pham.hd@brycen.vn',
    projects: 8,
  },
];

export function SalesPersonnelVietnam() {
  const [personnel, setPersonnel] = useState<SalesPersonnel[]>(initialPersonnel);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SalesPersonnel | null>(null);

  const filteredPersonnel = personnel.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`정말로 "${name}" 영업인력을 삭제하시겠습니까?`)) {
      setPersonnel(personnel.filter((p) => p.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newPerson: SalesPersonnel = {
      id: editingPerson?.id || Date.now().toString(),
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      department: formData.get('department') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      projects: editingPerson?.projects || 0,
    };

    if (editingPerson) {
      setPersonnel(personnel.map((p) => (p.id === editingPerson.id ? newPerson : p)));
    } else {
      setPersonnel([...personnel, newPerson]);
    }

    setShowModal(false);
    setEditingPerson(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">BRYCENVIETNAM 영업인력 관리</h1>
        <p className="text-sm text-gray-500 mt-1">BRYCENVIETNAM 소속 영업 인력 정보를 관리합니다</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, 부서, 직책으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setEditingPerson(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              영업인력 추가
            </button>
          </div>
        </div>

        {/* Personnel Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  직책
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  부서
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  담당 프로젝트
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPersonnel.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{person.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{person.position}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{person.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`tel:${person.phone}`}
                      className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]"
                    >
                      <Phone className="w-4 h-4" />
                      {person.phone}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`mailto:${person.email}`}
                      className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#3d4659]"
                    >
                      <Mail className="w-4 h-4" />
                      {person.email}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{person.projects}건</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPerson(person);
                          setShowModal(true);
                        }}
                        className="p-1 hover:bg-blue-50 rounded transition-colors"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(person.id, person.name)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">
                {editingPerson ? '영업인력 수정' : '영업인력 추가'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPerson(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">이름</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingPerson?.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">직책</label>
                <input
                  name="position"
                  type="text"
                  defaultValue={editingPerson?.position}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">부서</label>
                <input
                  name="department"
                  type="text"
                  defaultValue={editingPerson?.department}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">연락처</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={editingPerson?.phone}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">이메일</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingPerson?.email}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPerson(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568]"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
