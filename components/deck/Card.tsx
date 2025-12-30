interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  className = '',
  highlight = false,
  glow = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-[#111114]
        border ${highlight ? 'border-[#d4a54a]/50' : 'border-white/[0.08]'}
        rounded-2xl p-6 md:p-8
        ${className}
      `}
      style={glow ? { boxShadow: '0 0 40px rgba(212,165,74,0.3)' } : undefined}
    >
      {children}
    </div>
  );
}
