import { Linkedin, Mail, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const channelConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  linkedin: { icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50", label: "LinkedIn" },
  threads: { icon: Hash, color: "text-purple-600", bg: "bg-purple-50", label: "Threads" },
  email: { icon: Mail, color: "text-emerald-600", bg: "bg-emerald-50", label: "Email" },
};

interface ChannelPillProps {
  channel: string;
  showLabel?: boolean;
  className?: string;
}

export function ChannelPill({ channel, showLabel = false, className }: ChannelPillProps) {
  const config = channelConfig[channel] ?? channelConfig.linkedin;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5", config.bg, config.color, className)}>
      <Icon className="h-3 w-3" />
      {showLabel && <span className="text-[10px] font-medium">{config.label}</span>}
    </span>
  );
}
