import { ArrowUp, ArrowDown, Trophy, Linkedin, Hash, Mail, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import { calendarPosts, impressionsData, followerData } from "@/data/mockData";

const channelIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  threads: Hash,
  email: Mail,
};

function MetricCard({ label, value, trend, trendLabel }: { label: string; value: string; trend?: number; trendLabel?: string }) {
  const isPositive = trend && trend > 0;
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {trend !== undefined && (
        <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${isPositive ? "text-success" : "text-destructive"}`}>
          {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(trend)}% {trendLabel || "vs last month"}
        </p>
      )}
    </div>
  );
}

const funnelStages = [
  { label: "Impressions", value: 18400, pct: "100%", tip: "Total times your content appeared in someone's feed" },
  { label: "Engagements", value: 847, pct: "4.6%", tip: "Likes, comments, shares, and saves" },
  { label: "Link Clicks", value: 203, pct: "1.1%", tip: "Clicks through to your website or newsletter" },
  { label: "Subscribers", value: 48, pct: "0.26%", tip: "New newsletter sign-ups from content this month" },
  { label: "Clients", value: 3, pct: "0.016%", tip: "New client enquiries attributed to content" },
];

function ConversionFunnel() {
  const widths = [100, 65, 40, 22, 12];
  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">Conversion Funnel</h2>
      <div className="flex items-end justify-center gap-1 mb-4 h-[120px]">
        {funnelStages.map((stage, i) => (
          <Tooltip key={stage.label}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center flex-1 group cursor-help">
                <p className="text-xs font-medium text-muted-foreground mb-1">{stage.label}</p>
                <p className="text-lg font-bold text-foreground mb-1">{stage.value.toLocaleString()}</p>
                <div
                  className="w-full rounded-md transition-all group-hover:opacity-80"
                  style={{
                    height: `${widths[i]}px`,
                    background: `hsl(213, 74%, ${39 + i * 8}%)`,
                  }}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{stage.pct}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>{stage.tip}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="bg-accent/50 rounded-lg p-3 mt-4 flex items-start gap-2">
        <span className="text-lg">💡</span>
        <p className="text-sm text-foreground">
          Your biggest drop-off is between <strong>Impressions → Engagements</strong>. Phlo recommends adding stronger hooks to your first line.
        </p>
      </div>
    </div>
  );
}

const donutData = [
  { name: "LinkedIn", value: 52, color: "hsl(213, 74%, 39%)" },
  { name: "Threads", value: 30, color: "hsl(270, 60%, 50%)" },
  { name: "Email", value: 18, color: "hsl(160, 84%, 39%)" },
];

const topPosts = calendarPosts
  .filter((p) => p.engagements)
  .sort((a, b) => (b.engagements || 0) - (a.engagements || 0))
  .slice(0, 5);

export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Hash Financial Group · February 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
          <select className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground">
            <option>All Channels</option>
            <option>LinkedIn</option>
            <option>Threads</option>
            <option>Email</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <MetricCard label="Total Impressions" value="18,400" trend={23} />
        <MetricCard label="Engagements" value="847" trend={15} />
        <MetricCard label="Profile Visits" value="312" trend={41} />
        <MetricCard label="Newsletter Subscribers" value="48" trendLabel="+8 this month" trend={8} />
        <MetricCard label="Posts Published" value="18" />
      </div>

      {/* Conversion funnel */}
      <ConversionFunnel />

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Impressions & Engagement chart */}
        <div className="col-span-3 bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Impressions & Engagement Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={impressionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }} />
              <RechartsTooltip
                contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 32%, 91%)', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="impressions" stroke="hsl(213, 74%, 39%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="engagements" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="col-span-2 bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Posts by Channel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
              />
              <text x="50%" y="42%" textAnchor="middle" className="text-2xl font-bold fill-foreground">18</text>
              <text x="50%" y="52%" textAnchor="middle" className="text-xs fill-muted-foreground">posts</text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top posts table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Top Performing Posts</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-[60px]">Channel</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Post</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-[100px]">Date</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-[100px]">Impressions</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-[100px]">Engagements</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-[80px]">Eng. Rate</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-[90px]">Link Clicks</th>
            </tr>
          </thead>
          <tbody>
            {topPosts.map((post, i) => {
              const Icon = channelIcons[post.channel];
              const engRate = post.impressions && post.engagements ? ((post.engagements / post.impressions) * 100).toFixed(1) : "—";
              return (
                <tr key={post.id} className={`border-b border-border last:border-b-0 ${i === 0 ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {i === 0 && <span className="mr-2 text-xs">🏆 Top post</span>}
                    {post.hook}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{post.date.slice(5)}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{post.impressions?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{post.engagements}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{engRate}%</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{post.linkClicks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Follower growth */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">LinkedIn Follower Growth (90 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={followerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }} />
            <YAxis domain={[300, 400]} tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }} />
            <RechartsTooltip
              contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(214, 32%, 91%)', borderRadius: '8px', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="followers" stroke="hsl(213, 74%, 39%)" fill="hsl(213, 74%, 39%)" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">📍 Phlo started → Jan 1 (318 followers) → Now: 387 followers</span>
        </div>
      </div>
    </div>
  );
}
