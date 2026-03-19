import { useState } from 'react';
import { Building2, TrendingUp, BarChart3, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import logoImage from 'figma:asset/22188a559e2ae35bb209914ca8f5f374d6231efc.png';

type MenuItem = {
  path: string;
  icon: typeof Building2;
  label: string;
  children?: { path: string; label: string }[];
};

export function Sidebar() {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('/companies/korea');

  const allMenuItems: MenuItem[] = [
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
    { path: '/dashboard', icon: BarChart3, label: '매출 예측 대시보드' },
    { path: '/schedule', icon: Calendar, label: '스케줄 관리' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: MenuItem) => {
    // 하위 메뉴가 있는 경우 부모 메뉴는 활성화 색상을 표시하지 않음
    if (item.children) return false;
    return isActive(item.path);
  };

  const toggleMenu = (path: string) => {
    setExpandedMenu(expandedMenu === path ? null : path);
  };

  return (
    <aside className="w-64 bg-[#2c3444] flex flex-col h-full">
      {/* Logo Area */}
      <div className="px-6 py-6 flex items-center justify-center">
        <img src={logoImage} alt="BRYCEN KOREA" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {allMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isParentActive(item);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenu === item.path;

            return (
              <li key={item.path}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.path)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? 'bg-[#3d4659] text-white'
                          : 'text-gray-400 hover:bg-[#3d4659]/50 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                                isActive(child.path)
                                  ? 'bg-[#4a5568] text-white'
                                  : 'text-gray-400 hover:bg-[#3d4659]/50 hover:text-gray-200'
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? 'bg-[#3d4659] text-white'
                        : 'text-gray-400 hover:bg-[#3d4659]/50 hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}