import { GoogleGenAI } from "@google/genai";

// This file should not be modified. It is used for internal purposes only.
// If you want to make changes, please create a new file.
// If you need to use the Gemini API, please use the GeminiAdapter.
// For more information, please see the documentation.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const model = 'gemini-flash-latest';

export async function generateTitlesFromImage(base64Image: string, existingTitles: string[]): Promise<string[]> {
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };

  const existingTitlesText = existingTitles.length > 0
    ? `
      - **Crucial Constraint:** Avoid generating titles that are thematically or structurally similar to the following existing titles. Be creative and ensure your suggestions are unique and fresh compared to this list:
      ${existingTitles.map(t => `  - ${t}`).join('\n')}
    `
    : '';

  const textPart = {
    text: `
      Role and Goal: You are a poetic and spiritual art curator with a deep understanding of marketing for a high-end, faith-based American audience. Your goal is to generate three evocative, short, and memorable titles for the provided piece of art.

      Visual Analysis: Deeply analyze the artwork's colors, subjects (like butterflies, hearts, etc.), and overall mood. The titles must reflect this visual and emotional essence.

      Core Theme: The titles should be subtly inspired by Christian themes, hope, and transformation. Use allusions to well-known Bible verses, spiritual concepts, or emotionally resonant phrases from popular Christian culture (books, songs, events).

      Creative Guidelines:
      - **Be Poetic, Not Descriptive:** Avoid literal descriptions (e.g., "Colorful Butterfly Painting"). Instead, use metaphors and evocative language (e.g., "Heaven's Hues," "Metamorphosis Prayer"). The title should suggest a story or feeling.
      - **Connect with the Target Audience:** The tone should be warm, inspirational, and artistic, resonating with American women aged 35+.

      Constraints:
      - Respond in English.
      - Provide only the three titles, each on a new line. No numbering, no bullet points, no extra text.
      - **Strict Length:** Each title must be short and impactful, strictly between 2 and 4 words.
      ${existingTitlesText}

      Final Check: Before responding, ensure each title is unique, emotionally resonant, and aligns with the spiritual essence of Ivan Guaderrama's art.

      Generate exactly three new, original, short titles (2-4 words each) based on the provided image.
    `
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [textPart, imagePart] },
    });

    const text = response.text;
    return text.split('\n').map(title => title.trim().replace(/^- /g, '')).filter(title => title.length > 0);
  } catch (error) {
    console.error("Error generating titles from Gemini:", error);
    throw new Error("Failed to generate titles from the image.");
  }
}
