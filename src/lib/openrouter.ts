export interface Model {
  id: string;
  name: string;
  modelId: string;
  apiUrl: string;
  apiKey: string;
}

export const MODELS: Model[] = [
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    modelId: "deepseek-ai/deepseek-r1",
    apiUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    apiKey: "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",
  },
  {
    id: "mistral-small",
    name: "Mistral Small 3.1",
    modelId: "mistralai/mistral-small-3.1-24b-instruct",
    apiUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    apiKey: "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",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    modelId: "gpt-4o-mini",
    apiUrl: "https://models.inference.ai.azure.com/chat/completions",
    apiKey: "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",
  },
  {
    id: "llama-70b",
    name: "Llama 3.3 70B",
    modelId: "llama-3.3-70b-versatile",
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: "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",
  },
  {
    id: "llama-8b",
    name: "Llama 3.1 8B",
    modelId: "llama-3.1-8b-instant",
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: "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",
  },
];

export const FLUX_API_KEY = "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";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Axo Ai, a powerful and accurate AI assistant. Your knowledge was last updated in 2026. The current year is 2026. When asked about time, dates, or current events, respond accordingly based on 2026.

Important instructions:
- Always provide thorough, well-researched, and accurate answers
- When you see a URL/link in the user's message, acknowledge it and provide information about what you know regarding that URL or topic
- Structure your responses clearly with headings and bullet points when appropriate
- For code questions, always provide complete, working code examples
- If you're unsure about something, say so rather than guessing
- Be concise but comprehensive`;

export async function streamChat({
  messages,
  model,
  onDelta,
  onDone,
  onThinkingDone,
  signal,
}: {
  messages: ChatMessage[];
  model: Model;
  onDelta: (text: string) => void;
  onDone: () => void;
  onThinkingDone?: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(model.apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${model.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.modelId,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
    }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    const errorText = await resp.text();
    throw new Error(`API error ${resp.status}: ${errorText}`);
  }

  if (onThinkingDone) onThinkingDone();

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        // partial JSON, skip
      }
    }
  }
  onDone();
}

export async function generateTitle(firstMessage: string, model: Model): Promise<string> {
  try {
    const resp = await fetch(model.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${model.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.modelId,
        messages: [
          {
            role: "user",
            content: `Generate a very short title (max 5 words) for a conversation that starts with this message. Return ONLY the title, nothing else:\n\n"${firstMessage}"`,
          },
        ],
      }),
    });
    const data = await resp.json();
    const title = data.choices?.[0]?.message?.content?.trim();
    return title || firstMessage.slice(0, 40);
  } catch {
    return firstMessage.slice(0, 40);
  }
}
