import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles, Info, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChannelPill } from "@/components/shared/ChannelPill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

// Extended idea type to include new research fields (types.ts is auto-generated — not hand-edited)
type Idea = {
  id: string;
  hook: string;
  angle: string | null;
  channel: string[] | null;
  target_icp: string | null;
  relevance: number | null;
  treatment: string | null;
  why_this_post: string | null;
  research_findings: string | null;
  key_facts: string[] | null;
  source_url: string | null;
  source_summary: string | null;
  status: string | null;
};

const angleColors: Record<string, string> = {
  Insight: "bg-blue-100 text-blue-700",
  Opinion: "bg-purple-100 text-purple-700",
  "Case Study": "bg-teal-100 text-teal-700",
  List: "bg-amber-100 text-amber-700",
  "Market Commentary": "bg-indigo-100 text-indigo-700",
};

const relevanceDot = (score: number) => {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 5) return "bg-amber-500";
  return "bg-slate-400";
};

// ─── Research Drawer ──────────────────────────────────────────────────────────
function IdeaDrawer({
  idea,
  onClose,
  onGenerate,
  generating,
}: {
  idea: Idea | null;
  onClose: () => void;
  onGenerate: (id: string) => void;
  generating: boolean;
}) {
  if (!idea) return null;
  const isDrafted = idea.status === "drafted" || idea.status === "queued";

  return (
    <Sheet open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-base font-semibold leading-snug pr-6">
            {idea.hook}
          </SheetTitle>
          {idea.why_this_post && (
            <p className="text-sm text-muted-foreground mt-1">{idea.why_this_post}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {idea.angle && (
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${angleColors[idea.angle] ?? "bg-muted text-muted-foreground"}`}>
                {idea.angle}
              </span>
            )}
            {idea.target_icp && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                {idea.target_icp}
              </span>
            )}
            {(idea.channel ?? []).map((ch) => <ChannelPill key={ch} channel={ch} />)}
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Treatment */}
          {idea.treatment && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">How to write it</h3>
              <p className="text-sm text-foreground leading-relaxed">{idea.treatment}</p>
            </section>
          )}

          {/* Key Facts */}
          {idea.key_facts && idea.key_facts.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Key facts</h3>
              <ul className="space-y-1">
                {idea.key_facts.map((fact, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="text-muted-foreground mt-0.5">·</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Research Findings */}
          {idea.research_findings && (
            <section>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Research findings</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px]">
                    Verify facts before publishing — AI research can contain errors or outdated figures.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{idea.research_findings}</p>
              <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Verify before publishing
              </p>
            </section>
          )}

          {/* Source */}
          {(idea.source_url || idea.source_summary) && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Source</h3>
              {idea.source_summary && (
                <p className="text-sm text-muted-foreground mb-1">{idea.source_summary}</p>
              )}
              {idea.source_url && (
                <a
                  href={idea.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open source <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </section>
          )}
        </div>

        {/* Generate CTA */}
        <div className="px-6 py-4 border-t bg-muted/20">
          {isDrafted ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <Check className="h-4 w-4" /> Post already drafted from this idea
            </span>
          ) : (
            <Button className="w-full" onClick={() => onGenerate(idea.id)} disabled={generating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Generating post…" : "Generate Post"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientIdeationPage() {
  const { clientSlug } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [angleFilter, setAngleFilter] = useState("all");
  const [icpFilter, setIcpFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerIdea, setDrawerIdea] = useState<Idea | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const { data: client } = useQuery({
    queryKey: ["client", clientSlug],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("name").eq("id", clientSlug!).single();
      return data;
    },
    enabled: !!clientSlug,
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ["client-ideas", clientSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("ideas")
        .select("*")
        .eq("client_id", clientSlug!)
        .order("relevance", { ascending: false });
      return (data ?? []) as unknown as Idea[];
    },
    enabled: !!clientSlug,
  });

  // Derive unique ICP values from existing ideas
  const icpOptions = useMemo(() => {
    const vals = ideas.map((i) => i.target_icp).filter(Boolean) as string[];
    return ["all", ...Array.from(new Set(vals))];
  }, [ideas]);

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      if (search && !idea.hook.toLowerCase().includes(search.toLowerCase())) return false;
      if (channelFilter !== "all" && !idea.channel?.includes(channelFilter)) return false;
      if (angleFilter !== "all" && idea.angle !== angleFilter) return false;
      if (icpFilter !== "all" && idea.target_icp !== icpFilter) return false;
      return true;
    });
  }, [ideas, search, channelFilter, angleFilter, icpFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ideate", { body: { client_id: clientSlug } });
      if (error) throw error;
      toast.success(`${data?.count ?? 0} new ideas generated`);
      queryClient.invalidateQueries({ queryKey: ["client-ideas", clientSlug] });
    } catch (e: unknown) {
      toast.error("Failed to refresh ideas: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerate = async (id: string) => {
    setGeneratingIds((s) => new Set(s).add(id));
    try {
      const idea = ideas.find((i) => i.id === id);
      const channel = idea?.channel?.[0] ?? "linkedin";
      const { error } = await supabase.functions.invoke("generate-post", {
        body: { idea_id: id, channel, client_id: clientSlug },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["client-ideas", clientSlug] });
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post generated!");
      setDrawerIdea(null);
    } catch (e: unknown) {
      toast.error("Generation failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setGeneratingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    for (const id of selected) await handleGenerate(id);
    setSelected(new Set());
    setBulkGenerating(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const channelFilters = ["all", "linkedin", "threads", "email"];
  const angleFilters = ["all", "Insight", "Opinion", "Case Study", "List", "Market Commentary"];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Ideas</h1>
          <p className="text-sm text-muted-foreground">AI-researched ideas for {client?.name ?? "…"} — click any idea to explore the research</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search ideas…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-[200px]" />
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Refresh Ideas
          </Button>
        </div>
      </div>

      {refreshing && (
        <div className="mb-4">
          <AILoadingState message={`Researching trends for ${client?.name ?? "your client"}…`} />
        </div>
      )}

      {/* ICP filter */}
      {icpOptions.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-4 mb-2">
          {icpOptions.map((f) => (
            <button key={f} onClick={() => setIcpFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${icpFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {f === "all" ? "All Audiences" : f}
            </button>
          ))}
        </div>
      )}

      {/* Channel + angle filters */}
      <div className="flex flex-wrap gap-2 mt-2 mb-2">
        {channelFilters.map((f) => (
          <button key={f} onClick={() => setChannelFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${channelFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {f === "all" ? "All Channels" : f === "email" ? "Email" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {angleFilters.map((f) => (
          <button key={f} onClick={() => setAngleFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${angleFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {f === "all" ? "All Angles" : f}
          </button>
        ))}
      </div>

      {/* Ideas table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="w-10 px-3 py-3" />
              <th className="w-8 px-2 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Hook / Why this post</th>
              <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground">Angle</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">Channel</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  Relevance
                  <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                    <TooltipContent>Scored by AI based on your content pillars and target audiences</TooltipContent>
                  </Tooltip>
                </span>
              </th>
              <th className="w-28 px-3 py-3 text-right text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea, idx) => {
              const isDrafted = idea.status === "drafted" || idea.status === "queued";
              return (
                <tr key={idea.id}
                  className={`border-b hover:bg-blue-50/50 transition-colors cursor-pointer ${isDrafted ? "border-l-2 border-l-emerald-500" : ""}`}
                  onClick={() => setDrawerIdea(idea)}>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(idea.id)} onCheckedChange={() => toggleSelect(idea.id)} />
                  </td>
                  <td className="px-2 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{idea.hook}</p>
                    {idea.why_this_post && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idea.why_this_post}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {idea.angle && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${angleColors[idea.angle] ?? "bg-muted text-muted-foreground"}`}>
                        {idea.angle}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">{idea.channel?.map((ch) => <ChannelPill key={ch} channel={ch} />)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={`h-2 w-2 rounded-full ${relevanceDot(idea.relevance ?? 0)}`} />
                      {idea.relevance ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {isDrafted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check className="h-3 w-3" /> Drafted
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Click to open →</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No ideas match your filters. Try refreshing or clearing filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk generate bar */}
      {selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-lg px-6 py-3 shadow-xl flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selected.size} ideas selected</span>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleBulkGenerate} disabled={bulkGenerating}>
            {bulkGenerating ? "Generating…" : "Generate All Posts"}
          </Button>
        </div>
      )}

      {/* Research drawer */}
      <IdeaDrawer
        idea={drawerIdea}
        onClose={() => setDrawerIdea(null)}
        onGenerate={handleGenerate}
        generating={drawerIdea ? generatingIds.has(drawerIdea.id) : false}
      />
    </div>
  );
}
