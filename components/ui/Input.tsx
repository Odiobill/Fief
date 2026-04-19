import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-slate-400 ml-1">
          {label}
        </label>
      )}
      <input
        className={`px-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
          error ? 'border-red-500 focus:ring-red-500/50' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 ml-1">{error}</span>}
    </div>
  );
};
