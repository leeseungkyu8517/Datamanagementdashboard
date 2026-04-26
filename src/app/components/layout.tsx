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
  '/documents': '견적서 / 계약서 관리',
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

const AFFILIATIONS = ['brycenkorea', 'brycenjapan', 'brycenvietnam'] as const;
type Affiliation = typeof AFFILIATIONS[number];

const AFFILIATION_COLOR: Record<Affiliation, string> = {
  brycenkorea:   'text-indigo-500',
  brycenjapan:   'text-rose-500',
  brycenvietnam: 'text-sky-500',
};

function getActiveLang(): 'ko' | 'ja' {
  const match = document.cookie.match(/googtrans=\/ko\/(\w+)/);
  return match?.[1] === 'ja' ? 'ja' : 'ko';
}

export function Layout() {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? '';
  const [affiliation, setAffiliation] = useState<Affiliation>(
    () => (localStorage.getItem('affiliation') as Affiliation) ?? 'brycenkorea'
  );
  const [activeLang, setActiveLang] = useState<'ko' | 'ja'>(getActiveLang);

  const handleAffiliation = (v: Affiliation) => {
    setAffiliation(v);
    localStorage.setItem('affiliation', v);
  };

  const switchLang = (lang: 'ko' | 'ja') => {
    if (lang === activeLang) return;
    if (lang === 'ja') {
      document.cookie = 'googtrans=/ko/ja; path=/';
      document.cookie = `googtrans=/ko/ja; path=/; domain=.${window.location.hostname}`;
    } else {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=.${window.location.hostname}`;
    }
    setActiveLang(lang);
    window.location.reload();
  };

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

            {/* 언어 전환 */}
            <div className="flex items-center gap-1 mr-1">
              <button
                onClick={() => switchLang('ko')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  activeLang === 'ko'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}>
                🇰🇷 한국어
              </button>
              <button
                onClick={() => switchLang('ja')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  activeLang === 'ja'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}>
                🇯🇵 日本語
              </button>
            </div>

            <button className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-4 h-4 text-gray-500" />
            </button>

            <button className="relative w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="ml-2 pl-3 border-l border-gray-200 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1a2035] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">양</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-800 leading-none">양현구</div>
                <div className="mt-0.5">
                  <select
                    value={affiliation}
                    onChange={e => handleAffiliation(e.target.value as Affiliation)}
                    className={`text-xs font-semibold bg-transparent border-none outline-none cursor-pointer p-0 ${AFFILIATION_COLOR[affiliation]}`}
                  >
                    {AFFILIATIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
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
