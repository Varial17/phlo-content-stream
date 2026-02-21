import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calendarPosts, samplePostBody, type Post } from "@/data/mockData";
import { PostCard } from "@/components/PostCard";
import { PostDrawer } from "@/components/PostDrawer";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = 21; // Feb 21, 2026

function getFebruary2026Grid() {
  // Feb 1, 2026 is Sunday (index 0)
  const daysInMonth = 28;
  const startDay = 0; // Sunday
  const grid: (number | null)[][] = [];
  let day = 1;

  for (let week = 0; week < 5; week++) {
    const row: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if ((week === 0 && d < startDay) || day > daysInMonth) {
        row.push(null);
      } else {
        row.push(day++);
      }
    }
    grid.push(row);
    if (day > daysInMonth) break;
  }
  return grid;
}

function SummaryBar() {
  const stats = [
    { label: "Posts this month", value: 18 },
    { label: "Approved", value: 12 },
    { label: "Pending approval", value: 4 },
    { label: "Published", value: 2 },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-lg border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{s.value}</p>
          <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const grid = getFebruary2026Grid();

  const getPostsForDay = (day: number) => {
    const dateStr = `2026-02-${day.toString().padStart(2, "0")}`;
    return calendarPosts.filter((p) => p.date === dateStr);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 max-w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
        <div className="flex items-center gap-3">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Post
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            All Channels
          </Button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Week
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">February 2026</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">Today</Button>
        </div>

        <div className="w-[160px]" /> {/* spacer */}
      </div>

      <SummaryBar />

      {/* Calendar grid */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day, di) => (
              <div
                key={di}
                className={`min-h-[130px] border-r border-border last:border-r-0 p-1.5 ${
                  day === null ? "bg-muted/30" : "hover:bg-accent/30 cursor-pointer"
                }`}
              >
                {day !== null && (
                  <>
                    <div className="flex justify-end mb-1">
                      <span
                        className={`text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full ${
                          day === TODAY
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {getPostsForDay(day).map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onClick={() => handlePostClick(post)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <PostDrawer
        post={selectedPost}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        body={samplePostBody}
      />
    </div>
  );
}
