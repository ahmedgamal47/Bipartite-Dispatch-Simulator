
import { GoogleGenAI, Type } from "@google/genai";
import type { Request, Driver } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generatePrompt = (requests: Request[], drivers: Driver[]): string => {
  const requestData = requests.map(r => ({ id: r.id, location: { x: r.location.x.toFixed(1), y: r.location.y.toFixed(1) } }));
  const driverData = drivers.map(d => ({ id: d.id, location: { x: d.location.x.toFixed(1), y: d.location.y.toFixed(1) } }));

  return `
    You are a dispatch optimization AI for a ride-sharing service. Your task is to generate a cost matrix for a bipartite matching problem between ride requests and available drivers.

    A lower cost indicates a better match. The cost should be primarily based on the Euclidean distance between a request and a driver, but you must also introduce a small, non-linear "AI factor" to simulate your advanced understanding of the environment. This factor could represent predicted traffic, driver preferences, or demand hotspots. This makes the matching non-obvious and more optimized than a simple distance calculation.

    Requests (rows): ${JSON.stringify(requestData)}
    Drivers (columns): ${JSON.stringify(driverData)}

    The output MUST be a valid JSON object.
    The cost values should be positive numbers.
  `;
};

export const getAiOptimizedCostMatrix = async (requests: Request[], drivers: Driver[]): Promise<number[][]> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  if (requests.length === 0 || drivers.length === 0) {
    return [];
  }

  const prompt = generatePrompt(requests, drivers);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            cost_matrix: {
                type: Type.ARRAY,
                description: `A 2D array of costs where rows correspond to requests and columns to drivers. The dimensions should be ${requests.length}x${drivers.length}.`,
                items: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.NUMBER,
                    }
                }
            },
            explanation: {
                type: Type.STRING,
                description: "A brief explanation of the factors considered for the cost calculation."
            }
        },
      },
    },
  });

  const jsonText = response.text.trim();
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed.cost_matrix || !Array.isArray(parsed.cost_matrix)) {
        throw new Error("Invalid JSON response: 'cost_matrix' field is missing or not an array.");
    }
    // Basic validation
    if (parsed.cost_matrix.length !== requests.length || (parsed.cost_matrix[0] && parsed.cost_matrix[0].length !== drivers.length)) {
        throw new Error(`Dimension mismatch in response. Expected ${requests.length}x${drivers.length}, got ${parsed.cost_matrix.length}x${parsed.cost_matrix[0]?.length || 0}`);
    }
    return parsed.cost_matrix;
  } catch (e) {
    console.error("Failed to parse Gemini JSON response:", jsonText, e);
    throw new Error("Could not parse AI model response.");
  }
};
