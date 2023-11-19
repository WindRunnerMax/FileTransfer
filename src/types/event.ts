const EVENT_BASE = [
  // CLIENT
  "JOIN_ROOM",
  "LEAVE_ROOM",
  "SEND_OFFER",
  // SERVER
  "JOINED_ROOM",
  "HAND_OUT_OFFER",
] as const;
type SocketEventKeys = (typeof EVENT_BASE)[number];
export const SOCKET_EVENT_ENUM = EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in SocketEventKeys]: K }
);
export interface SocketEventParams {
  // CLIENT
  [SOCKET_EVENT_ENUM.JOIN_ROOM]: { id: string };
  [SOCKET_EVENT_ENUM.LEAVE_ROOM]: { id: string };
  [SOCKET_EVENT_ENUM.SEND_OFFER]: { id: string; sdp: string };
  // SERVER
  [SOCKET_EVENT_ENUM.JOINED_ROOM]: { id: string };
  [SOCKET_EVENT_ENUM.HAND_OUT_OFFER]: { id: string; sdp: string };
}
export type Fn<T extends SocketEventKeys> = (payload: SocketEventParams[T]) => unknown;
export type SocketHandler = { [K in SocketEventKeys]: Fn<K> };
