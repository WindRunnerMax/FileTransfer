import { createContext, useContext } from "react";
import type { SignalService } from "../service/signal";
import type { WebRTCService } from "../service/webrtc";
import type { TransferService } from "../service/transfer";
import type { StoreService } from "../service/store";
import type { MessageService } from "../service/message";

export type ContextType = {
  isMobile: boolean;
  signal: SignalService;
  rtc: WebRTCService;
  transfer: TransferService;
  store: StoreService;
  message: MessageService;
};

export const GlobalContext = createContext<ContextType | null>(null);

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalContext.Provider");
  }
  return context;
};
