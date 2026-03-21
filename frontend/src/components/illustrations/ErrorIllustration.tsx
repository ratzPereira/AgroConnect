interface IllustrationProps {
  className?: string;
}

export function ErrorIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Flower pot */}
      <path
        d="M75 95 L68 135 L132 135 L125 95 Z"
        fill="#C9A86E"
      />
      {/* Pot rim */}
      <rect x="70" y="90" width="60" height="10" rx="3" fill="#C9A86E" />
      {/* Pot band */}
      <rect x="72" y="115" width="56" height="4" rx="1" fill="#EFE3CC" opacity="0.5" />

      {/* Soil */}
      <ellipse cx="100" cy="95" rx="26" ry="4" fill="#8B6F47" opacity="0.5" />

      {/* Drooping stem */}
      <path
        d="M100 92 Q100 60 95 50 Q92 42 80 38"
        stroke="#2D8A2D"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Wilted leaf (left, drooping down) */}
      <path
        d="M88 55 Q78 50 72 58 Q76 62 88 55"
        fill="#7CE24F"
        opacity="0.8"
      />

      {/* Wilted leaf (right, drooping) */}
      <path
        d="M95 48 Q102 40 98 34 Q92 38 95 48"
        fill="#7CE24F"
        opacity="0.6"
      />

      {/* Drooping flower head */}
      <circle cx="78" cy="36" r="8" fill="#E24B4A" opacity="0.6" />
      <circle cx="78" cy="36" r="4" fill="#F5A623" opacity="0.7" />

      {/* Sad raindrop */}
      <path
        d="M145 55 Q148 48 151 55 Q151 60 148 62 Q145 60 145 55 Z"
        fill="#7CC8FF"
        opacity="0.7"
      />

      {/* Small raindrop */}
      <path
        d="M135 70 Q136.5 67 138 70 Q138 73 136.5 74 Q135 73 135 70 Z"
        fill="#7CC8FF"
        opacity="0.5"
      />

      {/* Ground shadow */}
      <ellipse cx="100" cy="138" rx="40" ry="4" fill="#E8E6E0" opacity="0.5" />

      {/* Small wilted petals falling */}
      <circle cx="65" cy="50" r="2" fill="#E24B4A" opacity="0.3" />
      <circle cx="88" cy="28" r="1.5" fill="#E24B4A" opacity="0.25" />
    </svg>
  );
}
