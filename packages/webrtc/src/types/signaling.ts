const CLINT_EVENT_BASE = ["JOIN_ROOM", "LEAVE_ROOM", "SEND_OFFER", "SEND_ANSWER"] as const;
type ClientEventKeys = typeof CLINT_EVENT_BASE[number];
export const CLINT_EVENT = CLINT_EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in ClientEventKeys]: K }
);

const SERVER_EVENT_BASE = [
  "JOINED_ROOM",
  "JOINED_MEMBER",
  "LEFT_ROOM",
  "FORWARD_OFFER",
  "FORWARD_ANSWER",
] as const;
type ServerEventKeys = typeof SERVER_EVENT_BASE[number];
export const SERVER_EVENT = SERVER_EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in ServerEventKeys]: K }
);
export interface SocketEventParams {
  // CLIENT
  [CLINT_EVENT.JOIN_ROOM]: { id: string };
  [CLINT_EVENT.LEAVE_ROOM]: { id: string };
  [CLINT_EVENT.SEND_OFFER]: { origin: string; target: string; sdp: string };
  [CLINT_EVENT.SEND_ANSWER]: { origin: string; target: string; sdp: string };
  // SERVER
  [SERVER_EVENT.JOINED_ROOM]: { id: string };
  [SERVER_EVENT.JOINED_MEMBER]: { initialization: { id: string; sdp?: string }[] };
  [SERVER_EVENT.LEFT_ROOM]: { id: string };
  [SERVER_EVENT.FORWARD_OFFER]: { origin: string; target: string; sdp: string };
  [SERVER_EVENT.FORWARD_ANSWER]: { origin: string; target: string; sdp: string };
}
export type ClientFn<T extends ClientEventKeys> = (payload: SocketEventParams[T]) => void;
export type ClientHandler = { [K in ClientEventKeys]: ClientFn<K> };
export type ServerFn<T extends ServerEventKeys> = (payload: SocketEventParams[T]) => void;
export type ServerHandler = { [K in ServerEventKeys]: ServerFn<K> };
