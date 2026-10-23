import React from 'react';
import { useToastStore } from '../stores/useToastStore';

export const CustomToast: React.FC = () => {
  const { toast } = useToastStore();

  if (!toast) return null;

  return (
    <div className="fixed top-[env(safe-area-inset-top,24px)] inset-x-0 z-[9999] flex justify-center px-4 mt-4 animate-in slide-in-from-top-10 fade-in duration-300 pointer-events-none">
      <div className="bg-surface-container-highest/90 backdrop-blur-xl border border-white/20 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-[0_16px_32px_rgba(0,0,0,0.5)] max-w-[90%]">
        {toast.icon === 'success' && <span className="material-symbols-outlined text-primary text-2xl shrink-0">check_circle</span>}
        {toast.icon === 'fail' && <span className="material-symbols-outlined text-error text-2xl shrink-0">error</span>}
        <span className="font-label-lg font-medium tracking-wide leading-tight">{toast.content}</span>
      </div>
    </div>
  );
};
