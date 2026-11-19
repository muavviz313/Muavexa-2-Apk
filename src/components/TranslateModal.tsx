import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Languages, RotateCcw, Search, X } from 'lucide-react';
import { ALL_LANGUAGES, LanguageOption } from '../data/languages';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang: string | null;
  onSelectLang: (langCode: string | null) => void;
}

const POPULAR_CODES = [
  'ur',
  'ar',
  'hi',
  'es',
  'fr',
  'de',
  'zh-CN',
  'ja',
  'ko',
  'tr',
  'pt',
  'ru',
  'id',
  'bn',
];

export function TranslateModal({
  isOpen,
  onClose,
  selectedLang,
  onSelectLang,
}: TranslateModalProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const popularLanguages = useMemo(
    () =>
      POPULAR_CODES.map((code) => ALL_LANGUAGES.find((l) => l.code === code)).filter(
        (l): l is LanguageOption => Boolean(l)
      ),
    []
  );

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_LANGUAGES;
    return ALL_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  const handlePick = (code: string | null) => {
    onSelectLang(code === 'en' ? null : code);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Translate Muavexa"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag affordance on mobile */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#CBD8D7] dark:bg-[#2A3D41]" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#DCE6E5] dark:border-[#1E2E31] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F3D3E]/10 dark:bg-[#BFE3D6]/15 text-[#0F3D3E] dark:text-[#BFE3D6] flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#0F3D3E] dark:text-[#ECF2F2] leading-tight">
                Translate
              </h2>
              <p className="text-xs text-[#5B7C8A] dark:text-[#9BB3BD] tabular-nums">
                {ALL_LANGUAGES.length} languages available
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close language picker"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#5B7C8A] hover:text-[#111C1D] dark:hover:text-white hover:bg-[#F0F5F4] dark:hover:bg-[#1B2B2E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Original Reset */}
        <div className="p-4 space-y-3 border-b border-[#DCE6E5] dark:border-[#1E2E31]">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#5B7C8A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search any language (e.g. Urdu, Arabic, Spanish)..."
              aria-label="Search languages"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F6F8F8] dark:bg-[#0B1214] border border-[#DCE6E5] dark:border-[#1E2E31] focus:border-[#177E70] dark:focus:border-[#BFE3D6] focus:outline-none text-sm text-[#111C1D] dark:text-[#ECF2F2] placeholder:text-[#7D97A2]"
            />
          </div>

          {selectedLang && (
            <button
              type="button"
              onClick={() => handlePick(null)}
              className="w-full min-h-[44px] px-4 rounded-xl bg-[#0F3D3E]/8 dark:bg-[#BFE3D6]/12 hover:bg-[#0F3D3E]/15 dark:hover:bg-[#BFE3D6]/20 text-xs font-semibold text-[#0F3D3E] dark:text-[#BFE3D6] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Original (English)</span>
            </button>
          )}
        </div>

        {/* Scrollable Language Directory */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!search.trim() && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#5B7C8A] dark:text-[#9BB3BD]">
                Quick Select
              </p>
              <div className="flex flex-wrap gap-2">
                {popularLanguages.map((lang) => {
                  const isActive = selectedLang === lang.code;
                  return (
                    <button
                      key={`pop-${lang.code}`}
                      type="button"
                      onClick={() => handlePick(lang.code)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#0F3D3E] text-white dark:bg-[#BFE3D6] dark:text-[#0F3D3E]'
                          : 'bg-[#F0F5F4] dark:bg-[#182628] text-[#111C1D] dark:text-[#ECF2F2] hover:border-[#177E70] border border-transparent'
                      }`}
                    >
                      {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#5B7C8A] dark:text-[#9BB3BD]">
              {search.trim()
                ? `Matching Languages (${filteredLanguages.length})`
                : 'All Languages'}
            </p>

            {filteredLanguages.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5B7C8A] dark:text-[#9BB3BD]">
                No language matched &ldquo;{search}&rdquo;.
              </p>
            ) : (
              <div className="divide-y divide-[#EEF3F2] dark:divide-[#1C2A2D] rounded-xl border border-[#DCE6E5] dark:border-[#1E2E31] overflow-hidden">
                {filteredLanguages.map((lang) => {
                  const isActive =
                    (lang.code === 'en' && !selectedLang) || selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handlePick(lang.code)}
                      className={`w-full min-h-[48px] px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#BFE3D6]/30 dark:bg-[#177E70]/25'
                          : 'bg-white dark:bg-[#131D20] hover:bg-[#F6F8F8] dark:hover:bg-[#182628]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-[#111C1D] dark:text-[#ECF2F2]">
                          {lang.name}
                        </span>
                        <span className="ml-2 text-xs text-[#5B7C8A] dark:text-[#9BB3BD]">
                          {lang.nativeName}
                        </span>
                      </div>
                      {isActive && (
                        <Check className="w-4 h-4 text-[#177E70] dark:text-[#BFE3D6] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
