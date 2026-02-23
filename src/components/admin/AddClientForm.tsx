import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface AddClientFormProps {
  onDone: () => void;
}

const channelOptions = ["linkedin", "threads", "email"];

export function AddClientForm({ onDone }: AddClientFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("active");
  const [channels, setChannels] = useState<string[]>(["linkedin"]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 6) || "new";

  const generateInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";

  const colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"];
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = generateSlug(name);
      const initials = generateInitials(name);
      const color = randomColor();

      const { error: clientErr } = await supabase.from("clients").insert({
        id: slug,
        name,
        initials,
        color,
        plan,
        billing_status: plan === "trial" ? "trial" : "paid",
        contact_email: email || null,
        channels,
        joined: new Date().toISOString().split("T")[0],
      });
      if (clientErr) throw clientErr;

      const { error: bpErr } = await supabase.from("brand_profiles").insert({ client_id: slug });
      if (bpErr) throw bpErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("Client created!");
      onDone();
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-lg font-bold">Add New Client</h2>

      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: "#94A3B8" }}>Firm Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent border-slate-700 text-white" placeholder="e.g. Hash Financial Group" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: "#94A3B8" }}>Contact Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent border-slate-700 text-white" placeholder="sarah@example.com" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: "#94A3B8" }}>Plan</Label>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="bg-transparent border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active ($1,500/mo)</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: "#94A3B8" }}>Channels</Label>
        <div className="flex gap-3">
          {channelOptions.map((ch) => (
            <label key={ch} className="flex items-center gap-1.5 text-xs capitalize" style={{ color: "#94A3B8" }}>
              <Checkbox checked={channels.includes(ch)} onCheckedChange={() => toggleChannel(ch)} />
              {ch}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
          <Check className="h-4 w-4 mr-1" /> Create Client
        </Button>
        <Button variant="outline" className="border-slate-700 text-slate-300" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
