import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { ChannelPill } from "@/components/shared/ChannelPill";
import { LinkedInPreview } from "@/components/shared/LinkedInPreview";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NewPostDialog } from "@/components/shared/NewPostDialog";
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
  isSameDay,
  isToday,
} from "date-fns";

export default function ClientCalendarPage() {
  const { clientSlug } = useParams();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeRequest, setChangeRequest] = useState("");
  const [newPostOpen, setNewPostOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: client } = useQuery({
    queryKey: ["client", clientSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("avatar_url")
        .eq("id", clientSlug!)
        .single();
      return data;
    },
    enabled: !!clientSlug,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["client-posts", clientSlug, format(currentDate, "yyyy-MM")],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("client_id", clientSlug!)
        .gte("scheduled_date", format(monthStart, "yyyy-MM-dd"))
        .lte("scheduled_date", format(monthEnd, "yyyy-MM-dd"))
        .order("scheduled_time");
      return data ?? [];
    },
    enabled: !!clientSlug,
  });

  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("posts").update({ status: "approved" }).eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-posts"] });
      if (selectedPost) setSelectedPost({ ...selectedPost, status: "approved" });
    },
  });

  const changeRequestMutation = useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      await supabase
        .from("posts")
        .update({ client_change_request: text, status: "draft" })
        .eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-posts"] });
      setShowChangeRequest(false);
      setChangeRequest("");
      if (selectedPost) setSelectedPost({ ...selectedPost, status: "draft" });
    },
  });

  // Build calendar grid
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
    const published = posts.filter((p: any) => p.status === "published").length;
    return { total, approved, pending, published };
  }, [posts]);

  const channelBar: Record<string, string> = {
    linkedin: "bg-blue-500",
    threads: "bg-purple-500",
    email: "bg-emerald-500",
  };

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-background text-foreground shadow-sm">
              Month
            </button>
            <button className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground">
              Week
            </button>
          </div>

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

          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setNewPostOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Posts this month", value: stats.total },
          { label: "Approved", value: stats.approved },
          { label: "Pending approval", value: stats.pending },
          { label: "Published", value: stats.published },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border p-4">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-lg border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-medium text-muted-foreground text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDate[dateKey] ?? [];
            const inMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={i}
                className={`min-h-[120px] border-b border-r p-1.5 ${
                  !inMonth ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex justify-end mb-1">
                  <span
                    className={`text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full ${
                      isToday(day)
                        ? "bg-primary text-primary-foreground"
                        : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post: any) => (
                    <button
                      key={post.id}
                      onClick={() => {
                        setSelectedPost(post);
                        setDrawerOpen(true);
                        setShowChangeRequest(false);
                      }}
                      className="w-full text-left group"
                    >
                      <div className="flex rounded overflow-hidden bg-background border hover:shadow-sm transition-shadow">
                        <div className={`w-[3px] shrink-0 ${channelBar[post.channel] ?? "bg-muted"}`} />
                        <div className="flex-1 p-1.5 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <ChannelPill channel={post.channel} />
                            <span className="text-[10px] text-muted-foreground">{post.scheduled_time}</span>
                            <div className="flex-1" />
                            <StatusPill status={post.status} />
                          </div>
                          <p className="text-[11px] font-medium text-foreground truncate leading-tight">
                            {post.hook}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{dayPosts.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[420px] sm:w-[420px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedPost && <ChannelPill channel={selectedPost.channel} showLabel />}
              {selectedPost && <StatusPill status={selectedPost.status} />}
            </div>
            <SheetTitle className="text-lg leading-snug">{selectedPost?.hook}</SheetTitle>
          </SheetHeader>

          {selectedPost && (
            <div className="mt-6 space-y-6">
              {/* LinkedIn-style preview */}
              {selectedPost.channel === "linkedin" ? (
                <LinkedInPreview post={selectedPost} clientSlug={clientSlug} avatarUrl={client?.avatar_url} />
              ) : (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedPost.body || "No content yet."}
                  </div>
                  {selectedPost.image_url && (
                    <img
                      src={selectedPost.image_url}
                      alt="Post image"
                      className="w-full rounded-lg object-cover max-h-[280px]"
                    />
                  )}
                </>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>📅 {selectedPost.scheduled_date}</span>
                <span>🕐 {selectedPost.scheduled_time}</span>
              </div>

              {selectedPost.client_change_request && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Your feedback</p>
                  <p className="text-sm text-amber-800">{selectedPost.client_change_request}</p>
                </div>
              )}

              {showChangeRequest && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground">Notes for the team:</p>
                  {changeRequest.split("\n").map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-2 text-xs">•</span>
                      <input
                        className="flex-1 border border-input bg-background rounded-md px-2 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Add a note…"
                        value={line}
                        onChange={(e) => {
                          const lines = changeRequest.split("\n");
                          lines[idx] = e.target.value;
                          setChangeRequest(lines.join("\n"));
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const lines = changeRequest.split("\n").filter((_, i) => i !== idx);
                          setChangeRequest(lines.length ? lines.join("\n") : "");
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary"
                    onClick={() => setChangeRequest(changeRequest ? changeRequest + "\n" : "")}
                  >
                    + Add bullet
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      const notes = changeRequest.split("\n").filter(l => l.trim()).map(l => `• ${l.trim()}`).join("\n");
                      approveMutation.mutate(selectedPost.id);
                      if (notes) {
                        changeRequestMutation.mutate({ postId: selectedPost.id, text: notes });
                      }
                    }}
                    disabled={!changeRequest.split("\n").some(l => l.trim())}
                  >
                    ✓ Approve with Notes
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {(selectedPost.status === "pending" || selectedPost.status === "draft") && (
                  <>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => approveMutation.mutate(selectedPost.id)}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowChangeRequest(!showChangeRequest);
                        if (!changeRequest) setChangeRequest("");
                      }}
                    >
                      Approve with Note
                    </Button>
                  </>
                )}
              </div>

              {selectedPost.channel === "email" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(`/${clientSlug}/email-preview/${selectedPost.id}`, "_blank")}
                >
                  📧 View Email Preview
                </Button>
              )}
              
            </div>
          )}
        </SheetContent>
      </Sheet>

      <NewPostDialog open={newPostOpen} onOpenChange={setNewPostOpen} fixedClientId={clientSlug} />
    </div>
  );
}
