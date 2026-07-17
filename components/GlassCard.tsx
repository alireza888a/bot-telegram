import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`
      backdrop-blur-xl 
      dark:bg-white/5 bg-white/70 
      dark:border-white/10 border-white/40 border
      rounded-2xl 
      shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
      p-6 
      transition-colors duration-300
      ${className}
    `}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-6 pb-2 border-b dark:border-white/5 border-black/5">
          {title && <h3 className="text-xl font-bold dark:text-white/90 text-slate-800 drop-shadow-sm">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};