interface SectionLabelProps {
  number: number | string;
  label: string;
  className?: string;
}

export function SectionLabel({
  number,
  label,
  className = ''
}: SectionLabelProps) {
  const formattedNumber = typeof number === 'number'
    ? String(number).padStart(2, '0')
    : number;

  return (
    <p
      className={`
        text-[#d4a54a] text-xs font-medium
        tracking-[0.2em] uppercase mb-4
        font-mono
        ${className}
      `}
    >
      {formattedNumber} — {label}
    </p>
  );
}
