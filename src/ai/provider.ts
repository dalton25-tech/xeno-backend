import { generateOpenAICompatibleReply } from "./openai-compatible";

export interface AIProvider {
  generateReply(message: string): Promise<string>;
}

export function isAIConfigured(): boolean {
  return Boolean(
    process.env.AI_API_URL &&
      process.env.AI_API_KEY &&
      process.env.AI_MODEL,
  );
}

/**
 * Provider selection stays behind this adapter boundary.
 * Additional provider implementations can be added without changing API routes.
 */
export async function generateReply(message: string): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error("AI provider configuration is incomplete.");
  }

  const provider: AIProvider = {
    generateReply: generateOpenAICompatibleReply,
  };

  return provider.generateReply(message);
}
