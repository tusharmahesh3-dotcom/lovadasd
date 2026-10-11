import { GoogleGenAI, Type } from "@google/genai";

export interface AiGeneratedContent {
  headline: string;
  subheadline: string;
  badge: string;
  ctaText: string;
  secondaryCtaText: string;
  features: Array<{ title: string; description: string; icon: string }>;
  testimonials: Array<{ quote: string; author: string; role: string; company: string }>;
  pricingTiers: Array<{
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted: boolean;
  }>;
  faqItems: Array<{ question: string; answer: string }>;
  customCss?: string;
}

/**
 * Calls Gemini's top model to generate authentic, structured website content,
 * layout hierarchy, compelling copy, and custom styling.
 */
export async function generateSiteWithGemini(
  prompt: string,
  brand?: { primaryColor?: string; accentColor?: string; fontDisplay?: string; logoText?: string },
  modelName: string = "gemini-3.1-pro-preview",
): Promise<AiGeneratedContent | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const systemInstruction = `You are an elite website designer and frontend engineer.
Analyze the user's website description and generate a complete, high-converting landing page structure and copy.
Craft crisp, memorable headlines, persuasive value propositions, and tailored feature sets.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Generate a complete landing page for: ${prompt}. ${
        brand?.logoText ? `Brand name: ${brand.logoText}.` : ""
      } ${brand?.primaryColor ? `Primary color: ${brand.primaryColor}.` : ""}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: "A bold, punchy hero headline under 12 words" },
            subheadline: { type: Type.STRING, description: "Clear, persuasive value proposition explaining how it works" },
            badge: { type: Type.STRING, description: "Short category badge pill" },
            ctaText: { type: Type.STRING, description: "Primary action button text" },
            secondaryCtaText: { type: Type.STRING, description: "Secondary action button text" },
            features: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING },
                },
                required: ["title", "description", "icon"],
              },
            },
            testimonials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  author: { type: Type.STRING },
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                },
                required: ["quote", "author", "role", "company"],
              },
            },
            pricingTiers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                  period: { type: Type.STRING },
                  description: { type: Type.STRING },
                  features: { type: Type.ARRAY, items: { type: Type.STRING } },
                  highlighted: { type: Type.BOOLEAN },
                },
                required: ["name", "price", "period", "description", "features", "highlighted"],
              },
            },
            faqItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
            },
            customCss: { type: Type.STRING, description: "Optional CSS enhancements" },
          },
          required: [
            "headline",
            "subheadline",
            "badge",
            "ctaText",
            "secondaryCtaText",
            "features",
            "testimonials",
            "pricingTiers",
            "faqItems",
          ],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text) as AiGeneratedContent;
  } catch (err) {
    console.warn(`[Gemini API error with ${modelName}]:`, (err as Error).message);
    if (modelName !== "gemini-3.8-flash") {
      return generateSiteWithGemini(prompt, brand, "gemini-3.8-flash");
    }
    return null;
  }
}
