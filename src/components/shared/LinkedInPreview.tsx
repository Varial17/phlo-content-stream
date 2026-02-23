import { useState, useRef, useEffect } from "react";

interface LinkedInPreviewProps {
  post: any;
  clientSlug?: string;
}

export function LinkedInPreview({ post, clientSlug }: LinkedInPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpanded(false);
  }, [post.id]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight + 2);
    }
  }, [post.body, expanded]);

  return (
    <div className="rounded-lg border bg-white overflow-hidden" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
          {clientSlug?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#000000E6] leading-tight">{clientSlug}</p>
          <p className="text-xs text-[#00000099] leading-tight mt-0.5">1h • <span>🌐</span></p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-2 pb-1 relative">
        <div
          ref={bodyRef}
          className={`text-sm text-[#000000E6] whitespace-pre-wrap leading-[1.4] ${!expanded ? "line-clamp-3" : ""}`}
        >
          {post.body || "No content yet."}
        </div>
        {isClamped && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-[#00000099] hover:text-[#0a66c2] hover:underline mt-0.5"
          >
            …more
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full object-cover max-h-[350px] mt-2"
        />
      )}

      {/* Reactions row */}
      <div className="flex items-center justify-between px-4 py-1.5 text-xs text-[#00000099]">
        <div className="flex items-center gap-0.5">
          <span className="text-sm">👍❤️😂</span>
          <span className="ml-1">25</span>
        </div>
        <div className="flex items-center gap-2">
          <span>23 comments</span>
          <span>•</span>
          <span>3 reposts</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[#0000001a]" />

      {/* Action buttons */}
      <div className="flex items-center justify-around py-1 px-2">
        {[
          { icon: "👍", label: "Like" },
          { icon: "💬", label: "Comment" },
          { icon: "🔄", label: "Repost" },
          { icon: "📤", label: "Send" },
        ].map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded hover:bg-[#00000008] transition-colors"
          >
            <span className="text-base">{action.icon}</span>
            <span className="text-xs font-semibold text-[#00000099]">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
