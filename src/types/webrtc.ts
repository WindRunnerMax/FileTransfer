import type { SignalingServer } from "../core/signaling";
import type { WebRTC } from "../core/webrtc";

export type WebRTCConnectionOptions = { wss: string; ice?: string };
export type WebRTCConnectionCallback = (p: { rtc: WebRTC; signaling: SignalingServer }) => void;
export type WebRTCOptions = { ice?: string; signaling: SignalingServer; id: string };
