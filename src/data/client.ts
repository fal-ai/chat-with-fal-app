import { Message } from "./types";

type OnAnswerUpdate = (chunk: string, aggregate: string) => void;

export type AskBotInput = {
  prompt: string;
  onAnswerUpdate: OnAnswerUpdate;
};

export function buildPrompt(prompt: string, messages: Message[]): string {
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
 * Sends the request to the fal-serverless function that interacts with
 * the LLM selected model, only `TheBloke/vicuna-13B-1.1-HF` is supportted for now.
 * @param prompt the user prompt
 * @param onAnswerUpdate callback that will be called as the answer is being streamed
 * @returns the final answer from the model.
 * @see `chat.py` (underlying implementation at `/fal_serverless/chat.py`)
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

/**
 * This is not an ideal implementation of a warm-up function, so the bot is started
 * before the first message is submitted. Once the model implementation is improved,
 * this function should be removed or replaced with a proper cache warm-up implementation.
 */
export async function wakeUp() {
  return askBot({ prompt: "Hello!", onAnswerUpdate: () => {} });
}
