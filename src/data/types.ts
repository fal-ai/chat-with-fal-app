export interface SavedChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type NewChat = Omit<SavedChat, "id" | "createdAt" | "updatedAt">;

export type Chat = SavedChat | NewChat;

export type UserType = "bot" | "human";

export interface SavedChatMessage {
  id: string;
  chatId: string;
  text: string;
  user: UserType;
  createdAt: number;
  updatedAt: number;
}

export type NewChatMessage = Omit<
  SavedChatMessage,
  "id" | "createdAt" | "updatedAt"
>;

export type ChatMessage = SavedChatMessage | NewChatMessage;
