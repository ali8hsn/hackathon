import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export async function claudeJSON<T>(
  system: string,
  user: string,
  imageBase64?: string,
  imageMime: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<T> {
  const client = getClient();

  const userContent: Anthropic.MessageParam["content"] = imageBase64
    ? [
        {
          type: "image",
          source: { type: "base64", media_type: imageMime, data: imageBase64 },
        } as Anthropic.ImageBlockParam,
        { type: "text", text: user } as Anthropic.TextBlockParam,
      ]
    : user;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const text = msg.content.find((b) => b.type === "text")?.text ?? "";

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function claudeText(system: string, user: string, imageBase64?: string): Promise<string> {
  const client = getClient();

  const userContent: Anthropic.MessageParam["content"] = imageBase64
    ? [
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: imageBase64 },
        } as Anthropic.ImageBlockParam,
        { type: "text", text: user } as Anthropic.TextBlockParam,
      ]
    : user;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  return msg.content.find((b) => b.type === "text")?.text?.trim() ?? "";
}
