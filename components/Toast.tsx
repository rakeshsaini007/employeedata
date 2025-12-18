import React, { useEffect } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const style = type === 'success' 
    ? { bg: 'bg-slate-950', border: 'border-emerald-500/50', icon: <ShieldCheck className="w-6 h-6 text-emerald-400" /> } 
    : { bg: 'bg-slate-950', border: 'border-red-500/50', icon: <AlertCircle className="w-6 h-6 text-red-400" /> };

  return (
    <div className="fixed top-8 right-8 z-[100] animate-slideIn">
      <div className={`${style.bg} border ${style.border} text-white px-8 py-5 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-5 min-w-[320px] backdrop-blur-xl`}>
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <div className="flex-1">
          <p className="font-black text-sm uppercase tracking-widest opacity-60 mb-0.5">System Status</p>
          <p className="font-bold text-base">{message}</p>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};