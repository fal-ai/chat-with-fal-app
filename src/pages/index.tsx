import ChatMessages from "@/components/ChatMessages";
import { askBot, buildPrompt } from "@/data/client";
import type { SendQuestionEvent } from "@/state/ChatState";
import { chatMachine } from "@/state/ChatState";
import { GlobalStateContext } from "@/state/global";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useActor, useInterpret } from "@xstate/react";
import { KeyboardEvent, useMemo, useRef, useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const promptInputRef = useRef<HTMLInputElement>(null);

  const chatService = useInterpret(chatMachine, {
    actions: {
      sendQuestion: async (context, event: SendQuestionEvent) => {
        try {
          const { messages } = context;
          const { prompt } = event;
          const answer = await askBot({
            prompt: buildPrompt(prompt, messages),
            onAnswerUpdate(chunk, aggregate) {
              send({
                type: "RECEIVE_PARTIAL_RESPONSE",
                chunk,
                answer: aggregate,
              });
            },
          });
          send({ type: "RECEIVE_FULL_RESPONSE", answer });
        } catch (error: any) {
          send({ type: "RECEIVE_ERROR", error });
        }
      },
      focusOnInput: () => {
        // TODO I'm sure there's a better way of doing this...
        if (promptInputRef.current) {
          const input = promptInputRef.current;
          setTimeout(() => {
            input.focus();
          }, 200);
        }
      },
      clearPrompt: () => {
        setPrompt("");
      },
    },
  });
  const [state, send] = useActor(chatService);
  const { messages } = state.context;

  const handleEnterPress = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendQuestion();
    }
  };

  const sendQuestion = async () => {
    send({ type: "SEND_QUESTION", prompt });
  };

  const isLoading =
    state.matches("botAnswering.thinking") ||
    state.matches("botAnswering.typing");

  const hasPrompt = useMemo(() => prompt.trim().length > 0, [prompt]);
  const promptPlaceholder = useMemo(() => {
    if (isLoading) {
      return "Wait for the answer...";
    }
    if (messages.length > 0) {
      return "Ask a follow-up question...";
    }
    return "Ask me a question...";
  }, [isLoading, messages]);

  const buttonIconColor = useMemo(() => {
    return isLoading || !hasPrompt
      ? "stroke-gray-700 dark:stroke-neutral-200 opacity-30"
      : "stroke-secondary";
  }, [isLoading, hasPrompt]);
  return (
    <GlobalStateContext.Provider value={{ chatService }}>
      <main className="gap-8 w-full max-h-screen min-h-screen pt-16 pb-20">
        <ChatMessages messages={messages} />
        <div className="fixed bottom-0 bg-base-100 w-full max-w-screen z-50">
          <div className="container mx-auto flex-col px-4 py-2">
            <div className="flex justify-between space-x-2">
              <input
                className="input bg-base-200 focus:outline-transparent disabled:border-transparent disabled:placeholder:opacity-80 flex-1"
                ref={promptInputRef}
                autoComplete="off"
                placeholder={promptPlaceholder}
                name="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleEnterPress}
                enterKeyHint="send"
                disabled={isLoading}
              />
              <button
                className="btn btn-ghost disabled:bg-transparent hover:bg-transparent rounded-full self-end"
                onClick={sendQuestion}
                disabled={isLoading || !hasPrompt}
              >
                <PaperAirplaneIcon className={`${buttonIconColor} w-6 h-6`} />
              </button>
            </div>
            {/* I had this, then decide to hide it, should delete or unhide it */}
            <p className="hidden prose text-sm mt-2 opacity-80">
              Press <kbd>Enter</kbd> to send.
            </p>
          </div>
        </div>
      </main>
    </GlobalStateContext.Provider>
  );
}
