
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSalesInsights = async (sales: Sale[], products: Product[]): Promise<AIInsight> => {
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

/**
 * 使用 Gemini 模型根据商品描述生成高品质美食图片
 */
export const generateProductImage = async (productName: string): Promise<string | null> => {
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
