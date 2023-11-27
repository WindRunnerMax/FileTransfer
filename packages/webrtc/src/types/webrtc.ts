import type { SignalingServer } from "../core/signaling";

export type WebRTCConnectionOptions = { wss: string; ice?: string };
export type WebRTCConnectionCallback = (p: {
  signaling: SignalingServer;
  createConnection: (id: string) => void;
  sendMessage: (message: string) => void;
  closeConnection: () => void;
}) => void;
export type WebRTCOptions = {
  ice?: string;
  signaling: SignalingServer;
  id: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: Event) => void;
};
