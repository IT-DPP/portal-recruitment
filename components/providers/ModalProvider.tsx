"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, Info } from 'lucide-react';

interface ModalContextType {
  confirm: (title: string, message: string, isDanger?: boolean) => Promise<boolean>;
  alert: (title: string, message: string) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    isDanger: boolean;
    resolve: ((value: boolean | void) => void) | null;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    isDanger: false,
    resolve: null
  });

  const confirm = useCallback((title: string, message: string, isDanger = true) => {
    return new Promise<boolean>((resolve) => {
      setModalState({ isOpen: true, type: 'confirm', title, message, isDanger, resolve: resolve as any });
    });
  }, []);

  const alert = useCallback((title: string, message: string) => {
    return new Promise<void>((resolve) => {
      setModalState({ isOpen: true, type: 'alert', title, message, isDanger: false, resolve: resolve as any });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (modalState.resolve) {
      modalState.resolve(value);
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-4 border-b flex items-center gap-3 ${modalState.isDanger ? 'bg-red-50 border-red-100 text-status-error' : 'bg-surface-container-lowest border-table-border text-primary'}`}>
              {modalState.isDanger ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              <h3 className="font-bold text-sm tracking-wide uppercase">{modalState.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-black leading-relaxed font-medium">{modalState.message}</p>
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-3">
              {modalState.type === 'confirm' && (
                <button onClick={() => handleClose(false)} className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded transition-colors">
                  Batal
                </button>
              )}
              <button onClick={() => handleClose(true)} className={`px-5 py-2.5 text-sm font-semibold rounded text-white transition-colors shadow-sm ${modalState.isDanger ? 'bg-status-error hover:bg-red-700' : 'bg-primary hover:bg-primary-container'}`}>
                {modalState.type === 'confirm' ? (modalState.isDanger ? 'Ya, Lanjutkan' : 'Konfirmasi') : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
