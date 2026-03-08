import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CreditCard, Users, Mail, Loader2 } from "lucide-react";

type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

export default function ClientSettingsPage() {
  const { clientSlug } = useParams();
  const { isOwner } = useAuth();
  const { toast } = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const { data: members = [], refetch } = useQuery({
    queryKey: ["team-members", clientSlug],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, name, email, created_at")
        .eq("client_id", clientSlug!);

      if (!profiles) return [];

      // Fetch roles for each member
      const ids = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);

      return profiles.map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role ?? null,
      })) as TeamMember[];
    },
    enabled: !!clientSlug,
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !clientSlug) return;
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke("invite-member", {
        body: { email: inviteEmail.trim(), client_id: clientSlug },
      });
      if (error) throw error;
      toast({ title: "Invite sent", description: `${inviteEmail} will receive an email shortly.` });
      setInviteEmail("");
      setInviteOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Failed to send invite", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const roleLabel = (role: string | null) => {
    if (role === "client" || role === "business_owner") return "Owner";
    if (role === "member") return "Member";
    return role ?? "—";
  };

  const roleBadgeVariant = (role: string | null): "default" | "secondary" | "outline" => {
    if (role === "client" || role === "business_owner") return "default";
    return "secondary";
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your team and account.</p>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-6" style={{ background: "#1E293B" }}>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          )}
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
            {isOwner && (
              <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite member
              </Button>
            )}
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1E293B" }}>
            {members.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                No team members yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E293B", background: "#0F172A" }}>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, i) => (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: i < members.length - 1 ? "1px solid #1E293B" : undefined,
                        background: "#0F172A",
                      }}
                    >
                      <td className="px-4 py-3 text-white font-medium">{member.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {member.email ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {member.created_at
                          ? new Date(member.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Billing tab — owner only */}
        {isOwner && (
          <TabsContent value="billing">
            <div
              className="rounded-lg p-8 text-center"
              style={{ border: "1px solid #1E293B", background: "#0F172A" }}
            >
              <CreditCard className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Stripe billing coming soon</p>
              <p className="text-sm text-slate-400">
                To manage your plan or update payment details, contact{" "}
                <a href="mailto:hello@phlo.com.au" className="text-blue-400 hover:underline">
                  hello@phlo.com.au
                </a>
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              They'll receive an email to set up their account and access your Phlo workspace.
            </p>
            <Input
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              type="email"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
