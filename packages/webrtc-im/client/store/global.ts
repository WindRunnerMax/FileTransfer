import { createContext, useContext } from "react";
import type { SignalService } from "../service/signal";
import type { WebRTCService } from "../service/webrtc";
import type { TransferService } from "../service/transfer";

export type ContextType = {
  signal: SignalService;
  rtc: WebRTCService;
  transfer: TransferService;
};

export const GlobalContext = createContext<ContextType | null>(null);

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalContext.Provider");
  }
  return context;
};
