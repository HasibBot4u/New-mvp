import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { GoogleGenAI } from "@google/genai";
import toast from "react-hot-toast";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function ImageGeneratorPage() {
  const { user } = useAuthStore();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1K" | "2K" | "4K">("1K");
  const [model, setModel] = useState<"gemini-3.1-flash-image-preview" | "gemini-3-pro-image-preview">("gemini-3.1-flash-image-preview");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      // Check if API key is available
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: size,
          },
        },
      });

      let imageUrl = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        toast.success("Image generated successfully!");
        
        // Save to Firestore
        if (user) {
          const genId = crypto.randomUUID();
          await setDoc(doc(db, "image_generations", genId), {
            user_id: user.id,
            prompt,
            size,
            status: "completed",
            image_url: imageUrl,
            created_at: serverTimestamp()
          });
        }
      } else {
        throw new Error("No image was returned from the model");
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          AI Image Generator
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Create high-quality educational images and diagrams using Gemini AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)] space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                Model
              </label>
              <Select 
                value={model} 
                onChange={(e) => setModel(e.target.value as any)}
                options={[
                  { value: "gemini-3.1-flash-image-preview", label: "Flash (Fast, Edit)" },
                  { value: "gemini-3-pro-image-preview", label: "Pro (High Quality)" }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                Image Size
              </label>
              <Select 
                value={size} 
                onChange={(e) => setSize(e.target.value as any)}
                options={[
                  { value: "1K", label: "1K Resolution" },
                  { value: "2K", label: "2K Resolution" },
                  { value: "4K", label: "4K Resolution" }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate (e.g., 'A detailed diagram of a plant cell with labels')"
                className="w-full h-32 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] resize-none"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleGenerate}
              loading={loading}
            >
              Generate Image
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 shadow-[var(--shadow-card)] min-h-[400px] flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                <div className="w-12 h-12 border-4 border-[var(--color-primary-pale)] border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                <p>Generating your image... This may take a few seconds.</p>
              </div>
            ) : generatedImage ? (
              <div className="w-full flex flex-col items-center">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="max-w-full max-h-[600px] rounded-lg shadow-md object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="mt-4 flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = generatedImage;
                      a.download = `generated-image-${Date.now()}.png`;
                      a.click();
                    }}
                  >
                    Download Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-[var(--color-text-muted)]">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Your generated image will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
