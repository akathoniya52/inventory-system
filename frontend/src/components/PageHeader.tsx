import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg md:font-display-sm md:text-display-sm text-on-surface">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
