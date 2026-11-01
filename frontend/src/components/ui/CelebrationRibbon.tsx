
interface CelebrationRibbonProps {
  variant?: 'divider' | 'header' | 'logo' | 'accent';
  className?: string;
}

export function CelebrationRibbon({ variant = 'divider', className = '' }: CelebrationRibbonProps) {
  if (variant === 'logo') {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-8 h-8 ${className}`}
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="12" fill="var(--primary)" />
        {/* Celebration Ribbon flow */}
        <path
          d="M10 26C15 26 14 14 22 14C28 14 26 24 32 20"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Sparkle 1 */}
        <path
          d="M26 9L27 12L30 13L27 14L26 17L25 14L22 13L25 12L26 9Z"
          fill="var(--accent)"
        />
        {/* Sparkle 2 (small) */}
        <circle cx="13" cy="18" r="1.5" fill="var(--secondary)" />
      </svg>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`relative flex items-center justify-center my-3 select-none pointer-events-none ${className}`}>
        <svg
          width="160"
          height="24"
          viewBox="0 0 160 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle curved ribbon line */}
          <path
            d="M8 12C36 12 44 4 80 4C116 4 124 20 152 12"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="4 3"
            opacity="0.85"
          />
          {/* Center 4-point sparkle */}
          <path
            d="M80 6L81.5 10.5L86 12L81.5 13.5L80 18L78.5 13.5L74 12L78.5 10.5L80 6Z"
            fill="var(--accent)"
          />
          <circle cx="48" cy="8" r="1.5" fill="var(--primary)" opacity="0.7" />
          <circle cx="112" cy="12" r="1.5" fill="var(--secondary-text)" opacity="0.7" />
        </svg>
      </div>
    );
  }

  if (variant === 'accent') {
    return (
      <svg
        width="60"
        height="20"
        viewBox="0 0 60 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ${className}`}
        aria-hidden="true"
      >
        <path
          d="M2 14C16 14 20 6 36 6C48 6 52 14 58 10"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M36 2L37 5L40 6L37 7L36 10L35 7L32 6L35 5L36 2Z"
          fill="var(--accent)"
        />
      </svg>
    );
  }

  // Default: elegant section divider
  return (
    <div className={`celebration-ribbon-divider ${className}`} aria-hidden="true">
      <div className="flex-1 max-w-xs h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
      <div className="mx-4 flex items-center gap-2">
        <svg
          width="120"
          height="16"
          viewBox="0 0 120 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 8C24 8 32 3 60 3C88 3 96 13 116 8"
            stroke="var(--accent)"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            d="M60 3L61.2 6.5L64.5 7.5L61.2 8.5L60 12L58.8 8.5L55.5 7.5L58.8 6.5L60 3Z"
            fill="var(--accent)"
          />
        </svg>
      </div>
      <div className="flex-1 max-w-xs h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
    </div>
  );
}

export default CelebrationRibbon;
