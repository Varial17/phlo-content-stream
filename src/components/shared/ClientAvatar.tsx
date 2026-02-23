interface ClientAvatarProps {
  initials: string;
  color: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function ClientAvatar({ initials, color, avatarUrl, size = "md" }: ClientAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className={`${sizeMap[size]} rounded-lg object-cover shrink-0`}
      />
    );
  }

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
