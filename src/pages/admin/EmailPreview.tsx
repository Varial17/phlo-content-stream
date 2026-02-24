import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowLeft, Eye, Code } from "lucide-react";
import { toast } from "sonner";

function generateEmailHtml(hook: string, body: string): string {
  const paragraphs = body
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((p) => {
      const lines = p
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("<br/>");
      return `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.8;color:#333333;">${lines}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${hook}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:4px;">
<tr><td style="padding:40px 32px;">
<h2 style="margin:0 0 8px 0;font-size:22px;font-weight:bold;color:#1a1a1a;text-decoration:underline;font-family:Georgia,'Times New Roman',serif;line-height:1.4;">${hook}</h2>
<hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;" />
${paragraphs}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export default function EmailPreviewPage() {
  const { postId } = useParams<{ postId: string }>();
  const [mode, setMode] = useState<"preview" | "html">("preview");
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["email-preview-post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  const emailHtml = useMemo(() => {
    if (!post) return "";
    return generateEmailHtml(post.hook, post.body ?? "");
  }, [post]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(emailHtml);
    setCopied(true);
    toast.success("HTML copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading post…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/posts" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-semibold truncate max-w-[300px]">{post.hook}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setMode("preview")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${mode === "preview" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            <button
              onClick={() => setMode("html")}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${mode === "html" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              <Code className="h-3.5 w-3.5" /> HTML
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy HTML</>}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex justify-center py-8 px-4">
        {mode === "preview" ? (
          <div
            className="w-full max-w-[650px] rounded-lg shadow-lg overflow-hidden"
            dangerouslySetInnerHTML={{ __html: emailHtml }}
          />
        ) : (
          <pre className="w-full max-w-[800px] bg-background border border-border rounded-lg p-6 text-xs overflow-x-auto whitespace-pre-wrap text-foreground font-mono">
            {emailHtml}
          </pre>
        )}
      </div>
    </div>
  );
}
