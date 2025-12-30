'use client';

interface NavDotsProps {
  sections: { id: string; label: string }[];
  activeSection: string;
}

export function NavDots({ sections, activeSection }: NavDotsProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`
            group flex items-center gap-3
            ${activeSection === section.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}
            transition-opacity
          `}
        >
          <span className="text-xs text-right w-40 hidden group-hover:block text-[#555555]">
            {section.label}
          </span>
          <span
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${activeSection === section.id
                ? 'bg-[#d4a54a] scale-125'
                : 'bg-zinc-700 group-hover:bg-zinc-500'
              }
            `}
          />
        </a>
      ))}
    </div>
  );
}
