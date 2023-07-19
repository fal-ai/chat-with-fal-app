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
    stream: true,
    model: "gpt-3.5-turbo",
    max_tokens: 2000,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "text/event-stream",
      "content-type": "application/json",
    },
    credentials: "omit",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const content = await response.text();
    throw new Error(content);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder("utf-8");
  let chunk = "";
  let answer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunk = decoder.decode(value);
    if (chunk === "data: [DONE]") {
      break;
    }
    // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
    chunk = chunk
      .split("data: ")
      .filter((c) => c.trim().length > 0)
      .map((c) => {
        try {
          return JSON.parse(c);
        } catch (e) {
          return null;
        }
      })
      .filter((c) => c !== null)
      .flatMap((c) => c.choices.map((choice: any) => choice.delta.content))
      .join("");

    answer += chunk;
    onAnswerUpdate(chunk, answer);
  }

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
