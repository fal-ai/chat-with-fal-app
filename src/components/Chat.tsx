import Avatar from "@/components/Avatar";
import Markdown from "@/components/Markdown";
import { UserType } from "@/data/storage";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";

export interface ChatProps {}

export type ChatStatus = "thinking" | "typing" | "done";

export type ChatFetchStatus = "idle" | "loading" | "error";

export interface ChatBubbleProps {
  user: UserType;
}

export function ChatBubble(props: PropsWithChildren<ChatBubbleProps>) {
  const { children, user } = props;

  const bubbleOpacity = useMemo(() => {
    return user === "bot" ? "bg-opacity-100" : "bg-opacity-70";
  }, [user]);
  const position = user === "bot" ? "chat-start" : "chat-end";
  return (
    <div className={`chat ${position} py-4`}>
      <Avatar user={props.user} className="chat-image" />
      <div
        className={`chat-bubble flex-col ${bubbleOpacity} prose !prose-invert max-w-full min-w-[20%] md:max-w-[90%] lg:max-w-2xl`}
      >
        {typeof children === "string" ? (
          <Markdown>{children}</Markdown>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export interface TypingChatBubbleProps {
  content: string;
  status: ChatStatus;
  onDone: () => void;
}

export function TypingChatBubble(props: TypingChatBubbleProps) {
  const { content, onDone, status } = props;

  const [message, setMessage] = useState("");
  const contentRef = useRef(content);

  useEffect(() => {
    if (content !== contentRef.current) {
      const newContent = content.slice(contentRef.current.length);
      let i = 0;

      const intervalId = setInterval(() => {
        if (i < newContent.length) {
          setMessage((prevMessage) => prevMessage + newContent[i]);
          i++;
        } else {
          clearInterval(intervalId);
          onDone();
        }
      }, 25);

      return () => clearInterval(intervalId);
    }

    contentRef.current = content;
  }, [content, onDone]);

  const children =
    status === "typing" ? (
      message
    ) : (
      <div className="thinking flex pt-3 h-full">
        <span></span>
        <span></span>
        <span></span>
      </div>
    );
  return <ChatBubble user="bot">{children}</ChatBubble>;
}
