import { Link, useLocation } from "react-router-dom";
import { Calendar, Lightbulb, BarChart3, Settings, Linkedin, Mail, Hash } from "lucide-react";

const navItems = [
  { title: "Calendar", path: "/calendar", icon: Calendar },
  { title: "Ideation", path: "/ideation", icon: Lightbulb },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "Account / Billing", path: "/account", icon: Settings },
];

const channels = [
  { name: "LinkedIn", icon: Linkedin, connected: true, color: "text-channel-linkedin" },
  { name: "Threads", icon: Hash, connected: true, color: "text-foreground" },
  { name: "Email Newsletter", icon: Mail, connected: true, color: "text-channel-email" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-[220px] min-h-screen bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-sidebar-accent-foreground tracking-tight">phlo</h1>
        <p className="text-xs text-sidebar-muted mt-0.5">content manager</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === "/calendar" && location.pathname === "/");
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Channels */}
        <div className="mt-8">
          <p className="px-3 text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-3">Channels</p>
          <div className="space-y-2 px-3">
            {channels.map((ch) => (
              <div key={ch.name} className="flex items-center gap-2.5">
                <div className="relative">
                  <ch.icon className={`h-4 w-4 ${ch.connected ? 'text-sidebar-accent-foreground' : 'text-sidebar-muted'}`} />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-sidebar ${
                    ch.connected ? 'bg-success' : 'bg-sidebar-muted'
                  }`} />
                </div>
                <span className="text-xs text-sidebar-foreground">{ch.name}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Client info */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground">
            HF
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">Hash Financial Group</p>
            <p className="text-xs text-sidebar-muted">Managed by Phlo</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
