import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './sidebar';
import { Bell, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'KOREA 담당 기업 관리',
  '/companies/korea': 'KOREA 담당 기업 관리',
  '/companies/korea/personnel': 'KOREA 영업인력 관리',
  '/companies/japan': 'JAPAN 담당 기업 관리',
  '/companies/japan/personnel': 'JAPAN 영업인력 관리',
  '/companies/vietnam': 'VIETNAM 담당 기업 관리',
  '/companies/vietnam/personnel': 'VIETNAM 영업인력 관리',
  '/sales': '영업 이력 관리',
  '/dashboard': '매출 예측 대시보드',
  '/period-forecast': '기수별 예측 대시보드',
  '/schedule': '스케줄 관리',
  '/my-tasks': '나의 할일',
  '/company-data': '기업 정보 수집',
};

function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="text-sm font-medium text-gray-700 tabular-nums">{time}</span>;
}

export function Layout() {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? '';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f2f7]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200/80 px-6 h-14 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            {pageTitle && (
              <span className="text-sm text-gray-400 font-medium">{pageTitle}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 mr-2">
              <LiveClock />
            </div>

            <button className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-4 h-4 text-gray-500" />
            </button>

            <button className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="ml-2 pl-3 border-l border-gray-200 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1a2035] flex items-center justify-center">
                <span className="text-xs font-bold text-white">양</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-800 leading-none">양현구</div>
                <div className="text-xs text-gray-400 mt-0.5">관리자</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
