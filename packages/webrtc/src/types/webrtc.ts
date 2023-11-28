import type { SignalingServer } from "../core/signaling";

export type WebRTCOptions = { wss: string; ice?: string };
export type WebRTCCallback = (p: {
  signaling: SignalingServer;
  rtc: {
    connect: (id: string) => void;
    send: (message: string) => void;
    close: () => void;
  };
}) => void;
export type WebRTCInstanceOptions = {
  ice?: string;
  signaling: SignalingServer;
  id: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: Event) => void;
};
