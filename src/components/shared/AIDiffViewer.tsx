import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface AIDiffViewerProps {
  original: string;
  polished: string;
  onAccept: () => void;
  onDiscard: () => void;
}

export function AIDiffViewer({ original, polished, onAccept, onDiscard }: AIDiffViewerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium" style={{ color: "#94A3B8" }}>Original</p>
          <div className="rounded-md p-3 text-sm whitespace-pre-wrap" style={{ background: "#0A0F1E", border: "1px solid #1F2D45", color: "#94A3B8" }}>
            {original}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-400">✦ Polished</p>
          <div className="rounded-md p-3 text-sm whitespace-pre-wrap" style={{ background: "#0A0F1E", border: "1px solid rgba(59,130,246,0.3)", color: "#F1F5F9" }}>
            {polished}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAccept}>
          <Check className="h-3.5 w-3.5 mr-1" /> Accept
        </Button>
        <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={onDiscard}>
          <X className="h-3.5 w-3.5 mr-1" /> Discard
        </Button>
      </div>
    </div>
  );
}
