interface IllustrationProps {
  readonly className?: string;
}

export function EmptyRequests({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Sun */}
      <circle cx="160" cy="30" r="18" fill="#F5A623" opacity="0.9" />
      <line x1="160" y1="6" x2="160" y2="2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="160" y1="58" x2="160" y2="54" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="136" y1="30" x2="132" y2="30" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="188" y1="30" x2="184" y2="30" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />

      {/* Ground */}
      <rect x="0" y="120" width="200" height="40" rx="4" fill="#EFE3CC" />
      <ellipse cx="100" cy="120" rx="90" ry="6" fill="#C9A86E" opacity="0.3" />

      {/* Tractor body */}
      <rect x="50" y="82" width="48" height="30" rx="4" fill="#2D8A2D" />
      {/* Tractor cabin */}
      <rect x="62" y="66" width="28" height="20" rx="3" fill="#2D8A2D" />
      {/* Cabin window */}
      <rect x="66" y="70" width="20" height="12" rx="2" fill="#7CC8FF" opacity="0.7" />
      {/* Exhaust pipe */}
      <rect x="54" y="72" width="4" height="14" rx="2" fill="#B0ADA3" />
      <circle cx="56" cy="68" r="3" fill="#D4D1C9" opacity="0.6" />

      {/* Back wheel */}
      <circle cx="62" cy="118" r="14" fill="#B0ADA3" />
      <circle cx="62" cy="118" r="9" fill="#D4D1C9" />
      <circle cx="62" cy="118" r="3" fill="#B0ADA3" />

      {/* Front wheel */}
      <circle cx="94" cy="118" r="10" fill="#B0ADA3" />
      <circle cx="94" cy="118" r="6" fill="#D4D1C9" />
      <circle cx="94" cy="118" r="2" fill="#B0ADA3" />

      {/* Plus badge */}
      <circle cx="140" cy="90" r="16" fill="#6EC26E" />
      <line x1="140" y1="82" x2="140" y2="98" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="132" y1="90" x2="148" y2="90" stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* Small field lines */}
      <line x1="20" y1="126" x2="40" y2="126" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="120" y1="130" x2="145" y2="130" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="155" y1="126" x2="180" y2="126" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
