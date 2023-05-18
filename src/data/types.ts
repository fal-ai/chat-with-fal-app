export interface SavedChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

type GeneratedProps = "id" | "createdAt" | "updatedAt";

export type NewChat = Omit<SavedChat, GeneratedProps>;

export type Chat = SavedChat | NewChat;

export type UserType = "bot" | "human";

export interface SavedMessage {
  id: string;
  chatId: string;
  text: string;
  user: UserType;
  createdAt: number;
  updatedAt: number;
}

export type NewMessage = Omit<SavedMessage, GeneratedProps>;

export type Message = SavedMessage | NewMessage;
