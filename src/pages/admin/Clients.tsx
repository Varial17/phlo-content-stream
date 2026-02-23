import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { BillingBadge } from "@/components/shared/BillingBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandProfileForm } from "@/components/admin/BrandProfileForm";
import { AddClientForm } from "@/components/admin/AddClientForm";
import { toast } from "sonner";

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
