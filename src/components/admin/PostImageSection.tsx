import { useState, useRef, useCallback } from "react";
import { ImagePlus, Sparkles, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostImageSectionProps {
  postId: string;
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function PostImageSection({ postId, imageUrl, onImageChange }: PostImageSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `${postId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
      await supabase.from("posts").update({ image_url: urlData.publicUrl } as any).eq("id", postId);
      onImageChange(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  }, [postId, onImageChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: aiPrompt, post_id: postId },
      });
      if (error) throw error;
      if (data?.image_url) {
        onImageChange(data.image_url);
        setAiPrompt("");
        setShowAiInput(false);
        toast.success("Image generated!");
      }
    } catch (e: any) {
      toast.error("Generation failed: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRemove = async () => {
    await supabase.from("posts").update({ image_url: null } as any).eq("id", postId);
    onImageChange(null);
    toast.success("Image removed");
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium" style={{ color: "#94A3B8" }}>Post Image</label>

      {imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border" style={{ borderColor: "#1F2D45" }}>
          <img src={imageUrl} alt="Post" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/20" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Replace
            </Button>
            <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20" onClick={handleRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${dragOver ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-slate-500"}`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#64748B" }} />
          ) : (
            <>
              <ImagePlus className="h-8 w-8" style={{ color: "#64748B" }} />
              <p className="text-xs text-center" style={{ color: "#64748B" }}>
                Drag & drop an image or <span className="text-blue-400">click to upload</span>
              </p>
            </>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />

      {showAiInput ? (
        <div className="flex gap-2">
          <Input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe the image you want…"
            className="bg-transparent border-slate-700 text-white text-xs flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={generating}
          />
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleGenerate} disabled={generating || !aiPrompt.trim()}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate"}
          </Button>
          <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => { setShowAiInput(false); setAiPrompt(""); }}>✕</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10" onClick={() => setShowAiInput(true)}>
          <Sparkles className="h-3.5 w-3.5 mr-1" /> Generate with AI
        </Button>
      )}
    </div>
  );
}
