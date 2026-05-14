interface IllustrationProps {
  readonly className?: string;
}

export function EmptyTeam({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Person 1 (back, leftmost) */}
      <circle cx="60" cy="58" r="14" fill="#E8E6E0" />
      <path
        d="M40 105 Q40 82 60 82 Q80 82 80 105"
        fill="#E8E6E0"
      />

      {/* Person 2 (middle, slightly forward) */}
      <circle cx="90" cy="52" r="16" fill="#D4D1C9" />
      <path
        d="M66 105 Q66 78 90 78 Q114 78 114 105"
        fill="#D4D1C9"
      />

      {/* Person 3 (front-right, slightly smaller) */}
      <circle cx="118" cy="60" r="13" fill="#E8E6E0" />
      <path
        d="M100 105 Q100 84 118 84 Q136 84 136 105"
        fill="#E8E6E0"
      />

      {/* Dashed circle for "add" */}
      <circle
        cx="158"
        cy="72"
        r="20"
        fill="none"
        stroke="#2D8A2D"
        strokeWidth="2"
        strokeDasharray="5 4"
      />

      {/* Plus sign */}
      <line x1="158" y1="62" x2="158" y2="82" stroke="#2D8A2D" strokeWidth="3" strokeLinecap="round" />
      <line x1="148" y1="72" x2="168" y2="72" stroke="#2D8A2D" strokeWidth="3" strokeLinecap="round" />

      {/* Ground line */}
      <rect x="20" y="108" width="170" height="4" rx="2" fill="#EFE3CC" />

      {/* Subtle decorative dots */}
      <circle cx="30" cy="40" r="2" fill="#6EC26E" opacity="0.3" />
      <circle cx="175" cy="38" r="1.5" fill="#6EC26E" opacity="0.3" />
      <circle cx="22" cy="100" r="1.5" fill="#D4D1C9" opacity="0.4" />
    </svg>
  );
}
