import React from 'react';
import { Moon, RefreshCw, Sun } from 'lucide-react';
import { TabId } from '../types/blog';
import { BrandMark } from './BrandMark';

interface HeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  updatedLabel: string;
  onLogoClick: () => void;
}

const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'categories', label: 'Categories' },
  { id: 'saved', label: 'Saved' },
  { id: 'search', label: 'Search' },
];

export function Header({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  updatedLabel,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-[#F6F8F8]/90 dark:bg-[#0B1214]/90 backdrop-blur-md border-b border-[#DCE6E5] dark:border-[#1E2E31]">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
        {/* Brand Zone */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#177E70] rounded-lg"
          aria-label="Muavexa Home"
        >
          <BrandMark className="w-7 h-7" />
          <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#0F3D3E] dark:text-[#ECF2F2]">
            Muavexa
          </span>
        </button>

        {/* Desktop Nav Links */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium"
          aria-label="Primary navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#0F3D3E] dark:text-[#BFE3D6] font-semibold'
                    : 'text-[#5B7C8A] dark:text-[#9BB3BD] hover:text-[#111C1D] dark:hover:text-[#ECF2F2]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute left-0 right-0 -bottom-[17px] h-[2px] bg-[#177E70] dark:bg-[#BFE3D6]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Sync status + Manual Refresh + Theme Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {updatedLabel && (
            <span
              className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] tabular-nums whitespace-nowrap mr-1"
              aria-live="polite"
            >
              {updatedLabel}
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh live feed"
            aria-label="Refresh live feed"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#0F3D3E] dark:text-[#ECF2F2] hover:bg-[#E5ECEB] dark:hover:bg-[#162326] transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin text-[#177E70]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#0F3D3E] dark:text-[#BFE3D6] hover:bg-[#E5ECEB] dark:hover:bg-[#162326] transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>
    </header>
  );
}
