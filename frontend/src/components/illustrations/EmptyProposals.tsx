interface IllustrationProps {
  readonly className?: string;
}

export function EmptyProposals({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Cloud */}
      <ellipse cx="50" cy="28" rx="20" ry="10" fill="#7CC8FF" opacity="0.4" />
      <ellipse cx="42" cy="32" rx="14" ry="8" fill="#7CC8FF" opacity="0.3" />

      {/* Birds */}
      <path d="M120 30 Q124 26 128 30" stroke="#B0ADA3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M140 22 Q143 19 146 22" stroke="#B0ADA3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M155 34 Q158 31 161 34" stroke="#B0ADA3" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Ground */}
      <rect x="0" y="130" width="200" height="30" rx="4" fill="#EFE3CC" />

      {/* Mailbox post */}
      <rect x="96" y="80" width="8" height="52" rx="2" fill="#C9A86E" />

      {/* Mailbox body */}
      <rect x="70" y="56" width="52" height="30" rx="6" fill="#D4D1C9" />

      {/* Mailbox opening */}
      <rect x="72" y="62" width="22" height="18" rx="3" fill="#E8E6E0" />

      {/* Mailbox flag (up) */}
      <rect x="122" y="58" width="4" height="20" rx="1" fill="#2D8A2D" />
      <rect x="122" y="56" width="12" height="8" rx="2" fill="#2D8A2D" />

      {/* Mail envelope peeking out */}
      <rect x="76" y="58" width="16" height="12" rx="1" fill="white" opacity="0.9" />
      <path d="M76 58 L84 65 L92 58" stroke="#D4D1C9" strokeWidth="1" fill="none" />

      {/* Grass tufts */}
      <path d="M80 132 Q82 124 84 132" stroke="#7CE24F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M110 132 Q113 122 116 132" stroke="#7CE24F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="40" y1="132" x2="40" y2="126" stroke="#7CE24F" strokeWidth="1.5" strokeLinecap="round" />

      {/* Small flowers */}
      <circle cx="150" cy="126" r="3" fill="#F5A623" opacity="0.6" />
      <line x1="150" y1="129" x2="150" y2="134" stroke="#7CE24F" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
