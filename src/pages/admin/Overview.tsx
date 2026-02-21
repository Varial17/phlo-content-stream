import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, AlertCircle, Users, FileText } from "lucide-react";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { BillingBadge } from "@/components/shared/BillingBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const mrrData = [
  { month: "Dec", mrr: 4500 },
  { month: "Jan", mrr: 6000 },
  { month: "Feb", mrr: 7500 },
];

export default function AdminOverviewPage() {
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

  const activeClients = clients.filter((c: any) => c.plan === "active").length;
  const pendingTotal = posts.filter((p: any) => p.status === "pending").length;
  const postsThisMonth = posts.length;
  const overdueClients = clients.filter((c: any) => c.billing_status === "overdue");

  const pendingByClient = clients.map((c: any) => ({
    ...c,
    pending: posts.filter((p: any) => p.client_id === c.id && p.status === "pending").length,
    total: posts.filter((p: any) => p.client_id === c.id).length,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Good morning, Daniel ☀️</h1>
        <p className="text-xs" style={{ color: "#64748B" }}>Saturday, February 21, 2026</p>
      </div>

      {overdueClients.length > 0 && (
        <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "#EF444420", border: "1px solid #EF444440" }}>
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-300">
            <strong>{overdueClients.map((c: any) => c.name).join(", ")}</strong> — billing overdue
          </span>
          <button className="ml-auto text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/30">
            Chase Payment
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Clients", value: activeClients, icon: Users, color: "#10B981" },
          { label: "Pending Approvals", value: pendingTotal, icon: AlertCircle, color: "#F59E0B" },
          { label: "Posts This Month", value: postsThisMonth, icon: FileText, color: "#8B5CF6" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg p-4" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              <span className="text-xs" style={{ color: "#64748B" }}>{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* MRR chart + Approval queue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
          <h3 className="text-sm font-semibold mb-4">MRR Growth</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2D45" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip />
              <Area type="monotone" dataKey="mrr" stroke="#3B82F6" fill="url(#mrrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-4" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
          <h3 className="text-sm font-semibold mb-4">Approval Queue</h3>
          <div className="space-y-3">
            {pendingByClient.filter((c: any) => c.pending > 0).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3">
                <ClientAvatar initials={c.initials} color={c.color} size="sm" />
                <span className="text-sm flex-1">{c.name}</span>
                <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "#1F2D45" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((c.pending / Math.max(c.total, 1)) * 100, 100)}%`,
                      background: c.pending >= 5 ? "#F59E0B" : "#3B82F6",
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: c.pending >= 5 ? "#F59E0B" : "#94A3B8" }}>
                  {c.pending}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Health table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
        <div className="p-4 border-b" style={{ borderColor: "#1F2D45" }}>
          <h3 className="text-sm font-semibold">Client Health</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1F2D45" }}>
              <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "#64748B" }}>Client</th>
              <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "#64748B" }}>Posts</th>
              <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "#64748B" }}>Pending</th>
              <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "#64748B" }}>Followers</th>
              <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "#64748B" }}>Billing</th>
            </tr>
          </thead>
          <tbody>
            {pendingByClient.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #1F2D45" }} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ClientAvatar initials={c.initials} color={c.color} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-[10px]" style={{ color: "#64748B" }}>Joined {c.joined}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{c.total}</td>
                <td className="px-4 py-3">
                  <span className={c.pending > 0 ? "text-amber-400" : ""}>{c.pending}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    {c.linkedin_followers}
                    <span className="text-[10px] text-emerald-400">{c.follower_growth}</span>
                  </span>
                </td>
                <td className="px-4 py-3"><BillingBadge status={c.billing_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
