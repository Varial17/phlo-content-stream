import { useState } from "react";
import { Search, RefreshCw, Sparkles, Check, Info, Linkedin, Hash, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ideaItems, type Idea } from "@/data/mockData";

const channelFilters = ["All", "LinkedIn", "Threads", "Email Newsletter"];
const topicFilters = ["All Topics", "Tax & Compliance", "SMSF", "Wealth Management", "Business Finance", "Market Updates", "Behind the Business", "Client Stories"];

const angleStyles: Record<string, string> = {
  Educational: "bg-primary/10 text-primary",
  Opinion: "bg-channel-threads/10 text-channel-threads",
  "Case Study": "bg-channel-email/10 text-channel-email",
  Trending: "bg-warning/10 text-warning",
  Story: "bg-pink-100 text-pink-600",
};

const channelIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  threads: Hash,
  email: Mail,
};

function RelevanceDot({ score }: { score: number }) {
  const color = score >= 8 ? "bg-success" : score >= 5 ? "bg-warning" : "bg-muted";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm font-medium text-foreground">{score}/10</span>
    </div>
  );
}

function ChannelDisplay({ channel }: { channel: string }) {
  if (channel === "linkedin+threads") {
    return (
      <div className="flex items-center gap-1">
        <Linkedin className="h-4 w-4 text-channel-linkedin" />
        <Hash className="h-4 w-4 text-foreground" />
      </div>
    );
  }
  const Icon = channelIcons[channel];
  return Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null;
}

export default function IdeationPage() {
  const [activeChannel, setActiveChannel] = useState("All");
  const [activeTopic, setActiveTopic] = useState("All Topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGeneratingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setQueuedIds((prev) => new Set(prev).add(id));
    }, 1500);
  };

  const handleBulkGenerate = () => {
    selectedIds.forEach((id) => handleGenerate(id));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 max-w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Ideas</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated ideas for Hash Financial Group — refreshed monthly</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[220px]"
            />
          </div>
          <Button>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh Ideas
          </Button>
        </div>
      </div>

      {/* Channel filters */}
      <div className="flex gap-2 mt-5 mb-3">
        {channelFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveChannel(f)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeChannel === f
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Topic filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {topicFilters.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTopic(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTopic === t
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-8 px-3 py-3" />
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 w-8">#</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Hook / Subject Line</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 w-[100px]">Angle</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 w-[80px]">Channel</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3 w-[100px]">
                <span className="flex items-center gap-1">
                  Relevance
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      Scored based on your industry, current news, and seasonal timing
                    </TooltipContent>
                  </Tooltip>
                </span>
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground px-3 py-3 w-[140px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {ideaItems.map((idea, idx) => (
              <IdeaRow
                key={idea.id}
                idea={idea}
                index={idx + 1}
                isGenerating={generatingIds.has(idea.id)}
                isQueued={queuedIds.has(idea.id)}
                isSelected={selectedIds.has(idea.id)}
                isExpanded={expandedId === idea.id}
                onToggleSelect={() => toggleSelect(idea.id)}
                onGenerate={() => handleGenerate(idea.id)}
                onToggleExpand={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedIds.size} ideas selected</span>
          <Button size="sm" onClick={handleBulkGenerate} className="bg-primary hover:bg-primary/90">
            Generate All Posts
          </Button>
        </div>
      )}
    </div>
  );
}

interface IdeaRowProps {
  idea: Idea;
  index: number;
  isGenerating: boolean;
  isQueued: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onGenerate: () => void;
  onToggleExpand: () => void;
}

function IdeaRow({ idea, index, isGenerating, isQueued, isSelected, isExpanded, onToggleSelect, onGenerate, onToggleExpand }: IdeaRowProps) {
  return (
    <>
      <tr className={`border-b border-border hover:bg-accent/30 transition-colors group ${isQueued ? "border-l-2 border-l-success" : ""}`}>
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-border opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity accent-primary"
          />
        </td>
        <td className="px-3 py-3 text-sm text-muted-foreground">{index}</td>
        <td className="px-3 py-3">
          <button onClick={onToggleExpand} className="text-sm font-medium text-foreground text-left hover:text-primary transition-colors">
            {idea.hook}
          </button>
        </td>
        <td className="px-3 py-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${angleStyles[idea.angle]}`}>
            {idea.angle}
          </span>
        </td>
        <td className="px-3 py-3">
          <ChannelDisplay channel={idea.channel} />
        </td>
        <td className="px-3 py-3">
          <RelevanceDot score={idea.relevance} />
        </td>
        <td className="px-3 py-3 text-right">
          {isQueued ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
              <Check className="h-4 w-4" /> Queued
            </span>
          ) : isGenerating ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…
            </span>
          ) : (
            <Button size="sm" onClick={onGenerate}>
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Generate Post
            </Button>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-accent/20">
          <td colSpan={7} className="px-12 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Suggested talking points:</p>
            <ul className="space-y-1 mb-3">
              {idea.talkingPoints.map((tp, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  {tp}
                </li>
              ))}
            </ul>
            {!isQueued && !isGenerating && (
              <Button size="sm" onClick={onGenerate}>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate Post
              </Button>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function RefreshCw2(props: any) {
  return <RefreshCw {...props} />;
}
