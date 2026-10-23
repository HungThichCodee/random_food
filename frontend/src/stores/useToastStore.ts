import { create } from 'zustand';

interface ToastOptions {
  content: string;
  icon?: 'success' | 'fail' | 'none';
}

interface ToastState {
  toast: ToastOptions | null;
  show: (options: ToastOptions | string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (options) => {
    const toastOptions = typeof options === 'string' ? { content: options } : options;
    set({ toast: toastOptions });
    setTimeout(() => {
      // Only hide if it's the exact same toast (simple check by time or just blindly hide)
      set({ toast: null });
    }, 3000);
  },
  hide: () => set({ toast: null }),
}));

// Create a global replacement object so we don't have to change all imports if we don't want to,
// but it's better to just import useToastStore in those files.
export const Toast = {
  show: (options: ToastOptions | string) => {
    useToastStore.getState().show(options);
  }
};
