interface LandingHeroProps {
  className?: string;
}

export function LandingHero({ className }: LandingHeroProps) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Sky */}
      <rect width="240" height="200" fill="#7CC8FF" opacity="0.15" />

      {/* Sun */}
      <circle cx="195" cy="35" r="22" fill="#F5A623" opacity="0.9" />
      {/* Sun rays */}
      <line x1="195" y1="6" x2="195" y2="1" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="195" y1="69" x2="195" y2="64" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="166" y1="35" x2="161" y2="35" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="229" y1="35" x2="224" y2="35" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="175" y1="15" x2="172" y2="12" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="218" y1="55" x2="215" y2="58" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="175" y1="55" x2="172" y2="58" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <line x1="218" y1="15" x2="215" y2="12" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />

      {/* Distant rolling hills */}
      <ellipse cx="60" cy="90" rx="80" ry="25" fill="#2D8A2D" opacity="0.35" />
      <ellipse cx="170" cy="85" rx="90" ry="28" fill="#2D8A2D" opacity="0.3" />
      <ellipse cx="120" cy="95" rx="100" ry="22" fill="#2D8A2D" opacity="0.4" />

      {/* Terraced field background */}
      <path d="M0 110 Q60 85 120 100 Q180 115 240 100 L240 200 L0 200 Z" fill="#2D8A2D" opacity="0.6" />
      <path d="M0 125 Q60 105 120 118 Q180 130 240 115 L240 200 L0 200 Z" fill="#2D8A2D" opacity="0.7" />
      <path d="M0 140 Q60 125 120 135 Q180 145 240 132 L240 200 L0 200 Z" fill="#C9A86E" opacity="0.5" />

      {/* Ground */}
      <rect x="0" y="155" width="240" height="45" fill="#EFE3CC" />
      <ellipse cx="120" cy="155" rx="110" ry="7" fill="#C9A86E" opacity="0.3" />

      {/* Crop rows on the terraces */}
      <line x1="20" y1="118" x2="55" y2="112" stroke="#2D8A2D" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="20" y1="123" x2="55" y2="117" stroke="#2D8A2D" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="20" y1="128" x2="55" y2="122" stroke="#2D8A2D" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="65" y1="110" x2="100" y2="106" stroke="#2D8A2D" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="65" y1="115" x2="100" y2="111" stroke="#2D8A2D" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="65" y1="120" x2="100" y2="116" stroke="#2D8A2D" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

      {/* Farm building 1 (barn) */}
      <rect x="175" y="100" width="28" height="22" rx="2" fill="#C9A86E" />
      <polygon points="175,100 189,86 203,100" fill="#B08E4A" />
      <rect x="185" y="110" width="8" height="12" fill="#8F6F32" />
      {/* Barn window */}
      <rect x="178" y="105" width="5" height="5" rx="1" fill="#7CC8FF" opacity="0.6" />

      {/* Farm building 2 (small shed) */}
      <rect x="208" y="108" width="18" height="14" rx="2" fill="#C9A86E" opacity="0.9" />
      <polygon points="208,108 217,99 226,108" fill="#B08E4A" opacity="0.9" />

      {/* Tractor body */}
      <rect x="75" y="130" width="42" height="22" rx="3" fill="#2D8A2D" />
      {/* Tractor cabin */}
      <rect x="85" y="116" width="24" height="18" rx="3" fill="#2D8A2D" />
      {/* Cabin window */}
      <rect x="89" y="119" width="16" height="11" rx="2" fill="#7CC8FF" opacity="0.7" />
      {/* Exhaust pipe */}
      <rect x="78" y="121" width="3" height="12" rx="1.5" fill="#B0ADA3" />
      <circle cx="79.5" cy="117" r="2.5" fill="#D4D1C9" opacity="0.6" />

      {/* Tractor back wheel */}
      <circle cx="86" cy="157" r="13" fill="#B0ADA3" />
      <circle cx="86" cy="157" r="8.5" fill="#D4D1C9" />
      <circle cx="86" cy="157" r="3" fill="#B0ADA3" />

      {/* Tractor front wheel */}
      <circle cx="113" cy="157" r="9" fill="#B0ADA3" />
      <circle cx="113" cy="157" r="5.5" fill="#D4D1C9" />
      <circle cx="113" cy="157" r="2" fill="#B0ADA3" />

      {/* Field lines on ground */}
      <line x1="10" y1="165" x2="45" y2="165" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="172" x2="40" y2="172" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="130" y1="168" x2="165" y2="168" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="135" y1="175" x2="160" y2="175" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="175" y1="170" x2="220" y2="170" stroke="#C9A86E" strokeWidth="1.5" strokeLinecap="round" />

      {/* Small decorative plants */}
      <ellipse cx="150" cy="150" rx="4" ry="6" fill="#2D8A2D" opacity="0.5" />
      <ellipse cx="155" cy="151" rx="3" ry="5" fill="#2D8A2D" opacity="0.4" />
      <ellipse cx="35" cy="148" rx="4" ry="6" fill="#2D8A2D" opacity="0.5" />
      <ellipse cx="40" cy="149" rx="3" ry="5" fill="#2D8A2D" opacity="0.4" />

      {/* Clouds */}
      <ellipse cx="45" cy="30" rx="18" ry="8" fill="white" opacity="0.4" />
      <ellipse cx="55" cy="28" rx="14" ry="7" fill="white" opacity="0.3" />
      <ellipse cx="130" cy="22" rx="16" ry="7" fill="white" opacity="0.35" />
      <ellipse cx="140" cy="20" rx="12" ry="6" fill="white" opacity="0.25" />
    </svg>
  );
}
