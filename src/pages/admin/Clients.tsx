import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { BillingBadge } from "@/components/shared/BillingBadge";

export default function AdminClientsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <div className="flex h-screen">
      {/* Client list */}
      <div className="w-[280px] flex flex-col border-r" style={{ borderColor: "#1F2D45" }}>
        <div className="p-4 border-b" style={{ borderColor: "#1F2D45" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Clients ({clients.length})</h2>
            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-slate-300">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {clients.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-4 py-3 border-b transition-colors ${
                c.id === selectedId
                  ? "border-l-2 border-l-blue-500"
                  : "border-l-2 border-l-transparent hover:bg-white/5"
              }`}
              style={{ borderBottomColor: "#1F2D45", background: c.id === selectedId ? "#1A2235" : "transparent" }}
            >
              <div className="flex items-center gap-2">
                <ClientAvatar initials={c.initials} color={c.color} size="sm" />
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

      {/* Client detail */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <ClientAvatar initials={selected.initials} color={selected.color} size="lg" />
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

            {/* Settings */}
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
