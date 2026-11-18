import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorState({ message, onRetry, isRetrying = false }: ErrorStateProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-8 sm:p-10 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-xl bg-[#0F3D3E]/10 dark:bg-[#BFE3D6]/10 text-[#0F3D3E] dark:text-[#BFE3D6] flex items-center justify-center mx-auto mb-4">
        <WifiOff className="w-6 h-6" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-[#111C1D] dark:text-[#ECF2F2] mb-2">
        Could not load live articles
      </h2>
      <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] leading-relaxed mb-6">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F3D3E] hover:bg-[#177E70] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'Refreshing...' : 'Try Again'}</span>
      </button>
    </div>
  );
}
