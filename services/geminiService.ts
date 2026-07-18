import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

/**
 * Lazy-initializer for the Gemini client.
 * Returns null if the API key is not present, rather than throwing on module load.
 */
const getGeminiClient = (): GoogleGenAI | null => {
  if (aiInstance) return aiInstance;

  try {
    // Safely retrieve the key, supporting Vite defines or server-side process env
    const apiKey = typeof process !== "undefined" && process?.env ? process.env.API_KEY : undefined;
    
    if (!apiKey) {
      console.warn("Gemini API key is not configured or is empty.");
      return null;
    }

    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
    return null;
  }
};

/**
 * Generates a broadcast message for a Telegram channel based on a short topic.
 */
export const generateBroadcastMessage = async (topic: string, tone: string = 'formal'): Promise<string> => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return "خطا: کلید API برای هوش مصنوعی تنظیم نشده است. این قابلیت در حال حاضر در دسترس نیست.";
    }

    const prompt = `
      You are an expert social media manager for a Persian Telegram channel.
      Write a compelling broadcast message in Persian (Farsi) about the following topic: "${topic}".
      
      Tone: ${tone}.
      
      Requirements:
      - Use emojis appropriately.
      - Keep it engaging and concise.
      - Format with paragraphs.
      - Do not include hashtags unless necessary.
      - Return ONLY the raw Persian text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "خطا در تولید متن.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "متاسفانه در حال حاضر امکان ارتباط با هوش مصنوعی وجود ندارد.";
  }
};

/**
 * Suggests inline button labels for a given post content.
 */
export const suggestButtonLabels = async (postContent: string): Promise<string[]> => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      console.warn("Gemini client is not available. Using default fallback labels.");
      return ["لینک", "تایید", "عضویت"];
    }

    const prompt = `
      Based on the following Telegram post content (in Persian), suggest 4 short, catchy labels for inline buttons (e.g., "Buy Now", "Join Channel", "Read More").
      
      Post Content: "${postContent.substring(0, 500)}..."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["لینک", "تایید", "عضویت"];
  }
};
