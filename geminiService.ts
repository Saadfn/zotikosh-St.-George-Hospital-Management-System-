import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
  if (ai) return ai;

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export interface AnalysisResult {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestions: string[];
}

export const isAIAvailable = (): boolean => {
  return !!(process.env.API_KEY || process.env.GEMINI_API_KEY);
};

export const analyzeMedicalRecord = async (symptoms: string, history: string): Promise<AnalysisResult> => {
  const client = getAI();

  if (!client) {
    return {
      summary: "AI analysis unavailable. No API key configured.",
      riskLevel: "LOW",
      suggestions: ["Configure GEMINI_API_KEY in environment variables to enable AI analysis."]
    };
  }

  // Use gemini-3-pro-preview for complex reasoning tasks like medical analysis.
  // Set thinkingBudget to 32768 for high-quality reasoning.
  const response = await client.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          text: `Analyze the following patient data for a doctor's assistance.
    Symptoms: ${symptoms}
    History: ${history}`
        }
      ]
    },
    config: {
      systemInstruction: "You are a professional medical diagnostic assistant. Provide a structured summary, risk assessment, and actionable suggestions based on symptoms and history. Do not provide a definitive diagnosis, use cautious language.",
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32768 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["summary", "riskLevel", "suggestions"]
      }
    }
  });

  try {
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return {
      summary: "Error analyzing data.",
      riskLevel: "LOW",
      suggestions: ["Consult a specialist immediately."]
    };
  }
};
