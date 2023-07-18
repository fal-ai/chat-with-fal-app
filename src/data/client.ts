import { Message } from "./types";

type OnAnswerUpdate = (chunk: string, aggregate: string) => void;

export type AskBotInput = {
  prompt: PromptMessage[];
  onAnswerUpdate: OnAnswerUpdate;
};

type PromptMessage = {
  role: "user" | "assistant";
  content: string;
};

export function buildPrompt(
  prompt: string,
  messages: Message[]
): PromptMessage[] {
  return [...messages, { user: "human", text: prompt }].map((message) => {
    return {
      role: message.user === "human" ? "user" : "assistant",
      content: message.text,
    };
  });
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

  const input = {
    messages: prompt,
    stream: false,
    model: "gpt-3.5-turbo",
    max_tokens: 2000,
  };
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const content = await response.text();
    throw new Error(content);
  }
  const result = await response.json();
  const answer = result.choices
    .map((choice: any) => choice.message.content)
    .join("\n");
  onAnswerUpdate(answer, answer);
  return answer;
}

/**
 * This is not an ideal implementation of a warm-up function, so the bot is started
 * before the first message is submitted. Once the model implementation is improved,
 * this function should be removed or replaced with a proper cache warm-up implementation.
 */
export async function wakeUp() {
  return askBot({ prompt: [], onAnswerUpdate: () => {} });
}
