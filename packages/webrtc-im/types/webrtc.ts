import type { WebRTCService } from "../client/service/webrtc";

export const WEBRTC_EVENT = {
  OPEN: "OPEN",
  MESSAGE: "MESSAGE",
  ERROR: "ERROR",
  CLOSE: "CLOSE",
  CONNECTING: "CONNECTING",
  STATE_CHANGE: "STATE_CHANGE",
} as const;

export type WebRTCEvent = {
  [WEBRTC_EVENT.OPEN]: Event;
  [WEBRTC_EVENT.MESSAGE]: MessageEvent<string | ArrayBuffer>;
  [WEBRTC_EVENT.ERROR]: RTCErrorEvent;
  [WEBRTC_EVENT.CLOSE]: Event;
  [WEBRTC_EVENT.CONNECTING]: null;
  [WEBRTC_EVENT.STATE_CHANGE]: WebRTCService;
};
