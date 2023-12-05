import type { WebRTCInstance } from "../client/core/instance";
import type { SignalingServer } from "../client/core/signaling";

export type WebRTCOptions = { wss: string; ice?: string };
export type WebRTCApi = {
  connect: (id: string) => void;
  send: (message: string | ArrayBuffer) => void;
  close: () => void;
  getInstance: () => WebRTCInstance | null;
};
export type WebRTCCallback = (p: { signaling: SignalingServer; rtc: WebRTCApi }) => void;
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
