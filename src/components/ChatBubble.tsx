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
  useRef,
  useState,
} from "react";
import ThinkingAnimation from "./ThinkingAnimation";

export interface ChatProps {}

export type ChatStatus = "thinking" | "typing" | "done";

export type ChatFetchStatus = "idle" | "loading" | "error";

export interface ChatBubbleProps {
  user: UserType;
}

export function ChatBubble(props: PropsWithChildren<ChatBubbleProps>) {
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

export const MemoizedChatBubble = memo(
  ChatBubble,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

export interface TypingChatBubbleProps {
  content: string;
}

export function TypingChatBubble(props: TypingChatBubbleProps) {
  // Shared state
  const { chatService } = useContext(GlobalStateContext);
  const [state] = useActor(chatService);

  // Local state
  const [content, setContent] = useState(props.content);
  const [contentToType, setContentToType] = useState(props.content);
  const [isContentFullyLoaded, setIsContentFullyLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  // Long term references
  const cursorPosition = useRef<number>(0);

  useEffect(() => {
    chatService.onEvent((event: any) => {
      if (isPartialResponse(event)) {
        setContentToType((prevContent) => prevContent + event.chunk);
      }
      if (isFullResponse(event)) {
        setIsContentFullyLoaded(true);
        setContentToType(event.answer);
      }
    });
  }, [chatService]);

  useEffect(() => {
    setIsTyping(true);

    const intervalId = setInterval(() => {
      let i = cursorPosition.current;
      setContent(contentToType.slice(0, i));

      // TODO increment cursor position depending on the content left and whether it's done or not
      cursorPosition.current = i = i + 1;

      if (i > contentToType.length) {
        clearInterval(intervalId);
        if (isContentFullyLoaded) {
          setIsTyping(false);
        }
      }
    }, 20);

    return () => clearInterval(intervalId);
  }, [contentToType, isContentFullyLoaded]);

  useEffect(() => {
    if (isContentFullyLoaded && !isTyping) {
      setContent(contentToType);
      chatService.send({ type: "TYPING_DONE", answer: contentToType });
    }
  }, [isContentFullyLoaded, isTyping, chatService, contentToType]);

  let children: React.ReactNode = content;
  if (state.matches("botAnswering.thinking")) {
    children = <ThinkingAnimation />;
  }
  return <ChatBubble user="bot">{children}</ChatBubble>;
}
