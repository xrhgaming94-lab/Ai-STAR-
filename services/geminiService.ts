import { GoogleGenAI, Modality, Content } from "@google/genai";
import { ChatMessage } from '../types';

let ai: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }
    
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set. Please ensure it is configured in your hosting environment.");
    }

    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
};

export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const currentAi = getAi();
    const result = await currentAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following user prompt into a concise title of 5 words or less. Just return the title itself, with no extra formatting or quotation marks. Prompt: "${firstMessage}"`,
    });
    return result.text.trim().replace(/"/g, '');
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat";
  }
}


export async function* sendMessageToGeminiStream(history: ChatMessage[]): AsyncGenerator<string> {
  try {
    const currentAi = getAi();
    
    const lastMessage = history[history.length - 1];
    if (lastMessage.role !== 'user') {
        // This case should ideally not happen if UI logic is correct.
        console.error("Stream generation was not started with a user message.");
        yield "I can only respond to a user message.";
        return;
    }

    const geminiHistory: Content[] = history.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    const chat = currentAi.chats.create({
        model: 'gemini-2.5-flash',
        history: geminiHistory,
        config: {
          systemInstruction: "You are a friendly and helpful AI assistant for a website called AI STAR. AI STAR is a platform that uses AI to help users create compelling ad copy and marketing materials. Your role is to greet visitors, answer common questions about AI STAR's services, provide navigation assistance by suggesting pages like 'Pricing', 'Features', or 'Contact', and help users draft ad copy if they ask.",
        }
    });

    const result = await chat.sendMessageStream({ message: lastMessage.content });

    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes("API_KEY")) {
            yield "Sorry, the AI service is not configured correctly. Please contact the site administrator.";
        } else {
            yield `Sorry, I encountered an error: ${error.message}. Please try again.`;
        }
    } else {
        yield "Sorry, an unknown error occurred. Please try again.";
    }
  }
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  try {
    const currentAi = getAi();
    const response = await currentAi.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64Data}`;
      }
    }
    throw new Error('No image data found in the response from the AI.');
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image generation.");
  }
}