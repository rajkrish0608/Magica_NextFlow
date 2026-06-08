import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

export interface GeminiPayload {
  model: string;
  systemPrompt?: string;
  prompt: string;
  imageUrls?: string[];
  nodeId: string;
  runId: string;
}

function resolveGeminiModel(model: string): string {
  const map: Record<string, string> = {
    "gemini-3.1-pro": "gemini-1.5-pro",
    "gemini-3.1": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-2.0-flash": "gemini-2.0-flash",
  };
  return map[model] || "gemini-1.5-flash";
}

export const geminiTask = task({
  id: "gemini-task",
  run: async (payload: GeminiPayload) => {
    const { model, systemPrompt, prompt, imageUrls, nodeId, runId } = payload;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const resolvedModel = resolveGeminiModel(model);

    const geminiModel = genAI.getGenerativeModel({
      model: resolvedModel,
      systemInstruction: systemPrompt || undefined,
    });

    const parts: Part[] = [{ text: prompt }];

    // Add vision images if provided
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        try {
          const res = await fetch(url);
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType = res.headers.get("content-type") || "image/jpeg";
          parts.push({
            inlineData: { data: base64, mimeType },
          });
        } catch (e) {
          console.error("Failed to load image for vision:", url, e);
        }
      }
    }

    const result = await geminiModel.generateContent(parts);
    const response = result.response.text();

    return {
      success: true,
      response,
      nodeId,
      runId,
    };
  },
});
