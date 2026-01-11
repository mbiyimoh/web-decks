'use client';

interface Props {
  score: number | null;
  responseCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AlignmentBadge({ score, responseCount, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  if (responseCount === 0 || score === null) {
    return (
      <span className={'inline-flex items-center gap-1 rounded bg-zinc-800 text-zinc-500 ' + sizeClasses[size]}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Awaiting data
      </span>
    );
  }

  const getStyle = () => {
    if (score >= 70) return { bg: 'bg-green-500/10', text: 'text-green-400', icon: 'M5 13l4 4L19 7', label: 'Strong match' };
    if (score >= 40) return { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'M12 9v2m0 4h.01', label: 'Partial match' };
    return { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', label: 'Weak match' };
  };

  const style = getStyle();

  return (
    <span className={'inline-flex items-center gap-1 rounded ' + style.bg + ' ' + style.text + ' ' + sizeClasses[size]}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
      </svg>
      {style.label}
    </span>
  );
}
