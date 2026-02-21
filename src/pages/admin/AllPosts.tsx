import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, AlertTriangle, Sparkles, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/shared/StatusPill";
import { ChannelPill } from "@/components/shared/ChannelPill";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const staffOptions = ["Anh Nguyen", "James Pham", "Unassigned"];

export default function AdminAllPostsPage() {
  const queryClient = useQueryClient();
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editHook, setEditHook] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [saved, setSaved] = useState(false);

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
      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("scheduled_date", { ascending: true });
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

  const selectedPost = useMemo(() => {
    return posts.find((p: any) => p.id === selectedPostId) ?? null;
  }, [posts, selectedPostId]);

  const clientMap = useMemo(() => {
    const m: Record<string, any> = {};
    clients.forEach((c: any) => { m[c.id] = c; });
    return m;
  }, [clients]);

  const handleSelectPost = (post: any) => {
    setSelectedPostId(post.id);
    setEditHook(post.hook);
    setEditBody(post.body ?? "");
    setEditAssigned(post.assigned_to ?? "Unassigned");
    setSaved(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from("posts")
        .update({
          hook: editHook,
          body: editBody,
          assigned_to: editAssigned === "Unassigned" ? null : editAssigned,
        })
        .eq("id", selectedPostId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const pushMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("posts").update({ status: "pending" }).eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
  });

  return (
    <div className="flex h-screen">
      {/* Posts list */}
      <div className="w-[calc(100%-440px)] flex flex-col border-r" style={{ borderColor: "#1F2D45" }}>
        <div className="p-4 border-b" style={{ borderColor: "#1F2D45" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">All Posts</h1>
              <p className="text-xs" style={{ color: "#64748B" }}>Edit, assign, and push content to clients</p>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-3.5 w-3.5 mr-1" /> New Post
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[160px] bg-transparent border-slate-700 text-slate-300 text-xs">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] bg-transparent border-slate-700 text-slate-300 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
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
              <button
                key={post.id}
                onClick={() => handleSelectPost(post)}
                className={`w-full text-left p-3 border-b transition-colors ${
                  isSelected
                    ? "border-l-2 border-l-blue-500"
                    : "border-l-2 border-l-transparent hover:bg-white/5"
                }`}
                style={{
                  borderBottomColor: "#1F2D45",
                  background: isSelected ? "#1A2235" : "transparent",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ChannelPill channel={post.channel} />
                  {client && (
                    <ClientAvatar initials={client.initials} color={client.color} size="sm" />
                  )}
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
      <div className="w-[440px] flex flex-col" style={{ background: "#111827" }}>
        {selectedPost ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChannelPill channel={selectedPost.channel} showLabel />
                <span className="text-sm font-semibold">Edit Post</span>
              </div>
              <button onClick={() => setSelectedPostId(null)} className="text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Client info */}
            <div className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
              {clientMap[selectedPost.client_id] && (
                <ClientAvatar
                  initials={clientMap[selectedPost.client_id].initials}
                  color={clientMap[selectedPost.client_id].color}
                  size="sm"
                />
              )}
              <span>{clientMap[selectedPost.client_id]?.name}</span>
              <StatusPill status={selectedPost.status} />
            </div>

            {/* Change request from client */}
            {selectedPost.client_change_request && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-400 mb-1">Client feedback</p>
                <p className="text-sm text-amber-200">{selectedPost.client_change_request}</p>
              </div>
            )}

            {/* Assigned to */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Assigned To</label>
              <Select value={editAssigned} onValueChange={setEditAssigned}>
                <SelectTrigger className="bg-transparent border-slate-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hook */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Hook / Subject Line</label>
              <Textarea
                value={editHook}
                onChange={(e) => { setEditHook(e.target.value); setSaved(false); }}
                className="bg-transparent border-slate-700 text-white min-h-[60px]"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Post Body</label>
                <span className="text-[10px]" style={{ color: "#64748B" }}>{editBody.length} chars</span>
              </div>
              <Textarea
                value={editBody}
                onChange={(e) => { setEditBody(e.target.value); setSaved(false); }}
                className="bg-transparent border-slate-700 text-white min-h-[200px]"
              />
            </div>

            {/* Actions */}
            <Button variant="outline" size="sm" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Polish with AI
            </Button>

            <div className="flex gap-2">
              <Button
                className={`flex-1 ${saved ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"} text-white`}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saved ? (
                  <><Check className="h-4 w-4 mr-1" /> Saved</>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => handleSelectPost(selectedPost)}
              >
                Discard
              </Button>
            </div>

            {selectedPost.status === "draft" && (
              <Button
                variant="outline"
                className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => pushMutation.mutate(selectedPost.id)}
              >
                → Push to Client for Approval
              </Button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "#64748B" }}>
            <p className="text-sm">Select a post to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
