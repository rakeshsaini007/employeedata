import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isValid?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, isValid, className, ...props }) => {
  return (
    <div className="w-full mb-5">
      <label className="block text-sm font-bold text-slate-900 mb-2 ml-1 tracking-tight">
        {label}
      </label>
      <div className="relative group">
        <input
          className={`
            w-full px-5 py-3.5 rounded-xl border-[2.5px] outline-none transition-all duration-200
            text-slate-950 font-medium placeholder:text-slate-400
            ${error 
              ? 'border-red-500 bg-red-50 focus:ring-4 focus:ring-red-100' 
              : isValid 
                ? 'border-emerald-500 bg-emerald-50 focus:ring-4 focus:ring-emerald-100' 
                : 'border-slate-200 bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100'
            }
            disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100
            ${className || ''}
          `}
          {...props}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
          {error && <AlertCircle className="w-5 h-5 text-red-600" />}
          {isValid && !error && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-bold ml-1 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
};