export interface Model {
  id: string;
  name: string;
  apiKey: string;
  modelId: string;
}

export const MODELS: Model[] = [
  {
    id: "venice",
    name: "Venice Uncensored",
    apiKey: "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",
    modelId: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
  },
  {
    id: "nemotron",
    name: "Nemotron 3 Super",
    apiKey: "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",
    modelId: "nvidia/llama-3.3-nemotron-super-49b-v1:free",
  },
  {
    id: "riverflow",
    name: "Riverflow v2 Pro",
    apiKey: "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",
    modelId: "deepseek/deepseek-r1:free",
  },
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat({
  messages,
  model,
  onDelta,
  onDone,
  signal,
}: {
  messages: ChatMessage[];
  model: Model;
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${model.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-OpenRouter-Title": "Bhosdu Cord",
    },
    body: JSON.stringify({
      model: model.modelId,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    const errorText = await resp.text();
    throw new Error(`API error ${resp.status}: ${errorText}`);
  }

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
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
