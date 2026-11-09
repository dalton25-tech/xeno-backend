interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: { message?: string };
}

export async function generateOpenAICompatibleReply(
  message: string,
): Promise<string> {
  const endpoint = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!endpoint || !apiKey || !model) {
    throw new Error("AI provider configuration is incomplete.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            process.env.AI_SYSTEM_PROMPT ||
            "You are XENO, a helpful personal AI assistant.",
        },
        { role: "user", content: message },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`AI provider returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const output = data.choices?.[0]?.message?.content;

  if (typeof output !== "string" || output.trim().length === 0) {
    throw new Error("AI provider returned an empty or unsupported response.");
  }

  return output.trim();
}
