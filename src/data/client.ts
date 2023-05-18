import { ChatMessage } from "./types";

type OnAnswerUpdate = (chunk: string, aggregate: string) => void;

export type AskBotInput = {
  prompt: string;
  onAnswerUpdate: OnAnswerUpdate;
};

export function buildPrompt(prompt: string, messages: ChatMessage[]): string {
  let memory = messages
    .map((message, index) => {
      if (message.user === "human") {
        if (index === 0) {
          return `I asked you the following: ${message.text}\n`;
        }
        return `Then I followed up with: ${message.text}\n`;
      }

      return `Then you answered with: ${message.text}\n`;
    })
    .join("\n");
  if (memory.trim().length > 0) {
    memory = `Let's continue our previous conversation where ${memory}`;
    memory += "\nNow I want to follow-up with:";
  }
  if (memory.trim().length === 0) {
    memory = memory.trim();
  }
  return `USER: ${memory}${prompt}\nASSISTANT:`;
}

/**
 *
 * @param prompt
 * @param onAnswerUpdate
 * @returns
 * @see chat.py: underlying implementation at `/fal_serverless/chat.py`
 */
export async function askBot({
  prompt,
  onAnswerUpdate,
}: AskBotInput): Promise<string> {
  const url = process.env.NEXT_PUBLIC_CHAT_FUNCTION_URL;
  if (!url) {
    throw new Error("API URL not set");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-fal-key-id": process.env.NEXT_PUBLIC_FAL_KEY_ID ?? "",
      "x-fal-key-secret": process.env.NEXT_PUBLIC_FAL_KEY_SECRET ?? "",
    },
    body: JSON.stringify({
      prompt,
    }),
  });
  if (!response.ok) {
    const content = await response.text();
    throw new Error(content);
  }

  const body = response.body;
  if (!body) {
    throw new Error("No body");
  }

  const reader = body.getReader();

  let isStreaming = true;
  const decoder = new TextDecoder();
  let answer = "";
  while (isStreaming) {
    const { done, value } = await reader.read();

    isStreaming = !done;
    if (value) {
      const chunk = decoder.decode(value);
      answer += chunk;
      onAnswerUpdate(chunk, answer);
    }
  }
  return answer;
}
