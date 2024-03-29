import { Message } from "@/data/types";
import { GlobalStateContext } from "@/state/global";
import { useActor } from "@xstate/react";
import { useContext, useEffect, useRef } from "react";
import {
  BotChatMessage,
  MemoizedChatMessage as ChatMessage,
} from "./ChatMessage";

export type ChatMessagesProps = {
  messages: Message[];
};

export default function ChatMessages(props: ChatMessagesProps) {
  const { chatService } = useContext(GlobalStateContext);
  const [state] = useActor(chatService);

  const { messages } = props;
  const scrollableRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight);
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (scrollableRef.current) {
      const resizeObserver = new ResizeObserver(scrollToBottom);
      resizeObserver.observe(scrollableRef.current);
    }
  }, []);

  const renderMessage = (message: Message, index: number) => {
    if (message.user === "bot") {
      return (
        <BotChatMessage
          key={index}
          content={message.text}
          done={!state.matches("botAnswering")}
        />
      );
    }
    return (
      <ChatMessage key={index} user={message.user}>
        {message.text}
      </ChatMessage>
    );
  };

  return (
    <div
      ref={scrollableRef}
      className="relative w-full h-full transition-width overflow-hidden flex flex-1 flex-col items-stretch"
    >
      <div className="flex-1 grow overflow-hidden bg-base-200 space-y-8 lg:space-y-10 pt-24 pb-32 md:pb-40 max-md:px-4">
        <div className="space-y-2">
          <p>
            Hi! I am a Chat Bot powered by{" "}
            <a className="link font-medium" href="https://fal.ai">
              fal-serverless
            </a>{" "}
            and the{" "}
            <a
              className="link font-medium"
              href="https://huggingface.co/TheBloke/Llama-2-13B-chat-GGML"
            >
              TheBloke/Llama-2-13B-chat-GGML
            </a>{" "}
            model on a <strong>Nvidia Tesla T4 GPU</strong>.
          </p>
          <p>Send me a message and let&apos;s get started.</p>
        </div>
        {messages.map(renderMessage)}
      </div>
    </div>
  );
}
