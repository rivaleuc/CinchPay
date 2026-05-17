export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="apg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b8cff" />
          <stop offset="100%" stopColor="#3b6fe6" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" stroke="url(#apg)" strokeOpacity="0.5" />
      <path d="M6 17L9 7H12L15 17H12.5L12 14.8H9L8.5 17H6Z" fill="url(#apg)" />
      <circle cx="17" cy="9" r="1.5" fill="url(#apg)" />
    </svg>
  );
}
