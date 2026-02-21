import { useState } from "react";
import { Linkedin, Hash, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Post } from "@/data/mockData";

const channelIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  threads: Hash,
  email: Mail,
};

const channelLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  threads: "Threads",
  email: "Email Newsletter",
};

const statusStyles: Record<string, string> = {
  approved: "bg-status-approved/15 text-status-approved",
  pending: "bg-status-pending/15 text-status-pending",
  published: "bg-muted text-muted-foreground",
  draft: "bg-status-draft/15 text-status-draft",
};

interface PostDrawerProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  body: string;
}

export function PostDrawer({ post, open, onOpenChange, body }: PostDrawerProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  if (!post) return null;

  const Icon = channelIcons[post.channel];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto scrollbar-thin">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-accent rounded-full px-3 py-1">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{channelLabels[post.channel]}</span>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[post.status]}`}>
              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
          </div>
          <SheetTitle className="text-lg mt-3">{post.hook}</SheetTitle>
          <SheetDescription>
            Scheduled for {post.date} at {post.time}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Post body */}
          <div className="prose prose-sm max-w-none">
            {body.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed mb-3 whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>

          {/* Comment section */}
          {showComment && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add your feedback or change request..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {post.status !== "published" && (
              <>
                <Button variant="success" className="flex-1 h-11 text-sm font-semibold">
                  ✓ Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 text-sm"
                  onClick={() => setShowComment(!showComment)}
                >
                  Request Changes
                </Button>
              </>
            )}
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            View in Buffer
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
