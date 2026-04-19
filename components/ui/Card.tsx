import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description }) => {
  return (
    <div className={`bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-6 py-5 border-b border-slate-800/60 bg-slate-900/20">
          {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
          {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>
      )}
      <div className="px-6 py-6">{children}</div>
    </div>
  );
};
