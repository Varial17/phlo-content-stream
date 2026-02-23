import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChannelPill } from "@/components/shared/ChannelPill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { toast } from "sonner";

const angleColors: Record<string, string> = {
  Educational: "bg-blue-100 text-blue-700",
  Opinion: "bg-purple-100 text-purple-700",
  "Case Study": "bg-teal-100 text-teal-700",
  Trending: "bg-amber-100 text-amber-700",
  Story: "bg-pink-100 text-pink-700",
};

export default function ClientIdeationPage() {
  const { clientSlug } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [angleFilter, setAngleFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
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
      const { data } = await supabase.from("ideas").select("*").eq("client_id", clientSlug!).order("relevance", { ascending: false });
      return data ?? [];
    },
    enabled: !!clientSlug,
  });

  const filtered = useMemo(() => {
    return ideas.filter((idea: any) => {
      if (search && !idea.hook.toLowerCase().includes(search.toLowerCase())) return false;
      if (channelFilter !== "all") {
        const channels = idea.channel as string[] | null;
        if (!channels?.includes(channelFilter)) return false;
      }
      if (angleFilter !== "all" && idea.angle !== angleFilter) return false;
      return true;
    });
  }, [ideas, search, channelFilter, angleFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ideate", {
        body: { client_id: clientSlug },
      });
      if (error) throw error;
      toast.success(`${data?.count ?? 0} new ideas generated!`);
      queryClient.invalidateQueries({ queryKey: ["client-ideas", clientSlug] });
    } catch (e: any) {
      toast.error("Failed to refresh ideas: " + e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerate = async (id: string) => {
    setGeneratingIds((s) => new Set(s).add(id));
    try {
      const idea = ideas.find((i: any) => i.id === id);
      const channel = (idea?.channel as string[])?.[0] || "linkedin";
      const { error } = await supabase.functions.invoke("generate-post", {
        body: { idea_id: id, channel, client_id: clientSlug },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["client-ideas", clientSlug] });
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post generated!");
    } catch (e: any) {
      toast.error("Generation failed: " + e.message);
    } finally {
      setGeneratingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    for (const id of selected) {
      await handleGenerate(id);
    }
    setSelected(new Set());
    setBulkGenerating(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const relevanceDot = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 5) return "bg-amber-500";
    return "bg-slate-400";
  };

  const channelFilters = ["all", "linkedin", "threads", "email"];
  const angleFilters = ["all", "Educational", "Opinion", "Case Study", "Trending", "Story"];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Ideas</h1>
          <p className="text-sm text-muted-foreground">AI-generated ideas for {client?.name ?? "…"} — refreshed monthly</p>
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
          <AILoadingState message={`Searching for trends in ${client?.name ? `${client.name}'s industry` : "your industry"}…`} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mt-4 mb-2">
        {channelFilters.map((f) => (
          <button key={f} onClick={() => setChannelFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${channelFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {f === "all" ? "All" : f === "email" ? "Email Newsletter" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {angleFilters.map((f) => (
          <button key={f} onClick={() => setAngleFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${angleFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {f === "all" ? "All Topics" : f}
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
              <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Hook / Subject Line</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">Angle</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">Channel</th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  Relevance
                  <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger><TooltipContent>Scored based on your industry, current news, and seasonal timing</TooltipContent></Tooltip>
                </span>
              </th>
              <th className="w-32 px-3 py-3 text-right text-xs font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea: any, idx: number) => {
              const isDrafted = idea.status === "drafted" || idea.status === "queued";
              const isGenerating = generatingIds.has(idea.id);

              return (
                <tr key={idea.id} className={`border-b hover:bg-blue-50/50 transition-colors ${isDrafted ? "border-l-2 border-l-emerald-500" : ""}`}>
                  <td className="px-3 py-3"><Checkbox checked={selected.has(idea.id)} onCheckedChange={() => toggleSelect(idea.id)} /></td>
                  <td className="px-2 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <button className="text-left font-medium text-foreground hover:text-primary transition-colors" onClick={() => setExpandedRow(expandedRow === idea.id ? null : idea.id)}>
                      {idea.hook}
                    </button>
                    {expandedRow === idea.id && (
                      <div className="mt-2 pl-2 border-l-2 border-muted text-xs text-muted-foreground space-y-1">
                        {idea.source_summary && <p>📰 {idea.source_summary}</p>}
                        {idea.source_url && <a href={idea.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline block">Source →</a>}
                        <Button size="sm" className="mt-2" onClick={() => handleGenerate(idea.id)} disabled={isGenerating}>
                          <Sparkles className="h-3 w-3 mr-1" /> Generate Post
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {idea.angle && <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${angleColors[idea.angle] ?? "bg-muted text-muted-foreground"}`}>{idea.angle}</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">{(idea.channel as string[] | null)?.map((ch: string) => <ChannelPill key={ch} channel={ch} />)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={`h-2 w-2 rounded-full ${relevanceDot(idea.relevance ?? 0)}`} />
                      {idea.relevance ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {isDrafted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3 w-3" /> Drafted</span>
                    ) : isGenerating ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground animate-pulse">Generating…</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleGenerate(idea.id)}>
                        <Sparkles className="h-3 w-3 mr-1" /> Generate Post
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-lg px-6 py-3 shadow-xl flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selected.size} ideas selected</span>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleBulkGenerate} disabled={bulkGenerating}>
            {bulkGenerating ? "Generating…" : "Generate All Posts"}
          </Button>
        </div>
      )}
    </div>
  );
}
