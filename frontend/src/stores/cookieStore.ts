import { create } from 'zustand';

type ConsentValue = 'accepted' | 'rejected' | null;

const STORAGE_KEY = 'agroconnect-cookie-consent';

interface CookieState {
  consent: ConsentValue;
  accept: () => void;
  reject: () => void;
}

export const useCookieStore = create<CookieState>((set) => ({
  consent: (localStorage.getItem(STORAGE_KEY) as ConsentValue) ?? null,
  accept: () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    set({ consent: 'accepted' });
  },
  reject: () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    set({ consent: 'rejected' });
  },
}));
