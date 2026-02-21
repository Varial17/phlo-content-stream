import { Linkedin, Hash, Mail } from "lucide-react";
import type { Post } from "@/data/mockData";

const channelColors: Record<string, string> = {
  linkedin: "bg-channel-linkedin",
  threads: "bg-channel-threads",
  email: "bg-channel-email",
};

const channelIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  threads: Hash,
  email: Mail,
};

const statusStyles: Record<string, string> = {
  approved: "bg-status-approved/15 text-status-approved",
  pending: "bg-status-pending/15 text-status-pending",
  published: "bg-muted text-muted-foreground",
  draft: "bg-status-draft/15 text-status-draft",
};

const statusLabels: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  published: "Published",
  draft: "Draft",
};

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const Icon = channelIcons[post.channel];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all flex overflow-hidden group"
    >
      <div className={`w-[3px] shrink-0 ${channelColors[post.channel]}`} />
      <div className="flex-1 px-2 py-1.5 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground">{post.time}</span>
          <span className={`ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${statusStyles[post.status]}`}>
            {statusLabels[post.status]}
          </span>
        </div>
        <p className="text-[11px] text-foreground leading-tight truncate">
          {post.hook}
        </p>
      </div>
    </button>
  );
}
