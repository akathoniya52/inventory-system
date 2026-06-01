interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className = "", filled = false }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${filled ? "icon-filled" : ""} ${className}`}>
      {name}
    </span>
  );
}
