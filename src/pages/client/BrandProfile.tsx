import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandProfileForm } from "@/components/admin/BrandProfileForm";

export default function ClientBrandProfilePage() {
  const { clientSlug } = useParams();

  const { data: client } = useQuery({
    queryKey: ["client", clientSlug],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("name").eq("id", clientSlug!).single();
      return data;
    },
    enabled: !!clientSlug,
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Brand Profile</h1>
        <p className="text-sm text-muted-foreground">
          Define your brand voice, content strategy, and AI generation preferences.
        </p>
      </div>
      {clientSlug && (
        <BrandProfileForm clientId={clientSlug} clientName={client?.name ?? "…"} light />
      )}
    </div>
  );
}
