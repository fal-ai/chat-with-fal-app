import ChatMessages from "@/components/ChatMessages";
import { askBot, buildPrompt, wakeUp } from "@/data/client";
import type { SendQuestionEvent } from "@/state/ChatState";
import { chatMachine } from "@/state/ChatState";
import { GlobalStateContext } from "@/state/global";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useActor, useInterpret } from "@xstate/react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const promptInputRef = useRef<HTMLInputElement>(null);

  const chatService = useInterpret(chatMachine, {
    actions: {
      sendQuestion: async (context, event: SendQuestionEvent) => {
        try {
          const { messages } = context;

          // disregard the last two messages, which are the prompt itself
          // and the answer in progress
          const previousMessages = messages.slice(0, -2);
          const { prompt } = event;
          const answer = await askBot({
            prompt: buildPrompt(prompt, previousMessages),
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
        // Also disabled because it brings up the keyboard on mobile
        // if (promptInputRef.current) {
        //   const input = promptInputRef.current;
        //   setTimeout(() => {
        //     input.focus();
        //   }, 200);
        // }
      },
      clearPrompt: () => {
        setPrompt("");
      },
    },
  });
  const [state, send] = useActor(chatService);
  const { messages } = state.context;

  useEffect(() => {
    wakeUp();
  }, []);

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
      return "Wait for the reply...";
    }
    if (messages.length > 0) {
      return "Send a follow-up...";
    }
    return "Send a message...";
  }, [isLoading, messages]);

  const buttonIconColor = useMemo(() => {
    return isLoading || !hasPrompt
      ? "stroke-gray-700 dark:stroke-neutral-200 opacity-30"
      : "stroke-secondary";
  }, [isLoading, hasPrompt]);
  return (
    <GlobalStateContext.Provider value={{ chatService }}>
      <main className="overflow-hidden w-full h-full relative flex z-0">
        <div className="relative flex h-full max-w-full flex-1 overflow-hidden">
          <div className="container w-full min-h-full mx-auto">
            <ChatMessages messages={messages} />
            {/* <div className="h-32 w-full"></div> */}
            <div className="fixed md:max-w-screen-2xl bottom-0 w-full z-50">
              <div className="flex-col bg-base-100 max-md:show-m px-4 py-2 md:py-6">
                <div className="flex justify-between space-x-2">
                  <input
                    className="input bg-base-200 focus:outline-transparent disabled:border-transparent disabled:placeholder:opacity-80 flex-1 md:text-lg md:py-8"
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
                    <PaperAirplaneIcon
                      className={`${buttonIconColor} w-6 h-6`}
                    />
                  </button>
                </div>
                {/* I had this, then decide to hide it, should delete or unhide it */}
                <p className="hidden prose text-sm mt-2 opacity-80">
                  Press <kbd>Enter</kbd> to send.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </GlobalStateContext.Provider>
  );
}
