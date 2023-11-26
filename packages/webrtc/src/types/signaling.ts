const EVENT_BASE = [
  // CLIENT
  "JOIN_ROOM",
  "LEAVE_ROOM",
  "SEND_OFFER",
  "SEND_ANSWER",
  // SERVER
  "JOINED_ROOM",
  "JOINED_MEMBER",
  "LEFT_ROOM",
  "FORWARD_OFFER",
  "FORWARD_ANSWER",
] as const;
type SocketEventKeys = typeof EVENT_BASE[number];
export const SOCKET_EVENT_ENUM = EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in SocketEventKeys]: K }
);
export interface SocketEventParams {
  // CLIENT
  [SOCKET_EVENT_ENUM.JOIN_ROOM]: { id: string };
  [SOCKET_EVENT_ENUM.LEAVE_ROOM]: { id: string };
  [SOCKET_EVENT_ENUM.SEND_OFFER]: { origin: string; target: string; sdp: string };
  [SOCKET_EVENT_ENUM.SEND_ANSWER]: { origin: string; target: string; sdp: string };
  // SERVER
  [SOCKET_EVENT_ENUM.JOINED_ROOM]: { id: string };
  [SOCKET_EVENT_ENUM.JOINED_MEMBER]: { initialization: { id: string; sdp?: string }[] };
  [SOCKET_EVENT_ENUM.LEFT_ROOM]: { id: string };
  [SOCKET_EVENT_ENUM.FORWARD_OFFER]: { origin: string; target: string; sdp: string };
  [SOCKET_EVENT_ENUM.FORWARD_ANSWER]: { origin: string; target: string; sdp: string };
}
export type Fn<T extends SocketEventKeys> = (payload: SocketEventParams[T]) => unknown;
export type SocketHandler = { [K in SocketEventKeys]: Fn<K> };
