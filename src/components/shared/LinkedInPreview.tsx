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
        <div className="h-12 w-12 rounded-full bg-[#1a1a1a] flex items-center justify-center text-sm font-bold text-white shrink-0">
          {clientSlug?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#000000E6] leading-tight">{clientSlug}</p>
          <p className="text-xs text-[#00000099] leading-tight mt-0.5">1h · <span>🌐</span></p>
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
          <div className="flex justify-end">
            <button
              onClick={() => setExpanded(true)}
              className="text-sm text-[#00000099] hover:text-[#0a66c2] hover:underline"
            >
              …more
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full object-cover mt-2"
        />
      )}

      {/* Divider */}
      <div className="mx-4 mt-1 border-t border-[#e0e0e0]" />

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
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded hover:bg-[#00000008] transition-colors"
          >
            <span className="text-lg">{action.icon}</span>
            <span className="text-[11px] font-medium text-[#00000099]">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
