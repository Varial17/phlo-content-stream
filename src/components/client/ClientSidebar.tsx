import { Link, useLocation, useParams } from "react-router-dom";
import { Calendar, Lightbulb, BarChart3, Palette, Linkedin, Mail, Hash } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function ClientSidebar() {
  const location = useLocation();
  const { clientSlug } = useParams();
  const { signOut } = useAuth();

  const { data: client } = useQuery({
    queryKey: ["client", clientSlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientSlug!)
        .single();
      return data;
    },
    enabled: !!clientSlug,
  });

  const navItems = [
    { title: "Calendar", path: `/${clientSlug}`, icon: Calendar },
    { title: "Ideation", path: `/${clientSlug}/ideation`, icon: Lightbulb },
    { title: "Analytics", path: `/${clientSlug}/analytics`, icon: BarChart3 },
    { title: "Brand Profile", path: `/${clientSlug}/brand`, icon: Palette },
  ];

  const channelIcons: Record<string, any> = { linkedin: Linkedin, threads: Hash, email: Mail };
  const channels = (client?.channels as string[] | null) ?? [];

  return (
    <aside className="w-[220px] min-h-screen flex flex-col shrink-0" style={{ background: "#0F172A" }}>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight">phlo</h1>
        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>content manager</p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === `/${clientSlug}`
                ? location.pathname === `/${clientSlug}`
                : location.pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white border-l-2 border-blue-500"
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
            Channels
          </p>
          <div className="space-y-2 px-3">
            {channels.map((ch) => {
              const Icon = channelIcons[ch] ?? Linkedin;
              return (
                <div key={ch} className="flex items-center gap-2.5">
                  <div className="relative">
                    <Icon className="h-4 w-4 text-slate-300" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 bg-emerald-500" style={{ borderColor: "#0F172A" }} />
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{ch === "email" ? "Email Newsletter" : ch}</span>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: "1px solid #1E293B" }}>
        <div className="flex items-center gap-3">
          {client && (
            client.avatar_url ? (
              <img src={client.avatar_url} alt={client.initials} className="h-8 w-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: `${client.color}20`, color: client.color }}
              >
                {client.initials}
              </div>
            )
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{client?.name ?? "Loading…"}</p>
            <p className="text-[10px]" style={{ color: "#64748B" }}>Managed by Phlo</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
