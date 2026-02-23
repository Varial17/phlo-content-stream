import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface NewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill client for client portal usage */
  fixedClientId?: string;
}

const channelOptions = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "threads", label: "Threads" },
  { value: "email", label: "Email Newsletter" },
];

export function NewPostDialog({ open, onOpenChange, fixedClientId }: NewPostDialogProps) {
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState("linkedin");
  const [clientId, setClientId] = useState(fixedClientId ?? "");
  const [hook, setHook] = useState("");
  const [body, setBody] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");

  // Only fetch clients for admin usage
  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name,initials,color").order("name");
      return data ?? [];
    },
    enabled: !fixedClientId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const targetClientId = fixedClientId || clientId;
      if (!targetClientId || !hook.trim()) throw new Error("Client and hook are required");

      const insertData: any = {
        client_id: targetClientId,
        channel,
        hook: hook.trim(),
        body: body.trim() || null,
        status: "draft",
      };

      if (scheduledDate) {
        insertData.scheduled_date = format(scheduledDate, "yyyy-MM-dd");
        insertData.scheduled_time = scheduledTime;
      }

      const { error } = await supabase.from("posts").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["client-posts"] });
      toast.success("Post created!");
      resetAndClose();
    },
    onError: (e: any) => {
      toast.error("Failed to create post: " + e.message);
    },
  });

  const resetAndClose = () => {
    setChannel("linkedin");
    setClientId(fixedClientId ?? "");
    setHook("");
    setBody("");
    setScheduledDate(undefined);
    setScheduledTime("09:00");
    onOpenChange(false);
  };

  const canSubmit = hook.trim() && (fixedClientId || clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Client selector (admin only) */}
          {!fixedClientId && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Client</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Channel */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Channel</label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {channelOptions.map((ch) => (
                  <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hook */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Hook / Subject Line</label>
            <Input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="e.g. 5 things I learned scaling to $1M ARR"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Post Body (optional)</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your post content…"
              className="min-h-[120px]"
            />
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Schedule (optional)</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-[110px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Post"}
            </Button>
            <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
