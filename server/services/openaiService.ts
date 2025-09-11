import OpenAI from "openai";

class OpenAIService {
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      this.isConfigured = true;
    }
  }

  async getChatResponse(message: string): Promise<string> {
    if (!this.isConfigured || !this.openai) {
      return "AI chat is currently unavailable. Please configure the OpenAI API key to enable this feature.";
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for Narayani Sena, a spiritual organization devoted to Mahaprabhuji's teachings. Provide thoughtful, respectful responses about spiritual practices, community activities, and general assistance. Keep responses concise but meaningful."
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to get AI response");
    }
  }

  async generateContent(prompt: string, type: 'text' | 'image' = 'text'): Promise<string> {
    if (!this.isConfigured || !this.openai) {
      return type === 'image' ? "" : "AI content generation is currently unavailable. Please configure the OpenAI API key to enable this feature.";
    }

    try {
      if (type === 'image') {
        const response = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        return response.data?.[0]?.url || "";
      } else {
        const response = await this.openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        });

        return response.choices[0].message.content || "";
      }
    } catch (error) {
      console.error("OpenAI content generation error:", error);
      throw new Error("Failed to generate content");
    }
  }

  async analyzeContent(content: string): Promise<{ sentiment: string; topics: string[] }> {
    if (!this.isConfigured || !this.openai) {
      return { sentiment: 'neutral', topics: [] };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Analyze the given content and provide sentiment analysis and key topics. Respond with JSON in this format: { 'sentiment': 'positive/neutral/negative', 'topics': ['topic1', 'topic2'] }"
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        sentiment: result.sentiment || 'neutral',
        topics: result.topics || []
      };
    } catch (error) {
      console.error("OpenAI analysis error:", error);
      throw new Error("Failed to analyze content");
    }
  }
}

export const openaiService = new OpenAIService();
