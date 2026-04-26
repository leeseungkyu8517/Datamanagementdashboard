import { useState } from 'react';
import { Building2, TrendingUp, BarChart3, Calendar, ChevronDown, ChevronRight, Database, CheckSquare, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import logoImage from 'figma:asset/22188a559e2ae35bb209914ca8f5f374d6231efc.png';

type MenuItem = {
  path: string;
  icon: typeof Building2;
  label: string;
  children?: { path: string; label: string }[];
};

const SECTION_LABELS: Record<string, string> = {
  '/my-tasks': '업무',
  '/sales': '영업',
  '/companies/korea': '지사 관리',
  '/company-data': '분석',
  '/dashboard': '대시보드',
  '/schedule': '스케줄 관리',
};

export function Sidebar() {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('/companies/korea');

  const allMenuItems: MenuItem[] = [
    { path: '/my-tasks', icon: CheckSquare, label: '나의 할일' },
    { path: '/sales', icon: TrendingUp, label: '영업 이력 관리' },
    {
      path: '/companies/korea',
      icon: Building2,
      label: 'BRYCENKOREA',
      children: [
        { path: '/companies/korea', label: 'KOREA 담당 기업 관리' },
        { path: '/companies/korea/personnel', label: 'KOREA 영업인력 관리' },
      ],
    },
    {
      path: '/companies/japan',
      icon: Building2,
      label: 'BRYCENJAPAN',
      children: [
        { path: '/companies/japan', label: 'JAPAN 담당 기업 관리' },
        { path: '/companies/japan/personnel', label: 'JAPAN 영업인력 관리' },
      ],
    },
    {
      path: '/companies/vietnam',
      icon: Building2,
      label: 'BRYCENVIETNAM',
      children: [
        { path: '/companies/vietnam', label: 'VIETNAM 담당 기업 관리' },
        { path: '/companies/vietnam/personnel', label: 'VIETNAM 영업인력 관리' },
      ],
    },
    { path: '/company-data', icon: Database, label: '기업 정보 수집' },
    { path: '/dashboard', icon: BarChart3, label: '매출 예측 대시보드' },
    { path: '/period-forecast', icon: Target, label: '기수별 예측 대시보드' },
    { path: '/schedule', icon: Calendar, label: '스케줄 관리' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: MenuItem) => {
    if (item.children) return false;
    return isActive(item.path);
  };

  const toggleMenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  let lastSection = '';

  return (
    <aside className="w-64 bg-[#1a2035] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center justify-center">
          <img src={logoImage} alt="BRYCEN" className="max-h-10 w-auto object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {allMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isParentActive(item);
            const hasChildren = !!item.children?.length;
            const isExpanded = expandedMenu === item.path;
            const sectionLabel = SECTION_LABELS[item.path];
            const showLabel = sectionLabel && sectionLabel !== lastSection;
            if (showLabel) lastSection = sectionLabel;

            return (
              <li key={item.path}>
                {showLabel && (
                  <div className="px-3 pt-4 pb-1.5">
                    <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{sectionLabel}</span>
                  </div>
                )}
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.path)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                        isExpanded
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      }
                    </button>
                    {isExpanded && (
                      <ul className="mt-0.5 ml-3 pl-4 border-l border-white/10 space-y-0.5">
                        {item.children!.map((child) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={`block px-3 py-2 rounded-lg text-xs transition-all ${
                                isActive(child.path)
                                  ? 'bg-blue-500/20 text-blue-300 font-semibold'
                                  : 'text-white/45 hover:bg-white/6 hover:text-white/70'
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      active
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-400' : ''}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-blue-300">양</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white/80 truncate">양현구</div>
            <div className="text-xs text-white/35 truncate">관리자</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
