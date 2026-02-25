import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/shared/TagInput";
import { Check, Sparkles, Plus, X } from "lucide-react";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { toast } from "sonner";

interface BrandProfileFormProps {
  clientId: string;
  clientName: string;
  light?: boolean;
}

export function BrandProfileForm({ clientId, clientName, light = false }: BrandProfileFormProps) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["brand-profile", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("client_id", clientId)
        .single();
      return data;
    },
  });

  const [form, setForm] = useState({
    website_url: "",
    business_description: "",
    industry: "",
    target_audience: "",
    services: [] as string[],
    location: "",
    tone_of_voice: "",
    writing_style_notes: "",
    writing_examples: "",
    words_to_avoid: [] as string[],
    words_to_use: [] as string[],
    content_pillars: [] as string[],
    topics_to_avoid: [] as string[],
    competitors: [] as string[],
    post_length_linkedin: "medium",
    post_length_threads: "short",
    use_emojis: false,
    use_hashtags: false,
    cta_style: "none",
    brand_colors: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        website_url: profile.website_url ?? "",
        business_description: profile.business_description ?? "",
        industry: profile.industry ?? "",
        target_audience: profile.target_audience ?? "",
        services: (profile.services as string[]) ?? [],
        location: profile.location ?? "",
        tone_of_voice: profile.tone_of_voice ?? "",
        writing_style_notes: profile.writing_style_notes ?? "",
        writing_examples: profile.writing_examples ?? "",
        words_to_avoid: (profile.words_to_avoid as string[]) ?? [],
        words_to_use: (profile.words_to_use as string[]) ?? [],
        content_pillars: (profile.content_pillars as string[]) ?? [],
        topics_to_avoid: (profile.topics_to_avoid as string[]) ?? [],
        competitors: (profile.competitors as string[]) ?? [],
        post_length_linkedin: profile.post_length_linkedin ?? "medium",
        post_length_threads: profile.post_length_threads ?? "short",
        use_emojis: profile.use_emojis ?? false,
        use_hashtags: profile.use_hashtags ?? false,
        cta_style: profile.cta_style ?? "none",
        brand_colors: (profile.brand_colors as string[]) ?? [],
      });
    }
  }, [profile]);

  const update = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("brand_profiles")
        .upsert({ client_id: clientId, ...form }, { onConflict: "client_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-profile", clientId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => toast.error("Failed to save: " + e.message),
  });

  const handlePreview = async () => {
    setPreviewing(true);
    setPreviewText(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: { client_id: clientId, channel: "linkedin", preview: true },
      });
      if (error) throw error;
      setPreviewText(data?.body ?? "No output returned.");
    } catch (e: any) {
      toast.error("Preview failed: " + e.message);
    } finally {
      setPreviewing(false);
    }
  };

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading brand profile…</div>;

  const sectionStyle = "rounded-lg p-4 space-y-4";
  const sectionBg = light
    ? { background: "#F8FAFC", border: "1px solid #E2E8F0" }
    : { background: "#111827", border: "1px solid #1F2D45" };
  const labelStyle = "text-xs font-medium" as const;
  const labelColor = light ? { color: "#64748B" } : { color: "#94A3B8" };
  const inputClass = light
    ? "bg-white border-slate-200 text-foreground"
    : "bg-transparent border-slate-700 text-white";

  return (
    <div className="space-y-6">
      {/* Section 1: Business Context */}
      <div className={sectionStyle} style={sectionBg}>
        <h3 className="text-sm font-semibold mb-3">Business Context</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Website URL</label>
            <Input value={form.website_url} onChange={(e) => update("website_url", e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Industry</label>
            <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelStyle} style={labelColor}>Business Description</label>
          <Textarea value={form.business_description} onChange={(e) => update("business_description", e.target.value)} className={`${inputClass} min-h-[80px]`} />
        </div>
        <div className="space-y-1.5">
          <label className={labelStyle} style={labelColor}>Target Audience</label>
          <Textarea value={form.target_audience} onChange={(e) => update("target_audience", e.target.value)} className={`${inputClass} min-h-[60px]`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Services</label>
            <TagInput value={form.services} onChange={(v) => update("services", v)} placeholder="Add service…" />
          </div>
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Location</label>
            <Input value={form.location} onChange={(e) => update("location", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Section: Brand Colors */}
      <div className={sectionStyle} style={sectionBg}>
        <h3 className="text-sm font-semibold mb-3">Brand Colors</h3>
        <p className="text-xs mb-3" style={labelColor}>Used for image generation prompts and UI theming.</p>
        <div className="flex flex-wrap items-center gap-3">
          {form.brand_colors.map((color, i) => (
            <div key={i} className="relative group">
              <label className="block cursor-pointer">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const updated = [...form.brand_colors];
                    updated[i] = e.target.value;
                    update("brand_colors", updated);
                  }}
                  className="sr-only"
                />
                <div
                  className="h-10 w-10 rounded-lg border border-slate-600 shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: color }}
                />
              </label>
              <button
                onClick={() => {
                  const updated = form.brand_colors.filter((_, idx) => idx !== i);
                  update("brand_colors", updated);
                }}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>
              <p className="text-[10px] text-center mt-1 uppercase" style={labelColor}>{color}</p>
            </div>
          ))}
          {/* Always show empty slots up to at least 2, plus the add button */}
          {form.brand_colors.length < 8 && (
            <button
              onClick={() => update("brand_colors", [...form.brand_colors, "#3B82F6"])}
              className="h-10 w-10 rounded-lg border border-dashed border-slate-600 flex items-center justify-center hover:border-slate-400 transition-colors"
            >
              <Plus className="h-4 w-4" style={labelColor} />
            </button>
          )}
        </div>
      </div>

      {/* Section 2: Voice & Tone */}
      <div className={sectionStyle} style={sectionBg}>
        <h3 className="text-sm font-semibold mb-3">Voice & Tone</h3>
        <div className="space-y-1.5">
          <label className={labelStyle} style={labelColor}>Tone of Voice</label>
          <Textarea value={form.tone_of_voice} onChange={(e) => update("tone_of_voice", e.target.value)} className={`${inputClass} min-h-[60px]`} placeholder="e.g. professional but approachable, never salesy" />
        </div>
        <div className="space-y-1.5">
          <label className={labelStyle} style={labelColor}>Writing Style Notes</label>
          <Textarea value={form.writing_style_notes} onChange={(e) => update("writing_style_notes", e.target.value)} className={`${inputClass} min-h-[60px]`} />
        </div>
        <div className="space-y-1.5">
          <label className={labelStyle} style={labelColor}>Writing Examples (paste 2-3 real posts)</label>
          <Textarea value={form.writing_examples} onChange={(e) => update("writing_examples", e.target.value)} className={`${inputClass} min-h-[120px]`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Words to Avoid</label>
            <TagInput value={form.words_to_avoid} onChange={(v) => update("words_to_avoid", v)} placeholder="e.g. synergy" />
          </div>
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Words to Use</label>
            <TagInput value={form.words_to_use} onChange={(v) => update("words_to_use", v)} placeholder="Preferred phrases" />
          </div>
        </div>
      </div>

      {/* Section 3: Content Strategy */}
      <div className={sectionStyle} style={sectionBg}>
        <h3 className="text-sm font-semibold mb-3">Content Strategy</h3>
        <div className="space-y-1.5">
          <label className={labelStyle} style={labelColor}>Content Pillars</label>
          <TagInput value={form.content_pillars} onChange={(v) => update("content_pillars", v)} placeholder="e.g. SMSF, tax tips" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Topics to Avoid</label>
            <TagInput value={form.topics_to_avoid} onChange={(v) => update("topics_to_avoid", v)} />
          </div>
          <div className="space-y-1.5">
            <label className={labelStyle} style={labelColor}>Competitors</label>
            <TagInput value={form.competitors} onChange={(v) => update("competitors", v)} />
          </div>
        </div>
      </div>

      {/* Section 4: AI Generation Settings */}
      <div className={sectionStyle} style={sectionBg}>
        <h3 className="text-sm font-semibold mb-3">AI Generation Settings</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={labelStyle} style={labelColor}>LinkedIn Post Length</label>
            <RadioGroup value={form.post_length_linkedin} onValueChange={(v) => update("post_length_linkedin", v)} className="flex gap-4">
              {["short", "medium", "long"].map((v) => (
                <div key={v} className="flex items-center gap-1.5">
                  <RadioGroupItem value={v} id={`li-${v}`} />
                  <Label htmlFor={`li-${v}`} className="text-xs capitalize">{v}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <label className={labelStyle} style={labelColor}>Threads Post Length</label>
            <RadioGroup value={form.post_length_threads} onValueChange={(v) => update("post_length_threads", v)} className="flex gap-4">
              {["short", "medium"].map((v) => (
                <div key={v} className="flex items-center gap-1.5">
                  <RadioGroupItem value={v} id={`th-${v}`} />
                  <Label htmlFor={`th-${v}`} className="text-xs capitalize">{v}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <Switch checked={form.use_emojis} onCheckedChange={(v) => update("use_emojis", v)} />
            <span className="text-xs" style={labelColor}>Use Emojis</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.use_hashtags} onCheckedChange={(v) => update("use_hashtags", v)} />
            <span className="text-xs" style={labelColor}>Use Hashtags</span>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          <label className={labelStyle} style={labelColor}>CTA Style</label>
          <RadioGroup value={form.cta_style} onValueChange={(v) => update("cta_style", v)} className="flex gap-4">
            {[{ v: "none", l: "None" }, { v: "soft", l: "Soft question" }, { v: "direct", l: "Direct link" }].map(({ v, l }) => (
              <div key={v} className="flex items-center gap-1.5">
                <RadioGroupItem value={v} id={`cta-${v}`} />
                <Label htmlFor={`cta-${v}`} className="text-xs">{l}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className={`${saved ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"} text-white`}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saved ? <><Check className="h-4 w-4 mr-1" /> Saved</> : "Save Brand Profile"}
        </Button>
        <Button variant="outline" className={light ? "border-slate-200 text-slate-600" : "border-slate-700 text-slate-300"} onClick={handlePreview} disabled={previewing}>
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Preview AI Voice
        </Button>
      </div>

      {previewing && <AILoadingState message={`Writing in ${clientName}'s voice…`} />}

      {previewText && (
        <div className="rounded-lg p-4 space-y-2" style={light ? { background: "#F0F9FF", border: "1px solid rgba(59,130,246,0.2)" } : { background: "#111827", border: "1px solid rgba(59,130,246,0.3)" }}>
          <p className="text-xs font-medium text-blue-500">✦ AI Voice Preview — LinkedIn</p>
          <p className={`text-sm whitespace-pre-wrap ${light ? "text-foreground" : ""}`} style={light ? {} : { color: "#F1F5F9" }}>{previewText}</p>
          <Button size="sm" variant="outline" className={light ? "border-slate-200 text-slate-500" : "border-slate-700 text-slate-400"} onClick={() => setPreviewText(null)}>
            Close Preview
          </Button>
        </div>
      )}
    </div>
  );
}
