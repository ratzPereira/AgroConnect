interface IllustrationProps {
  readonly className?: string;
}

export function EmptyNotifications({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Small sparkles */}
      <circle cx="60" cy="30" r="2" fill="#F5A623" opacity="0.5" />
      <circle cx="150" cy="40" r="1.5" fill="#F5A623" opacity="0.4" />
      <circle cx="45" cy="60" r="1.5" fill="#6EC26E" opacity="0.4" />

      {/* Bell body */}
      <path
        d="M80 55 C80 35 120 35 120 55 L125 95 L75 95 Z"
        fill="#D4D1C9"
      />

      {/* Bell top nub */}
      <circle cx="100" cy="35" r="5" fill="#D4D1C9" />

      {/* Bell rim */}
      <rect x="70" y="93" width="60" height="8" rx="4" fill="#B0ADA3" />

      {/* Bell clapper */}
      <circle cx="100" cy="107" r="5" fill="#B0ADA3" />

      {/* Bell highlight */}
      <path
        d="M88 50 C88 42 96 42 96 50 L98 80 L86 80 Z"
        fill="white"
        opacity="0.2"
      />

      {/* Checkmark circle */}
      <circle cx="130" cy="100" r="18" fill="#2D8A2D" />
      <circle cx="130" cy="100" r="14" fill="#7CE24F" />

      {/* Checkmark */}
      <path
        d="M122 100 L128 106 L139 94"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Decorative arcs around bell */}
      <path d="M65 55 Q60 45 65 35" stroke="#E8E6E0" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M135 55 Q140 45 135 35" stroke="#E8E6E0" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
