/* Minimal OpenAI-compatible chat driver (no SDK dependency).
   Works against OpenAI, OpenRouter, or Gemini's OpenAI-compat endpoint —
   see .env.example. Streams SSE tokens via callback; accumulates tool calls. */

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ProviderResult {
  text: string;
  tools: ProviderToolCall[];
  usage: { input: number; output: number };
}

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
}

interface StreamEvents {
  onToken?: (token: string) => void;
}

export function providerConfig(): ProviderConfig | null {
  const apiKey = process.env.CHAT_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.CHAT_API_URL ?? "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.CHAT_MODEL ?? "gpt-4o-mini",
    maxTokens: 700,
    temperature: 0.4,
  };
}

interface AccumulatedTool {
  name: string;
  argsJson: string;
}

export async function streamCompletion(
  config: ProviderConfig,
  system: string,
  messages: ProviderMessage[],
  tools: unknown,
  events: StreamEvents,
  signal?: AbortSignal,
): Promise<ProviderResult> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "system", content: system }, ...messages],
      tools,
      tool_choice: "auto",
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: true,
      // Note: no stream_options.include_usage — not every OpenAI-compatible
      // endpoint accepts it, and usage here is informational only (zeros
      // when the provider omits it).
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`provider_http_${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  const toolAcc = new Map<number, AccumulatedTool>();
  let usage = { input: 0, output: 0 };
  let done = false;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const payload = trimmed.slice(5).trim();
    if (payload === "[DONE]") {
      done = true;
      return;
    }
    let json: {
      choices?: Array<{
        delta?: {
          content?: string;
          tool_calls?: Array<{
            index: number;
            function?: { name?: string; arguments?: string };
          }>;
        };
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    try {
      json = JSON.parse(payload);
    } catch {
      return; // keep-alive comment / partial flush — ignore
    }
    if (json.usage) {
      usage = {
        input: json.usage.prompt_tokens ?? 0,
        output: json.usage.completion_tokens ?? 0,
      };
    }
    const delta = json.choices?.[0]?.delta;
    if (!delta) return;
    if (typeof delta.content === "string" && delta.content) {
      text += delta.content;
      events.onToken?.(delta.content);
    }
    for (const tc of delta.tool_calls ?? []) {
      const slot = toolAcc.get(tc.index) ?? { name: "", argsJson: "" };
      if (tc.function?.name) slot.name += tc.function.name;
      if (typeof tc.function?.arguments === "string") {
        slot.argsJson += tc.function.arguments;
      }
      toolAcc.set(tc.index, slot);
    }
  };

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  if (buffer.trim()) handleLine(buffer.trim());
  try {
    await reader.cancel();
  } catch {
    /* already closed */
  }

  const calls: ProviderToolCall[] = [];
  for (const slot of [...toolAcc.entries()].sort((a, b) => a[0] - b[0])) {
    if (!slot[1].name) continue;
    let args: Record<string, unknown> = {};
    try {
      args = slot[1].argsJson ? JSON.parse(slot[1].argsJson) : {};
    } catch {
      continue; // malformed tool args — drop the call, keep the text
    }
    calls.push({ name: slot[1].name, args });
  }

  return { text: text.trim(), tools: calls, usage };
}
