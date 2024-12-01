import type { WebRTCInstance } from "../client/bridge/instance";
import type { SignalingServer } from "../client/bridge/signaling";

export type WebRTCOptions = { wss: string; ice?: string };
export type WebRTCCallback = (p: { signaling: SignalingServer; rtc: WebRTCApi }) => void;

export type WebRTCApi = {
  connect: (id: string) => Promise<void>;
  send: (message: string | ArrayBuffer) => void;
  close: () => void;
  getInstance: () => WebRTCInstance | null;
};

export type WebRTCInstanceOptions = {
  ice?: string;
  signaling: SignalingServer;
  id: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: RTCErrorEvent) => void;
  onClose?: (event: Event) => void;
  onConnectionStateChange: (pc: RTCPeerConnection) => void;
};
