import type { DEVICE_TYPE, SocketMessageType } from "./client";
import type { ERROR_TYPE, SHAKE_HANDS } from "./server";

const CLINT_EVENT_BASE = [
  "JOIN_ROOM",
  "LEAVE_ROOM",
  "SEND_REQUEST",
  "SEND_RESPONSE",
  "SEND_UNPEER",
  "SEND_MESSAGE",
] as const;
export type ClientEventKeys = typeof CLINT_EVENT_BASE[number];
export const CLINT_EVENT = CLINT_EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in ClientEventKeys]: K }
);
const SERVER_EVENT_BASE = [
  "JOINED_ROOM",
  "JOINED_MEMBER",
  "LEFT_ROOM",
  "FORWARD_REQUEST",
  "FORWARD_RESPONSE",
  "FORWARD_UNPEER",
  "FORWARD_MESSAGE",
] as const;
export type ServerEventKeys = typeof SERVER_EVENT_BASE[number];
export const SERVER_EVENT = SERVER_EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in ServerEventKeys]: K }
);
export interface SocketEventParams {
  // CLIENT
  [CLINT_EVENT.JOIN_ROOM]: {
    id: string;
    device: DEVICE_TYPE;
  };
  [CLINT_EVENT.LEAVE_ROOM]: {
    id: string;
  };
  [CLINT_EVENT.SEND_REQUEST]: {
    origin: string;
    target: string;
  };
  [CLINT_EVENT.SEND_RESPONSE]: {
    origin: string;
    target: string;
    code: SHAKE_HANDS;
    reason?: string;
  };
  [CLINT_EVENT.SEND_UNPEER]: {
    origin: string;
    target: string;
  };
  [CLINT_EVENT.SEND_MESSAGE]: {
    origin: string;
    target: string;
    message: SocketMessageType;
  };

  // SERVER
  [SERVER_EVENT.JOINED_ROOM]: {
    id: string;
    device: DEVICE_TYPE;
  };
  [SERVER_EVENT.JOINED_MEMBER]: {
    initialization: {
      id: string;
      device: DEVICE_TYPE;
    }[];
  };
  [SERVER_EVENT.LEFT_ROOM]: {
    id: string;
  };
  [SERVER_EVENT.FORWARD_REQUEST]: {
    origin: string;
    target: string;
  };
  [SERVER_EVENT.FORWARD_RESPONSE]: {
    origin: string;
    target: string;
    code: SHAKE_HANDS;
    reason?: string;
  };
  [SERVER_EVENT.FORWARD_UNPEER]: {
    origin: string;
    target: string;
  };
  [SERVER_EVENT.FORWARD_MESSAGE]: {
    origin: string;
    target: string;
    message: SocketMessageType;
  };
}

export type CallBackState = { code: ERROR_TYPE; message: string };
export type ClientFn<T extends ClientEventKeys> = (
  payload: SocketEventParams[T],
  callback?: (state: CallBackState) => void
) => void;
export type ClientHandler = { [K in ClientEventKeys]: ClientFn<K> };
export type ServerFn<T extends ServerEventKeys> = (
  payload: SocketEventParams[T],
  callback?: (state: CallBackState) => void
) => void;
export type ServerHandler = { [K in ServerEventKeys]: ServerFn<K> };
