import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

// Initialize Firebase AI
const ai = getAI(undefined, { backend: new GoogleAIBackend() });

// Helper to create a model instance
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

/**
 * Generate an AI farming reply (for chat or Q&A with farmers)
 */
export const generateFarmingReply = async (
  prompt: string
): Promise<string | null> => {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "system",
          parts: [
            {
              text: `
                You are an AI farming assistant helping small and local farmers make better agricultural decisions.
                Give clear, friendly, and practical advice about sustainable farming, crop planning, and resource use.
              `,
            },
          ],
        },
        { role: "user", parts: [{ text: prompt }] },
      ],
    });

    return result.response.text();
  } catch (error) {
    console.error("Error generating farming reply:", error);
    return null;
  }
};

/**
 * Generate a short AI-powered summary of a farmer’s progress or profile
 */
export const generateFarmerSummary = async (
  prompt: string
): Promise<string | null> => {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "system",
          parts: [
            {
              text: `
                You are an AI summarizer for VeFarmers. Summarize farmer profiles or activity logs into short, clear updates.
                Keep summaries positive, factual, and useful for pledgers reviewing farmer progress.
              `,
            },
          ],
        },
        { role: "user", parts: [{ text: prompt }] },
      ],
    });

    return result.response.text();
  } catch (error) {
    console.error("Error generating farmer summary:", error);
    return null;
  }
};
