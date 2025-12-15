import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isValid?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, isValid, className, ...props }) => {
  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          className={`
            w-full px-4 py-3 rounded-xl border-2 outline-none transition-all duration-300
            ${error 
              ? 'border-red-400 bg-red-50 text-red-900 focus:border-red-500 placeholder-red-300' 
              : isValid 
                ? 'border-green-400 bg-green-50 text-slate-900 focus:border-green-500' 
                : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-100'
            }
            disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed
            ${className || ''}
          `}
          {...props}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {error && <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />}
          {isValid && !error && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium ml-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
};
