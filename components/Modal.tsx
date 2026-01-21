import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-overlay absolute inset-0" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-10 fade-in">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}