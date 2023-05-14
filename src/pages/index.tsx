import {
  ChatBubble,
  ChatFetchStatus,
  ChatStatus,
  TypingChatBubble,
} from "@/components/Chat";
import { ChatMessage, SavedChat } from "@/data/storage";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  // TODO create this properly
  const chat: SavedChat = {
    id: "1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const [answer, setAnswer] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [status, setStatus] = useState<ChatFetchStatus>("idle");
  const [typingStatus, setTypingStatus] = useState<ChatStatus>("done");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const updateAnswer = (value: string) => {
    setAnswer((prev) => [...prev, value]);
  };

  const buildPrompt = () => {
    let memory = messages
      .map((message) => {
        if (message.user === "human") {
          return `I previously asked: ${message.text}\n`;
        }
        return `You then answered: ${message.text}\n`;
      })
      .join("\n");
    if (memory.trim().length > 0) {
      memory = `Given the previous conversation where ${memory}\n\n`;
    }
    return `USER: ${memory}I want to ask now: ${prompt}\nASSISTANT:`;
  };

  const handleClick = async () => {
    setPrompt("");
    setStatus("loading");
    setTypingStatus("thinking");
    setMessages((prev) => [
      ...prev,
      { text: prompt, user: "human", chatId: chat.id },
    ]);
    const url = process.env.NEXT_PUBLIC_CHAT_FUNCTION_URL;
    if (!url) {
      throw new Error("API URL not set");
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-fal-key-id": process.env.NEXT_PUBLIC_FAL_KEY_ID ?? "",
          "x-fal-key-secret": process.env.NEXT_PUBLIC_FAL_KEY_SECRET ?? "",
        },
        body: JSON.stringify({
          prompt: buildPrompt(),
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
      while (isStreaming) {
        const { done, value } = await reader.read();

        isStreaming = !done;
        if (value) {
          setTypingStatus("typing");
          updateAnswer(decoder.decode(value));
        }
      }
    } catch (error) {
      console.error(error);
      setTypingStatus("done");
    } finally {
      setStatus("idle");
    }
  };

  // TODO change this to use a proper state machine
  useEffect(() => {
    if (status === "idle" && answer.length > 0 && typingStatus === "done") {
      setMessages((prev) => [
        ...prev,
        { text: answer.join(""), user: "bot", chatId: chat.id },
      ]);
      setAnswer([]);
    }
  }, [status, answer, chat.id, typingStatus]);

  const handleTypingDone = () => {
    setTypingStatus("done");
  };

  const isLoading = useMemo(
    () => status === "loading" || typingStatus !== "done",
    [status, typingStatus]
  );

  const hasPrompt = useMemo(() => prompt.length === 0, [prompt]);

  const buttonIconColor = useMemo(() => {
    return isLoading || hasPrompt
      ? "stroke-gray-700 dark:stroke-neutral-200 opacity-30"
      : "stroke-secondary";
  }, [isLoading, hasPrompt]);
  return (
    <main className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-h-screen h-screen overflow-y-hidden">
      <div className="relative flex-1 w-full md:col-span-3 md:px-16 lg:px-28 xl:px-32 max-md:overflow-y-scroll p-4 pb-20 mt-16 z-10">
        {messages.map((message, index) => (
          <ChatBubble key={index} user={message.user}>
            {message.text}
          </ChatBubble>
        ))}
        {isLoading && (
          <TypingChatBubble
            content={answer.join("")}
            onDone={handleTypingDone}
            status={typingStatus}
          />
        )}
      </div>
      <div className="fixed bottom-0 w-full max-w-screen z-50">
        <div className="container flex justify-between space-x-2 bg-base-100 max-md:shadow-sm px-4 py-2">
          <input
            className="input input-ghost px-0 flex-1"
            type="text"
            autoComplete="off"
            placeholder="Hi! Ask me something"
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <button
            className="btn btn-ghost rounded-full self-end"
            onClick={handleClick}
            disabled={isLoading || hasPrompt}
          >
            <PaperAirplaneIcon className={`${buttonIconColor} w-6 h-6`} />
          </button>
        </div>
      </div>
    </main>
  );
}
