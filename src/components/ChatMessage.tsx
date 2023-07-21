import Avatar from "@/components/Avatar";
import Markdown from "@/components/Markdown";
import { UserType } from "@/data/types";
import { isFullResponse, isPartialResponse } from "@/state/ChatState";
import { GlobalStateContext } from "@/state/global";
import { useActor } from "@xstate/react";
import {
  memo,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import ThinkingAnimation from "./ThinkingAnimation";

export interface ChatProps {}

export type ChatStatus = "thinking" | "typing" | "done";

export type ChatFetchStatus = "idle" | "loading" | "error";

export interface ChatMessageProps {
  user: UserType;
}

export function ChatMessage(props: PropsWithChildren<ChatMessageProps>) {
  const { children, user } = props;

  const content = useMemo(() => {
    return typeof children === "string" ? (
      <Markdown>{children}</Markdown>
    ) : (
      children
    );
  }, [children]);

  if (user === "bot") {
    return <div className="prose max-w-full md:text-lg">{content}</div>;
  }

  return (
    <div className="flex flex-row">
      <Avatar
        user={props.user}
        className="chat-image self-start mr-2 md:mr-4"
      />
      <div className="flex flex-col bg-base-content dark:bg-black dark:bg-opacity-30 py-4 pl-6 pr-4 prose !prose-invert rounded-r-3xl rounded-bl-3xl mt-6 font-medium md:text-lg max-w-fit md:mr-64 lg:mr-80">
        {content}
      </div>
    </div>
  );
}

export const MemoizedChatMessage = memo(
  ChatMessage,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

export interface BotChatMessageProps {
  content: string;
  done: boolean;
}

function TypingChatMessage(props: BotChatMessageProps) {
  const { done } = props;
  // Shared state
  const { chatService } = useContext(GlobalStateContext);
  const [state] = useActor(chatService);

  // Local state
  const [content, setContent] = useState(props.content);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (done) {
      return;
    }
    chatService.onEvent((event: any) => {
      if (isPartialResponse(event)) {
        setContent((prevContent) => prevContent + event.chunk);
      }
      if (isFullResponse(event)) {
        setIsTyping(false);
        setContent(event.answer);
        chatService.send({ type: "TYPING_DONE", answer: event.answer });
      }
    });
  }, [chatService, done]);

  if (props.content && props.done) {
    return <ChatMessage user="bot">{props.content}</ChatMessage>;
  }

  let children: React.ReactNode = content;
  const isThinking = state.matches("botAnswering.thinking");
  if (isThinking) {
    children = <ThinkingAnimation />;
  }
  return <ChatMessage user="bot">{children}</ChatMessage>;
}

export const BotChatMessage = memo(
  TypingChatMessage,
  (prevProps, nextProps) => prevProps.content === nextProps.content
);
