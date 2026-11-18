import React from 'react';
import { Bookmark, Grid2X2, Home, Search } from 'lucide-react';
import { TabId } from '../types/blog';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  savedCount: number;
}

export function BottomNav({ activeTab, onSelectTab, savedCount }: BottomNavProps) {
  const tabs: {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Categories', icon: Grid2X2 },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'search', label: 'Search', icon: Search },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E181A]/95 backdrop-blur-md border-t border-[#DCE6E5] dark:border-[#1E2E31] pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4 h-15 items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0F3D3E] dark:text-[#BFE3D6]'
                  : 'text-[#5B7C8A] dark:text-[#8CA4AE]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.3 : 1.8} />
                {tab.id === 'saved' && savedCount > 0 && (
                  <span className="ml-1 text-[10px] font-semibold tabular-nums text-[#177E70] dark:text-[#BFE3D6]">
                    {savedCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
