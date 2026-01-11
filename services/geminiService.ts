
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale, AIInsight } from "../types";

// 延迟初始化或增加安全检查，确保 apiKey 存在
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
    As a business analyst for NovaPOS, analyze the following sales data and inventory:
    Sales Count: ${sales.length}
    Total Revenue: $${sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}
    Current Products: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock })))}
    Recent Sales (Last 5): ${JSON.stringify(sales.slice(-5).map(s => ({ total: s.total, items: s.items.length })))}

    Provide a summary of performance, 3 actionable recommendations for inventory or pricing, and a brief trend analysis.
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

export const generateProductImage = async (productName: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ 
          text: `Professional, commercial high-quality food photography of ${productName}. The lighting is warm and inviting, appetizing, centered, high resolution, soft background.` 
        }],
      },
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
