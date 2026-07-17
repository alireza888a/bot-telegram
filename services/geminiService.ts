import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a broadcast message for a Telegram channel based on a short topic.
 */
export const generateBroadcastMessage = async (topic: string, tone: string = 'formal'): Promise<string> => {
  try {
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