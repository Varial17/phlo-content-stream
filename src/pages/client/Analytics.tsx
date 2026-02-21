import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { ChannelPill } from "@/components/shared/ChannelPill";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Mock analytics data (would come from Supabase in production)
const kpiData = {
  impressions: { value: 18400, trend: 23 },
  engagements: { value: 847, trend: 15 },
  profileVisits: { value: 312, trend: 41 },
  subscribers: { value: 48, change: 8 },
  postsPublished: { value: 18, total: 20 },
};

const funnelStages = [
  { label: "Impressions", value: 18400, rate: "100%", tip: "Total times your content appeared in someone's feed" },
  { label: "Engagements", value: 847, rate: "4.6%", tip: "Likes, comments, shares, and saves" },
  { label: "Link Clicks", value: 203, rate: "1.1%", tip: "Clicks through to your website or newsletter" },
  { label: "Subscribers", value: 48, rate: "0.26%", tip: "New newsletter sign-ups from content this month" },
  { label: "Clients", value: 3, rate: "0.016%", tip: "New client enquiries attributed to content" },
];

const engagementData = Array.from({ length: 21 }, (_, i) => ({
  date: `Feb ${i + 1}`,
  impressions: 400 + Math.floor(Math.random() * 600) + (i % 2 === 0 ? 400 : 0),
  engagements: 20 + Math.floor(Math.random() * 60) + (i % 2 === 0 ? 30 : 0),
}));

const channelData = [
  { name: "LinkedIn", value: 52, color: "#3B82F6" },
  { name: "Threads", value: 30, color: "#9333EA" },
  { name: "Email", value: 18, color: "#10B981" },
];

const followerData = [
  { month: "Dec", followers: 310 },
  { month: "Jan", followers: 348 },
  { month: "Feb", followers: 387 },
];

const topPosts = [
  { channel: "linkedin", hook: "Why the ATO's new SMSF reporting rules are actually good news", date: "Feb 2", impressions: 2840, engagements: 184, engRate: "6.5%", clicks: 47 },
  { channel: "linkedin", hook: "3 things every SMSF trustee needs to know before 30 June", date: "Feb 10", impressions: 2210, engagements: 156, engRate: "7.1%", clicks: 38 },
  { channel: "email", hook: "February Market Update: What the RBA decision means", date: "Feb 4", impressions: 1890, engagements: 98, engRate: "5.2%", clicks: 31 },
  { channel: "threads", hook: "Hot take: Most accountants are leaving money on the table", date: "Feb 3", impressions: 1640, engagements: 112, engRate: "6.8%", clicks: 22 },
  { channel: "linkedin", hook: "We helped a client save $40K in tax last year", date: "Feb 14", impressions: 1520, engagements: 89, engRate: "5.9%", clicks: 19 },
];

export default function ClientAnalyticsPage() {
  const { clientSlug } = useParams();

  const { data: client } = useQuery({
    queryKey: ["client", clientSlug],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("name").eq("id", clientSlug!).single();
      return data;
    },
    enabled: !!clientSlug,
  });

  const funnelWidths = [100, 70, 45, 25, 12];

  return (
    <div className="p-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">{client?.name} · February 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border rounded-md px-3 py-1.5 bg-background text-foreground">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total Impressions", value: "18,400", trend: "+23%" },
          { label: "Engagements", value: "847", trend: "+15%" },
          { label: "Profile Visits", value: "312", trend: "+41%" },
          { label: "Newsletter Subscribers", value: "48", trend: "+8 this month" },
          { label: "Posts Published", value: "18", trend: "of 20 approved" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-lg border p-4">
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Conversion Funnel</h2>
        <div className="flex items-end justify-center gap-1 mb-4">
          {funnelStages.map((stage, i) => (
            <div key={stage.label} className="flex flex-col items-center" style={{ width: `${funnelWidths[i]}%`, maxWidth: "220px" }}>
              <p className="text-xs font-medium text-muted-foreground mb-1">{stage.label}</p>
              <div
                className="w-full rounded-md transition-all group relative cursor-help"
                style={{
                  height: "56px",
                  background: i < 3 ? `hsl(213, 74%, ${39 + i * 10}%)` : `hsl(160, 84%, ${39 + (i - 3) * 10}%)`,
                }}
                title={stage.tip}
              />
              <p className="text-sm font-bold text-foreground mt-1">{stage.value.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{stage.rate}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Biggest drop-off:</strong> Impressions → Engagements. Phlo recommends adding stronger hooks to your first line.
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-card rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Impressions & Engagement Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <RTooltip />
              <Line type="monotone" dataKey="impressions" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="engagements" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-2 bg-card rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Posts by Channel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={channelData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {channelData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Legend formatter={(value: string) => <span className="text-xs">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-muted-foreground -mt-2">18 posts total</p>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold text-foreground">Top Performing Posts</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Channel</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Hook</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Impressions</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Engagements</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Eng. Rate</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Link Clicks</th>
            </tr>
          </thead>
          <tbody>
            {topPosts.map((post, i) => (
              <tr key={i} className={`border-b ${i === 0 ? "bg-blue-50/50" : "hover:bg-muted/30"}`}>
                <td className="px-4 py-3">
                  <ChannelPill channel={post.channel} />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {i === 0 && <span className="text-amber-600 mr-1">🏆</span>}
                  {post.hook}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{post.date}</td>
                <td className="px-4 py-3 text-right">{post.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{post.engagements}</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-medium">{post.engRate}</td>
                <td className="px-4 py-3 text-right">{post.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audience Growth */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">LinkedIn Follower Growth (90 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={followerData}>
            <defs>
              <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[280, 420]} />
            <RTooltip />
            <Area type="monotone" dataKey="followers" stroke="#3B82F6" fill="url(#followerGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted-foreground text-center mt-1">← Phlo started (Jan 15)</p>
      </div>
    </div>
  );
}
