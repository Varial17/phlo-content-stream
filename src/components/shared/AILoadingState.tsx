import { Sparkles } from "lucide-react";

interface AILoadingStateProps {
  message?: string;
}

export function AILoadingState({ message = "Processing…" }: AILoadingStateProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
      <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
      <span className="text-sm text-blue-300 animate-pulse">{message}</span>
    </div>
  );
}
