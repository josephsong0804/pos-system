
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale, AIInsight } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getSalesInsights = async (sales: Sale[], products: Product[]): Promise<AIInsight> => {
  const ai = getAIClient();
  if (!ai) throw new Error("AI client not initialized");

  const model = 'gemini-3-flash-preview';
  const prompt = `
    As a business analyst for NovaPOS Malaysia, analyze the following sales data and inventory:
    Sales Count: ${sales.length}
    Total Revenue: RM ${sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}
    Current Products: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock })))}
    Recent Sales (Last 5): ${JSON.stringify(sales.slice(-5).map(s => ({ total: s.total, items: s.items.length })))}

    Provide a summary of performance, 3 actionable recommendations for inventory or pricing (localized for Malaysia market), and a brief trend analysis.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            trendAnalysis: { type: Type.STRING }
          },
          required: ["summary", "recommendations", "trendAnalysis"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Insights Error:", error);
    return {
      summary: "Performance is steady. Unable to generate deep insights at this moment.",
      recommendations: ["Monitor low stock items", "Analyze peak hours", "Review pricing strategies"],
      trendAnalysis: "Insufficient data for detailed trend analysis."
    };
  }
};

/**
 * 优化后的 AI 图片生成
 * 增加了对马来西亚美食风格的深度定制，支持多种构图
 */
export const generateProductImage = async (productName: string, style: 'Gourmet' | 'Flatlay' | 'Street' = 'Gourmet'): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  const stylePrompts = {
    Gourmet: "Professional commercial food photography, studio lighting, bokeh background, macro lens, elegant plating.",
    Flatlay: "Top-down view food photography, minimalist aesthetic, natural lighting, organized arrangement on a clean table.",
    Street: "Vibrant Malaysian street food style, steam rising, warm ambient lighting, authentic wooden table or banana leaf background."
  };

  const fullPrompt = `${stylePrompts[style]} Appetizing close-up shot of ${productName}. High resolution, 4k, delicious textures, colorful, food magazine quality. The food is fresh and beautifully presented.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("AI Image Generation Error:", error);
    return null;
  }
};
