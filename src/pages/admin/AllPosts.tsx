import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, AlertTriangle, Sparkles, X, Check, CalendarIcon, Mail, List, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusPill } from "@/components/shared/StatusPill";
import { ChannelPill } from "@/components/shared/ChannelPill";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { AIDiffViewer } from "@/components/shared/AIDiffViewer";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { PostImageSection } from "@/components/admin/PostImageSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { NewPostDialog } from "@/components/shared/NewPostDialog";

const staffOptions = ["Daniel", "Hannah", "Jack", "Unassigned"];
const statusOptions = ["draft", "pending", "approved", "published"];

export default function AdminAllPostsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editHook, setEditHook] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editHtmlBody, setEditHtmlBody] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [saved, setSaved] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishedText, setPolishedText] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name,initials,color").order("name");
      return data ?? [];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").order("scheduled_date", { ascending: true });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return posts.filter((p: any) => {
      if (clientFilter !== "all" && p.client_id !== clientFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [posts, clientFilter, statusFilter]);

  const selectedPost = useMemo(() => posts.find((p: any) => p.id === selectedPostId) ?? null, [posts, selectedPostId]);
  const clientMap = useMemo(() => {
    const m: Record<string, any> = {};
    clients.forEach((c: any) => { m[c.id] = c; });
    return m;
  }, [clients]);

  const handleSelectPost = (post: any) => {
    setSelectedPostId(post.id);
    setEditHook(post.hook);
    setEditBody(post.body ?? "");
    setEditHtmlBody(post.html_body ?? "");
    setEditAssigned(post.assigned_to ?? "Unassigned");
    setSaved(false);
    setPolishedText(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("posts").update({ hook: editHook, body: editBody, html_body: editHtmlBody || null, assigned_to: editAssigned === "Unassigned" ? null : editAssigned }).eq("id", selectedPostId!);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-posts"] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("posts").delete().eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      setSelectedPostId(null);
      toast.success("Post discarded");
    },
  });

  const pushMutation = useMutation({
    mutationFn: async (postId: string) => {
      const updateData: any = { status: "pending" };
      if (scheduledDate) {
        updateData.scheduled_date = format(scheduledDate, "yyyy-MM-dd");
        updateData.scheduled_time = scheduledTime;
      }
      await supabase.from("posts").update(updateData).eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      setScheduledDate(undefined);
      setScheduledTime("09:00");
      toast.success("Pushed to client for approval!");
    },
  });

  const handlePolish = async () => {
    if (!selectedPost) return;
    setPolishing(true);
    setPolishedText(null);
    try {
      const { data, error } = await supabase.functions.invoke("polish-post", {
        body: { post_id: selectedPost.id, client_id: selectedPost.client_id },
      });
      if (error) throw error;
      setOriginalText(data?.original ?? editBody);
      setPolishedText(data?.polished ?? "");
    } catch (e: any) {
      toast.error("Polish failed: " + e.message);
    } finally {
      setPolishing(false);
    }
  };

  const handleAcceptPolish = async () => {
    if (!polishedText || !selectedPostId) return;
    setEditBody(polishedText);
    // Extract new hook from first line
    const firstLine = polishedText.split("\n").find((l: string) => l.trim());
    if (firstLine) setEditHook(firstLine.slice(0, 100));
    await supabase.from("posts").update({ body: polishedText, hook: firstLine?.slice(0, 100) || editHook }).eq("id", selectedPostId);
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    setPolishedText(null);
    toast.success("Polished version saved!");
  };

  return (
    <div className="flex h-screen">
      {/* Posts list */}
      <div className={`${selectedPostId ? "w-[calc(100%-440px)]" : "w-full"} flex flex-col border-r`} style={{ borderColor: "#1F2D45" }}>
        <div className="p-4 border-b" style={{ borderColor: "#1F2D45" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">All Posts</h1>
              <div className="flex items-center rounded-md border ml-3" style={{ borderColor: "#1F2D45" }}>
                <button className="px-2.5 py-1.5 bg-blue-500/15 text-blue-400" title="List view">
                  <List className="h-3.5 w-3.5" />
                </button>
                <button className="px-2.5 py-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="Calendar view" onClick={() => navigate("/admin/posts/calendar")}>
                  <CalendarDays className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs" style={{ color: "#64748B" }}>Edit, assign, and push content to clients</p>
            </div>
          </div>
          <div className="flex items-center justify-end mb-3">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setNewPostOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New Post
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[160px] bg-transparent border-slate-700 text-slate-300 text-xs"><SelectValue placeholder="All Clients" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] bg-transparent border-slate-700 text-slate-300 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs ml-auto" style={{ color: "#64748B" }}>{filtered.length} posts</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((post: any) => {
            const client = clientMap[post.client_id];
            const isSelected = post.id === selectedPostId;
            return (
              <button key={post.id} onClick={() => handleSelectPost(post)} className={`w-full text-left p-3 border-b transition-colors ${isSelected ? "border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent hover:bg-white/5"}`} style={{ borderBottomColor: "#1F2D45", background: isSelected ? "#1A2235" : "transparent" }}>
                <div className="flex items-center gap-2 mb-1">
                  <ChannelPill channel={post.channel} />
                  {client && <ClientAvatar initials={client.initials} color={client.color} size="sm" />}
                  <span className="text-xs" style={{ color: "#94A3B8" }}>{client?.name}</span>
                  <span className="text-[10px]" style={{ color: "#64748B" }}>·</span>
                  <span className={`text-[10px] ${!post.assigned_to ? "text-amber-500" : ""}`} style={post.assigned_to ? { color: "#94A3B8" } : {}}>
                    {!post.assigned_to && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
                    {post.assigned_to ?? "Unassigned"}
                  </span>
                  {post.due_date && <span className="text-[10px]" style={{ color: "#64748B" }}>· Due {post.due_date}</span>}
                  <div className="flex-1" />
                  <StatusPill status={post.status} />
                </div>
                <p className="text-sm font-medium truncate">{post.hook}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit panel */}
      {selectedPostId && (
        <div className="w-[440px] flex flex-col" style={{ background: "#111827" }}>
          {selectedPost ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChannelPill channel={selectedPost.channel} showLabel />
                  <span className="text-sm font-semibold">Edit Post</span>
                </div>
                <button onClick={() => setSelectedPostId(null)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <div className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                {clientMap[selectedPost.client_id] && <ClientAvatar initials={clientMap[selectedPost.client_id].initials} color={clientMap[selectedPost.client_id].color} size="sm" />}
                <span>{clientMap[selectedPost.client_id]?.name}</span>
                <StatusPill status={selectedPost.status} />
              </div>

              {selectedPost.client_change_request && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-400 mb-1">Client feedback</p>
                  <p className="text-sm text-amber-200">{selectedPost.client_change_request}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Assigned To</label>
                <Select value={editAssigned} onValueChange={setEditAssigned}>
                  <SelectTrigger className="bg-transparent border-slate-700 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{staffOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <PostImageSection
                postId={selectedPost.id}
                imageUrl={selectedPost.image_url ?? null}
                onImageChange={() => queryClient.invalidateQueries({ queryKey: ["admin-posts"] })}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Hook / Subject Line</label>
                <Textarea value={editHook} onChange={(e) => { setEditHook(e.target.value); setSaved(false); }} className="bg-transparent border-slate-700 text-white min-h-[60px]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Post Body</label>
                  <span className="text-[10px]" style={{ color: "#64748B" }}>{editBody.length} chars</span>
                </div>
                <Textarea value={editBody} onChange={(e) => { setEditBody(e.target.value); setSaved(false); }} className="bg-transparent border-slate-700 text-white min-h-[200px]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Email HTML</label>
                  <span className="text-[10px]" style={{ color: "#64748B" }}>{editHtmlBody.length} chars</span>
                </div>
                <Textarea value={editHtmlBody} onChange={(e) => { setEditHtmlBody(e.target.value); setSaved(false); }} className="bg-transparent border-slate-700 text-white min-h-[160px] font-mono text-xs" placeholder="Paste or edit raw HTML for email…" />
              </div>

              {polishing && <AILoadingState message={`Polishing in ${clientMap[selectedPost.client_id]?.name ?? "brand"}'s voice…`} />}

              <Button
                variant="outline"
                size="sm"
                className="w-full border-border text-muted-foreground hover:text-foreground"
                onClick={() => window.open(`/admin/email-preview/${selectedPost.id}`, "_blank")}
              >
                <Mail className="h-3.5 w-3.5 mr-1" /> Email Preview
              </Button>

              {polishedText ? (
                <AIDiffViewer original={originalText} polished={polishedText} onAccept={handleAcceptPolish} onDiscard={() => setPolishedText(null)} />
              ) : (
                <Button variant="outline" size="sm" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10" onClick={handlePolish} disabled={polishing || !editBody}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Polish with AI
                </Button>
              )}

              <div className="flex gap-2">
                <Button className={`flex-1 ${saved ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"} text-white`} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saved ? <><Check className="h-4 w-4 mr-1" /> Saved</> : "Save Changes"}
                </Button>
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => { if (window.confirm("Delete this post permanently?")) deleteMutation.mutate(selectedPost.id); }} disabled={deleteMutation.isPending}>Discard Post</Button>
              </div>

              {selectedPost.status === "draft" && (
                <div className="space-y-3 rounded-lg p-3" style={{ background: "#0A0F1E", border: "1px solid #1F2D45" }}>
                  <p className="text-xs font-medium" style={{ color: "#94A3B8" }}>Schedule for Client Calendar</p>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal border-slate-700", !scheduledDate && "text-slate-500")}>
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                    <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-[110px] bg-transparent border-slate-700 text-white" />
                  </div>
                  <Button variant="outline" className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" onClick={() => pushMutation.mutate(selectedPost.id)} disabled={!scheduledDate || pushMutation.isPending}>
                    → Push to Client for Approval
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
      <NewPostDialog open={newPostOpen} onOpenChange={setNewPostOpen} />
    </div>
  );
}
