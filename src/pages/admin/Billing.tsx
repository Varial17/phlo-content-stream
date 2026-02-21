import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientAvatar } from "@/components/shared/ClientAvatar";
import { BillingBadge } from "@/components/shared/BillingBadge";

export default function AdminBillingPage() {
  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").order("name");
      return data ?? [];
    },
  });

  const overdue = clients.filter((c: any) => c.billing_status === "overdue").length;
  const trial = clients.filter((c: any) => c.billing_status === "trial").length;
  const active = clients.filter((c: any) => c.billing_status === "paid").length;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Billing</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Overdue Invoices", value: overdue, color: "#EF4444" },
          { label: "Trial Conversions Due", value: trial, color: "#F59E0B" },
          { label: "Active Paying Clients", value: active, color: "#10B981" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-4" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
            <p className="text-xs" style={{ color: "#64748B" }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invoices table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#111827", border: "1px solid #1F2D45" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1F2D45" }}>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#64748B" }}>Client</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#64748B" }}>Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#64748B" }}>Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#64748B" }}>Next Billing</th>
              <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: "#64748B" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #1F2D45" }} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ClientAvatar initials={c.initials} color={c.color} size="sm" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "#94A3B8" }}>
                  {c.plan === "active" ? "$1,500/mo" : "Trial"}
                </td>
                <td className="px-4 py-3"><BillingBadge status={c.billing_status} /></td>
                <td className="px-4 py-3" style={{ color: "#94A3B8" }}>{c.next_billing ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {c.billing_status === "overdue" && (
                      <button className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/30">
                        Chase
                      </button>
                    )}
                    {c.billing_status === "trial" && (
                      <button className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500/30">
                        Convert
                      </button>
                    )}
                    <button className="text-xs text-slate-400 hover:text-white">Stripe →</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
