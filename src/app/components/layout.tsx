import { Outlet } from 'react-router';
import { Sidebar } from './sidebar';
import { Bell, User, Clock } from 'lucide-react';

export function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f6fa]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="text-sm">25:30</span>
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <button className="px-4 py-2 bg-[#3d4659] text-white rounded-lg hover:bg-[#4a5568] transition-all text-sm">
              양현구님 로그아웃
            </button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}