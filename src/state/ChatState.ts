import { Chat, Message, NewMessage } from "@/data/types";
import { assign, createMachine } from "xstate";

interface ChatContext {
  currentChat?: Chat;
  messages: Message[];
  requestComplete: boolean;
  currentMessage?: Message;
  error?: Error | string;
}

export type SendQuestionEvent = { type: "SEND_QUESTION"; prompt: string };
export type ReceivePartialResponseEvent = {
  type: "RECEIVE_PARTIAL_RESPONSE";
  chunk: string;
  answer: string;
};
export type ReceiveFullResponseEvent = {
  type: "RECEIVE_FULL_RESPONSE";
  answer: string;
};
export type TypingDoneEvent = { type: "TYPING_DONE"; answer: string };

export type ChatEvent =
  | SendQuestionEvent
  | ReceivePartialResponseEvent
  | ReceiveFullResponseEvent
  | { type: "RECEIVE_ERROR"; error: Error }
  | TypingDoneEvent
  | { type: "RETRY" };

export function isPartialResponse(
  event: ChatEvent
): event is ReceivePartialResponseEvent {
  return event.type === "RECEIVE_PARTIAL_RESPONSE";
}

export function isFullResponse(
  event: ChatEvent
): event is ReceiveFullResponseEvent {
  return event.type === "RECEIVE_FULL_RESPONSE";
}

export const chatMachine = createMachine<ChatContext, ChatEvent>(
  {
    id: "chat",
    predictableActionArguments: true,
    preserveActionOrder: true,
    initial: "idle",
    context: {
      messages: [],
      requestComplete: false,
      currentChat: {
        title: "New chat",
      },
      currentMessage: undefined,
    },
    states: {
      idle: {
        on: {
          SEND_QUESTION: {
            target: "botAnswering",
            actions: ["addQuestion", "clearPrompt", "saveChat"],
          },
        },
      },
      botAnswering: {
        initial: "thinking",
        description: `
        The bot is answering the user, this process needs to account
        that data becomes available in chunks, and the UI needs to simulate a typing effect.
        `,
        states: {
          thinking: {
            entry: ["sendQuestion"],
            on: {
              RECEIVE_PARTIAL_RESPONSE: {
                target: "typing",
              },
              RECEIVE_FULL_RESPONSE: {
                target: "typing",
              },
              RECEIVE_ERROR: {
                target: "failed",
                actions: ["markRequestAsComplete", "markMessageAsFailed"],
              },
            },
          },
          typing: {
            on: {
              RECEIVE_PARTIAL_RESPONSE: {},
              RECEIVE_FULL_RESPONSE: {
                actions: ["markRequestAsComplete"],
              },
              TYPING_DONE: {
                target: "#chat.idle",
                actions: ["updateCurrentAnswer", "focusOnInput", "saveChat"],
              },
              RECEIVE_ERROR: {
                target: "failed",
                actions: ["markRequestAsComplete", "markMessageAsFailed"],
              },
            },
          },
          failed: {
            on: {
              RETRY: {
                target: "thinking",
                actions: ["retryMessage"],
              },
            },
          },
        },
      },
    },
  },
  {
    actions: {
      addQuestion: assign((context, event: SendQuestionEvent) => ({
        messages: [
          ...context.messages,
          { text: event.prompt, user: "human" } as NewMessage,
          { text: "", user: "bot" } as NewMessage,
        ],
      })),
      markRequestAsComplete: assign(() => ({
        requestComplete: true,
      })),
      updateCurrentAnswer: assign({
        messages: (
          context,
          event: TypingDoneEvent | ReceiveFullResponseEvent
        ) => {
          const messages = [...context.messages];
          if (messages.length > 0) {
            messages[messages.length - 1].text = event.answer;
          }
          return messages;
        },
      }),
      saveChat: () => {
        console.log("TODO: save me!");
      },
    },
  }
);
