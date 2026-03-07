import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, CreditCard, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ClientAvatar } from "@/components/shared/ClientAvatar";

const navItems = [
  { title: "Overview", path: "/admin", icon: LayoutDashboard },
  { title: "All Posts", path: "/admin/posts", icon: FileText },
  { title: "Clients", path: "/admin/clients", icon: Users },
  { title: "Billing", path: "/admin/billing", icon: CreditCard },
];

export function AdminSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const { data: clients } = useQuery({
    queryKey: ["admin-clients-sidebar"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name,initials,color,billing_status").order("name");
      return data ?? [];
    },
  });

  const billingDot: Record<string, string> = { paid: "bg-emerald-500", overdue: "bg-red-500", trial: "bg-amber-500" };

  return (
    <aside className="w-[220px] min-h-screen flex flex-col shrink-0" style={{ background: "#0A0F1E" }}>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight">phlo</h1>
        <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: "#64748B" }}>admin</p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border-l-2 border-blue-500"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <p className="px-3 text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>
            Clients
          </p>
          <div className="space-y-1.5 px-2">
            {clients?.map((c: any) => (
              <Link
                key={c.id}
                to={`/admin/clients?selected=${c.id}`}
                className="flex items-center gap-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <span className={`h-2 w-2 rounded-full ${billingDot[c.billing_status] ?? "bg-slate-500"}`} />
                <span className="truncate">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: "1px solid #1F2D45" }}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">
            D
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">Daniel</p>
            <p className="text-[10px]" style={{ color: "#64748B" }}>Admin</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-3 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
