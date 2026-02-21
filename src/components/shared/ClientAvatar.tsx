interface ClientAvatarProps {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function ClientAvatar({ initials, color, size = "md" }: ClientAvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-lg flex items-center justify-center font-semibold shrink-0`}
      style={{
        backgroundColor: `${color}15`,
        border: `1.5px solid ${color}40`,
        color,
      }}
    >
      {initials}
    </div>
  );
}
