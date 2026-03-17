"use client";

interface Section {
  id: string;
  label: string;
}

interface SectionJumpBarProps {
  sections: Section[];
}

const SCROLL_OFFSET = 120; // header (56px) + jump bar (~44px) + buffer

export function SectionJumpBar({ sections }: SectionJumpBarProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="sticky top-14 z-20 -mx-1 bg-background/95 backdrop-blur-sm border-b pb-2 pt-1 mb-4">
      <div className="flex items-center gap-1.5 flex-wrap px-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mr-1">
          Sections
        </span>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
