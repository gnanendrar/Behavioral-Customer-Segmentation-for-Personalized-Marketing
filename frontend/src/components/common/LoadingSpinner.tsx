import { LogoMark } from './Logo';

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <LogoMark className="h-10 w-10 animate-pulse-slow" />
      <p className="text-[14px] text-gray-500">Loading…</p>
    </div>
  );
}
