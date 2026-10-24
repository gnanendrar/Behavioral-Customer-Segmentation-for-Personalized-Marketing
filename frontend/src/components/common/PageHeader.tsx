import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, description, action }: PageHeaderProps) {
  const sub = subtitle || description;
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 className="text-[28px] font-bold leading-[1.1] text-gray-900 sm:text-[32px]" style={{ fontStretch: '118%', letterSpacing: '-0.025em' }}>
          {title}
        </h2>
        {sub && <p className="mt-2 text-[15px] leading-relaxed text-gray-500">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </div>
  );
}

export default PageHeader;
