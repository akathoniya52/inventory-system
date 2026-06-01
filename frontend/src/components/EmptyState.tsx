import { Icon } from "./Icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
        <Icon name={icon} className="text-on-surface-variant text-[28px]" />
      </div>
      <p className="font-headline-sm text-headline-sm text-on-surface">{title}</p>
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}
