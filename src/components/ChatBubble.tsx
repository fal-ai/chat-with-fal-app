import Avatar from "@/components/Avatar";
import Markdown from "@/components/Markdown";
import { UserType } from "@/data/types";
import { isFullResponse, isPartialResponse } from "@/state/ChatState";
import { GlobalStateContext } from "@/state/global";
import { useActor } from "@xstate/react";
import {
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

  const bubbleOpacity = useMemo(() => {
    return user === "bot" ? "bg-opacity-100" : "bg-opacity-70";
  }, [user]);
  const position = user === "bot" ? "chat-start" : "chat-end";
  return (
    <div className={`chat ${position} py-4`}>
      <Avatar user={props.user} className="chat-image" />
      <div
        className={`chat-bubble flex-col ${bubbleOpacity} prose !prose-invert max-w-full min-w-[10%] md:max-w-4xl lg:max-w-6xl`}
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
        console.log("==== on partial response", event);
        setContentToType((prevContent) => prevContent + event.chunk);
      }
      if (isFullResponse(event)) {
        console.log("==== on full response", event);
        setIsContentFullyLoaded(true);
        setContentToType(event.answer);
      }
    });
  }, [chatService]);

  useEffect(() => {
    setIsTyping(true);

    const intervalId = setInterval(() => {
      let i = cursorPosition.current;
      console.log("typing cursor at", i);

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
    console.log("==== is typing done?", isTyping);
    if (isContentFullyLoaded && !isTyping) {
      console.log("==== TYPING DONE");
      setContent(contentToType);
      chatService.send({ type: "TYPING_DONE", answer: contentToType });
    }
  }, [isContentFullyLoaded, isTyping, chatService, contentToType]);

  // useMemo(() => {

  // });

  // const typeNext = (content: string[]) => {
  //   const lastIndex = content.length - 1;
  //   setCurrentContent((prevContent) => Math.min(lastIndex, prevContent + 1));
  // };

  // useEffect(() => {
  //   typeNext(contentToType);
  // }, [contentToType]);

  // useEffect(() => {
  //   const typewriter = typewriterRef.current;
  //   if (typewriter && !isTyping) {
  //     typewriter
  //       .typeString(contentToType[currentContent])
  //       .start()
  //       .callFunction(() => {
  //         setIsTyping(false);
  //         // typeNext(contentToType);
  //       });
  //   }
  // }, [isTyping, currentContent, contentToType]);

  let children: React.ReactNode = content;
  if (state.matches("botAnswering.thinking")) {
    console.log("--> Rendering ThinkingAnimation");
    children = <ThinkingAnimation />;
  }
  // if (state.matches("botAnswering.typing")) {
  //   console.log("--> Rendering Typewriter");
  //   children = (
  //     <Typewriter
  //       options={{
  //         delay: 16,
  //       }}
  //       onInit={(typewriter) => {
  //         typewriterRef.current = typewriter;
  //       }}
  //     />
  //   );
  // }
  console.log("!! Rendering TypingChatBubble!!");
  return <ChatBubble user="bot">{children}</ChatBubble>;
}
