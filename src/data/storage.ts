import { openDB } from "idb";
import { ulid } from "ulidx";
import type { Chat, ChatMessage, SavedChat, SavedChatMessage } from "./types";

async function open() {
  return openDB("chat_with_fal_app", 1, {
    upgrade(db) {
      const chats = db.createObjectStore("chats", {
        keyPath: "id",
      });
      chats.createIndex("by_id", "id");

      const messages = db.createObjectStore("chat_messages", {
        keyPath: "id",
      });
      messages.createIndex("by_chat_id", "chatId");
    },
  });
}

async function getAllChats(): Promise<Chat[]> {
  const db = await open();
  const chats = await db.getAll("chats");
  return chats;
}

async function getMessagesFromChat(chatId: string): Promise<ChatMessage[]> {
  const db = await open();
  const messages = await db.getAllFromIndex(
    "chat_messages",
    "by_chat_id",
    chatId
  );
  return messages;
}

export async function saveChat(chat: Chat): Promise<SavedChat> {
  const savedChat: SavedChat = {
    id: ulid(),
    createdAt: Date.now(),
    ...chat,
    updatedAt: Date.now(),
  };
  const db = await open();
  const tx = db.transaction("chats", "readwrite");
  tx.store.put(savedChat);
  await tx.done;
  return savedChat;
}

export async function saveMessage(
  message: ChatMessage
): Promise<SavedChatMessage> {
  const savedMessage: SavedChatMessage = {
    id: ulid(),
    createdAt: Date.now(),
    ...message,
    updatedAt: Date.now(),
  };
  const db = await open();
  const tx = db.transaction("messages", "readwrite");
  tx.store.put(savedMessage);
  await tx.done;
  return savedMessage;
}
