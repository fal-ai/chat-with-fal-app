import type { chatMachine } from "@/state/ChatState";
import { createContext } from "react";
import { InterpreterFrom } from "xstate";

export type GlobalStateContextType = {
  chatService: InterpreterFrom<typeof chatMachine>;
};

export const GlobalStateContext = createContext<GlobalStateContextType>(
  // this force-cast assumes the GlobalStateContext will always be initialized
  // see _document.tsx for the initialization code
  {} as GlobalStateContextType
);
