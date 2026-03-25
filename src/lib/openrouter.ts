export interface Model {
  id: string;
  name: string;
  modelId: string;
}

export const API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const MODELS: Model[] = [
  { id: "axo-v1", name: "Axo Ai v1", modelId: "llama-3.3-70b-versatile" },
  { id: "axo-v2", name: "Axo Ai v2", modelId: "llama-3.1-8b-instant" },
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
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
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
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
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
