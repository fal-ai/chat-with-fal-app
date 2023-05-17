import { ChatMessage } from "@/data/types";
import { GlobalStateContext } from "@/state/global";
import { useActor } from "@xstate/react";
import { useContext, useEffect, useRef } from "react";
import { ChatBubble, TypingChatBubble } from "./ChatBubble";

export type ChatMessagesProps = {
  messages: ChatMessage[];
};

export default function ChatMessages(props: ChatMessagesProps) {
  const { chatService } = useContext(GlobalStateContext);
  const [state] = useActor(chatService);

  const { messages } = props;
  const scrollableRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = (message: ChatMessage, index: number) => {
    const isLastMessage = index === messages.length - 1;
    if (
      isLastMessage &&
      message.user === "bot" &&
      state.matches("botAnswering")
    ) {
      return <TypingChatBubble key={index} content={message.text} />;
    }
    return (
      <ChatBubble key={index} user={message.user}>
        {message.text}
      </ChatBubble>
    );
  };

  return (
    <div
      ref={scrollableRef}
      className="relative flex-1 w-full min-h-full overflow-y-scroll overscroll-y-auto p-4 mx-auto z-10"
    >
      <div className="container mx-auto">{messages.map(renderMessage)}</div>
    </div>
  );
}
