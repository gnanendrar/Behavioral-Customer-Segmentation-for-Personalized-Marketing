/** BehaviorIQ mark: scattered points gathering into three groups. */
export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--a-600)" />
      <g fill="var(--surface)">
        <circle cx="10" cy="11" r="2.6" />
        <circle cx="14.2" cy="8.6" r="1.6" />
        <circle cx="12.6" cy="13.8" r="1.4" />
        <circle cx="22" cy="12" r="2.2" />
        <circle cx="24.4" cy="15.6" r="1.4" />
        <circle cx="13" cy="22.4" r="1.7" />
        <circle cx="17.4" cy="23.6" r="2.6" />
        <circle cx="21.4" cy="21" r="1.3" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-semibold text-[17px] tracking-[-0.02em] text-gray-900 ${className}`} style={{ fontStretch: '115%' }}>
      BehaviorIQ
    </span>
  );
}
