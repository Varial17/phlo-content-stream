import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Plus, X, Check, Sparkles, Mail, CalendarIcon, List, CalendarDays } from "lucide-react";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { NewPostDialog } from "@/components/shared/NewPostDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";

const staffOptions = ["Anh Nguyen", "James Pham", "Unassigned"];

export default function AdminCalendarViewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newPostOpen, setNewPostOpen] = useState(false);

  // Edit drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editHook, setEditHook] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editHtmlBody, setEditHtmlBody] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [saved, setSaved] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishedText, setPolishedText] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name,initials,color").order("name");
      return data ?? [];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-calendar-posts", selectedClientId, format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      let q = supabase
        .from("posts")
        .select("*")
        .gte("scheduled_date", format(monthStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(monthEnd, "yyyy-MM-dd"))
        .order("scheduled_time");
      if (selectedClientId !== "all") {
        q = q.eq("client_id", selectedClientId);
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  const clientMap = useMemo(() => {
    const m: Record<string, any> = {};
    clients.forEach((c: any) => { m[c.id] = c; });
    return m;
  }, [clients]);

  const selectedPost = useMemo(() => posts.find((p: any) => p.id === selectedPostId) ?? null, [posts, selectedPostId]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const postsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    posts.forEach((p: any) => {
      const key = p.scheduled_date;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  // Stats
  const stats = useMemo(() => {
    const total = posts.length;
    const approved = posts.filter((p: any) => p.status === "approved").length;
    const pending = posts.filter((p: any) => p.status === "pending").length;
    const draft = posts.filter((p: any) => p.status === "draft").length;
    return { total, approved, pending, draft };
  }, [posts]);

  const channelBar: Record<string, string> = {
    linkedin: "bg-blue-500",
    threads: "bg-purple-500",
    email: "bg-emerald-500",
  };

  const handleSelectPost = (post: any) => {
    setSelectedPostId(post.id);
    setEditHook(post.hook);
    setEditBody(post.body ?? "");
    setEditHtmlBody(post.html_body ?? "");
    setEditAssigned(post.assigned_to ?? "Unassigned");
    setSaved(false);
    setPolishedText(null);
    setDrawerOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("posts").update({ hook: editHook, body: editBody, html_body: editHtmlBody || null, assigned_to: editAssigned === "Unassigned" ? null : editAssigned }).eq("id", selectedPostId!);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-calendar-posts"] }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("posts").delete().eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-calendar-posts"] });
      setSelectedPostId(null);
      setDrawerOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["admin-calendar-posts"] });
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
    const firstLine = polishedText.split("\n").find((l: string) => l.trim());
    if (firstLine) setEditHook(firstLine.slice(0, 100));
    await supabase.from("posts").update({ body: polishedText, hook: firstLine?.slice(0, 100) || editHook }).eq("id", selectedPostId);
    queryClient.invalidateQueries({ queryKey: ["admin-calendar-posts"] });
    setPolishedText(null);
    toast.success("Polished version saved!");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="p-4 border-b" style={{ borderColor: "#1F2D45" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">All Posts</h1>
            <div className="flex items-center rounded-md border ml-3" style={{ borderColor: "#1F2D45" }}>
              <button className="px-2.5 py-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="List view" onClick={() => navigate("/admin/posts")}>
                <List className="h-3.5 w-3.5" />
              </button>
              <button className="px-2.5 py-1.5 bg-blue-500/15 text-blue-400" title="Calendar view">
                <CalendarDays className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs" style={{ color: "#64748B" }}>Visualise and edit content on the calendar</p>
          <div className="flex items-center gap-3">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-[180px] bg-transparent border-slate-700 text-slate-300 text-xs">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <ClientAvatar initials={c.initials} color={c.color} size="sm" />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[140px] text-center">{format(currentDate, "MMMM yyyy")}</span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            </div>

            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setNewPostOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New Post
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Draft", value: stats.draft },
            { label: "Pending", value: stats.pending },
            { label: "Approved", value: stats.approved },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "#1A2235" }}>
              <span className="text-sm font-bold">{s.value}</span>
              <span className="text-[10px]" style={{ color: "#64748B" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#1F2D45" }}>
          {/* Day headers */}
          <div className="grid grid-cols-7" style={{ borderBottom: "1px solid #1F2D45" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-3 py-2 text-xs font-medium text-center" style={{ color: "#64748B" }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayPosts = postsByDate[dateKey] ?? [];
              const inMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={i}
                  className="min-h-[120px] p-1.5"
                  style={{
                    borderBottom: "1px solid #1F2D45",
                    borderRight: "1px solid #1F2D45",
                    background: !inMonth ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                >
                  <div className="flex justify-end mb-1">
                    <span
                      className={`text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full ${
                        isToday(day)
                          ? "bg-blue-500 text-white"
                          : inMonth
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((post: any) => {
                      const client = clientMap[post.client_id];
                      return (
                        <button
                          key={post.id}
                          onClick={() => handleSelectPost(post)}
                          className="w-full text-left group"
                        >
                          <div className="flex rounded overflow-hidden border transition-colors hover:border-blue-500/50" style={{ borderColor: "#1F2D45", background: "#111827" }}>
                            <div className={`w-[3px] shrink-0 ${channelBar[post.channel] ?? "bg-slate-600"}`} />
                            <div className="flex-1 p-1.5 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <ChannelPill channel={post.channel} />
                                {selectedClientId === "all" && client && (
                                  <ClientAvatar initials={client.initials} color={client.color} size="sm" />
                                )}
                                <span className="text-[10px]" style={{ color: "#64748B" }}>{post.scheduled_time}</span>
                                <div className="flex-1" />
                                <StatusPill status={post.status} />
                              </div>
                              <p className="text-[11px] font-medium truncate leading-tight text-slate-200">
                                {post.hook}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {dayPosts.length > 3 && (
                      <p className="text-[10px] text-center" style={{ color: "#64748B" }}>+{dayPosts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[440px] sm:w-[440px] overflow-y-auto" style={{ background: "#111827", borderLeft: "1px solid #1F2D45" }}>
          {selectedPost && (
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChannelPill channel={selectedPost.channel} showLabel />
                  <span className="text-sm font-semibold">Edit Post</span>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
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
                onImageChange={() => queryClient.invalidateQueries({ queryKey: ["admin-calendar-posts"] })}
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
                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => { if (window.confirm("Delete this post permanently?")) deleteMutation.mutate(selectedPost.id); }} disabled={deleteMutation.isPending}>Discard</Button>
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
          )}
        </SheetContent>
      </Sheet>

      <NewPostDialog open={newPostOpen} onOpenChange={setNewPostOpen} fixedClientId={selectedClientId !== "all" ? selectedClientId : undefined} />
    </div>
  );
}
