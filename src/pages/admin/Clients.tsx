import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ExternalLink, Upload, UserPlus, Trash2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { BillingBadge } from "@/components/shared/BillingBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BrandProfileForm } from "@/components/admin/BrandProfileForm";
import { AddClientForm } from "@/components/admin/AddClientForm";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

function TeamTab({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"business_owner" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);

  const { data: members = [], refetch } = useQuery({
    queryKey: ["team-members-admin", clientId],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, name, email, created_at")
        .eq("client_id", clientId);

      if (!profiles || profiles.length === 0) return [];

      const ids = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);

      return profiles.map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role ?? null,
      })) as TeamMember[];
    },
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke("invite-member", {
        body: { email: inviteEmail.trim(), client_id: clientId, role: inviteRole },
      });
      if (error) throw error;
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteOpen(false);
      refetch();
    } catch (err: any) {
      toast.error("Failed to send invite: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: TeamMember) => {
    setRemovingId(member.id);
    try {
      // Remove role
      await supabase.from("user_roles").delete().eq("user_id", member.id);
      // Unlink from client
      await supabase.from("user_profiles").update({ client_id: null }).eq("id", member.id);
      toast.success(`${member.name ?? member.email} removed from client`);
      queryClient.invalidateQueries({ queryKey: ["team-members-admin", clientId] });
    } catch (err: any) {
      toast.error("Failed to remove user: " + err.message);
    } finally {
      setRemovingId(null);
      setConfirmRemove(null);
    }
  };

  const roleLabel = (role: string | null) => {
    if (role === "client" || role === "business_owner") return "Owner";
    if (role === "member") return "Member";
    return role ?? "—";
  };

  const roleBadgeVariant = (role: string | null): "default" | "secondary" | "outline" => {
    if (role === "client" || role === "business_owner") return "default";
    return "secondary";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#64748B" }}>
          {members.length} user{members.length !== 1 ? "s" : ""} with access
        </p>
        <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite user
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1F2D45" }}>
        {members.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No users yet. Invite someone to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #1F2D45", background: "#0A0F1E" }}>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#64748B" }}>Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: i < members.length - 1 ? "1px solid #1F2D45" : undefined,
                    background: "#111827",
                  }}
                >
                  <td className="px-4 py-3 font-medium">{m.name ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#94A3B8" }}>{m.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant(m.role)}>{roleLabel(m.role)}</Badge>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#64748B" }}>
                    {m.created_at
                      ? new Date(m.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
                      onClick={() => setConfirmRemove(m)}
                      disabled={removingId === m.id}
                    >
                      {removingId === m.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email address</label>
              <Input
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_owner">
                    <div>
                      <p className="font-medium">Owner</p>
                      <p className="text-xs text-muted-foreground">Full access including billing</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div>
                      <p className="font-medium">Member</p>
                      <p className="text-xs text-muted-foreground">Content access, no billing</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove?.name ?? confirmRemove?.email} will lose access to this client portal. Their Phlo account won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => confirmRemove && handleRemove(confirmRemove)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AvatarUpload({ client }: { client: any }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${client.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("post-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("clients")
        .update({ avatar_url: avatarUrl })
        .eq("id", client.id);
      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      {client.avatar_url ? (
        <img src={client.avatar_url} alt={client.initials} className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <ClientAvatar initials={client.initials} color={client.color} size="lg" />
      )}
      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <span className="text-[10px] text-white">…</span>
        ) : (
          <Upload className="h-4 w-4 text-white" />
        )}
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("status,client_id");
      return data ?? [];
    },
  });

  const selected = clients.find((c: any) => c.id === selectedId) ?? null;
  const clientPosts = posts.filter((p: any) => p.client_id === selectedId);
  const pendingCount = clientPosts.filter((p: any) => p.status === "pending").length;

  const handleAddClick = () => {
    setAdding(true);
    setSelectedId(null);
  };

  const handleAddDone = () => {
    setAdding(false);
  };

  return (
    <div className="flex h-screen">
      {/* Client list */}
      <div className="w-[280px] flex flex-col border-r" style={{ borderColor: "#1F2D45" }}>
        <div className="p-4 border-b" style={{ borderColor: "#1F2D45" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Clients ({clients.length})</h2>
            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300" onClick={handleAddClick}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {clients.map((c: any) => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setAdding(false); }}
              className={`w-full text-left px-4 py-3 border-b transition-colors ${
                c.id === selectedId
                  ? "border-l-2 border-l-blue-500"
                  : "border-l-2 border-l-transparent hover:bg-white/5"
              }`}
              style={{ borderBottomColor: "#1F2D45", background: c.id === selectedId ? "#1A2235" : "transparent" }}
            >
              <div className="flex items-center gap-2">
                <ClientAvatar initials={c.initials} color={c.color} avatarUrl={c.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-1">
                    <BillingBadge status={c.billing_status} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {adding ? (
          <AddClientForm onDone={handleAddDone} />
        ) : selected ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <AvatarUpload client={selected} />
              <div>
                <h1 className="text-xl font-bold">{selected.name}</h1>
                <p className="text-xs" style={{ color: "#64748B" }}>Joined {selected.joined}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <BillingBadge status={selected.billing_status} />
                <a
                  href={`/${selected.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="h-3 w-3" /> Open Client View
                </a>
              </div>
            </div>

            <Tabs defaultValue="settings">
              <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-0 h-auto p-0" style={{ borderColor: "#1F2D45" }}>
                <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="brand" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">
                  Brand Profile
                </TabsTrigger>
                <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">
                  Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="mt-4 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Plan", value: selected.plan === "active" ? "$1,500/mo" : "Trial" },
                    { label: "Posts This Month", value: clientPosts.length },
                    { label: "Pending Approval", value: pendingCount },
                    { label: "LinkedIn Followers", value: `${selected.linkedin_followers} (${selected.follower_growth})` },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
                      <p className="text-xs" style={{ color: "#64748B" }}>{s.label}</p>
                      <p className="text-lg font-bold mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Settings table */}
                <div className="rounded-lg overflow-hidden" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
                  <div className="p-4 border-b" style={{ borderColor: "#1F2D45" }}>
                    <h3 className="text-sm font-semibold">Settings</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        { label: "Contact Email", value: selected.contact_email },
                        { label: "Active Channels", value: (selected.channels as string[] | null)?.join(", ") ?? "—" },
                        { label: "Client Login URL", value: `app.phlo.com.au/${selected.id}` },
                        { label: "Next Billing Date", value: selected.next_billing ?? "—" },
                      ].map((row) => (
                        <tr key={row.label} style={{ borderBottom: "1px solid #1F2D45" }}>
                          <td className="px-4 py-3 text-xs font-medium" style={{ color: "#64748B", width: "180px" }}>{row.label}</td>
                          <td className="px-4 py-3">{row.value}</td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                    Send Approval Reminder
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                    Generate Monthly Report
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="brand" className="mt-4">
                <BrandProfileForm clientId={selected.id} clientName={selected.name} />
              </TabsContent>

              <TabsContent value="team" className="mt-4">
                <TeamTab clientId={selected.id} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full" style={{ color: "#64748B" }}>
            <p className="text-sm">Select a client to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
