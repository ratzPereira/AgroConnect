interface IllustrationProps {
  readonly className?: string;
}

export function EmptyTransactions({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Wallet body */}
      <rect x="40" y="55" width="80" height="55" rx="8" fill="#C9A86E" />

      {/* Wallet flap */}
      <path
        d="M40 70 Q40 50 60 50 L120 50 Q130 50 130 60 L130 70 Z"
        fill="#EFE3CC"
      />

      {/* Wallet clasp */}
      <circle cx="120" cy="70" r="5" fill="#C9A86E" />
      <circle cx="120" cy="70" r="3" fill="#EFE3CC" />

      {/* Wallet stitching */}
      <line x1="48" y1="80" x2="112" y2="80" stroke="#EFE3CC" strokeWidth="1" strokeDasharray="4 3" />

      {/* Coin 1 — large */}
      <circle cx="145" cy="90" r="14" fill="#F5A623" />
      <circle cx="145" cy="90" r="10" fill="#F5A623" opacity="0.7" />
      <text x="145" y="94" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">$</text>

      {/* Coin 2 — medium */}
      <circle cx="155" cy="68" r="11" fill="#F5A623" opacity="0.8" />
      <circle cx="155" cy="68" r="7.5" fill="#F5A623" opacity="0.6" />
      <text x="155" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">$</text>

      {/* Coin 3 — small, tilted look */}
      <ellipse cx="170" cy="100" rx="9" ry="10" fill="#F5A623" opacity="0.7" />
      <ellipse cx="170" cy="100" rx="6" ry="7" fill="#F5A623" opacity="0.5" />

      {/* Sparkle star */}
      <path
        d="M165 50 L167 46 L169 50 L173 52 L169 54 L167 58 L165 54 L161 52 Z"
        fill="#F5A623"
        opacity="0.6"
      />

      {/* Small sparkle */}
      <path
        d="M50 40 L51 37 L52 40 L55 41 L52 42 L51 45 L50 42 L47 41 Z"
        fill="#6EC26E"
        opacity="0.4"
      />

      {/* Ground shadow */}
      <ellipse cx="100" cy="130" rx="70" ry="6" fill="#E8E6E0" opacity="0.5" />
    </svg>
  );
}
