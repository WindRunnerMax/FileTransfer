import type { DeviceType, MessageType } from "./client";
import type { ErrorType, ShakeHands } from "./server";

const CLINT_EVENT_BASE = [
  "JOIN_ROOM",
  "LEAVE_ROOM",
  "SEND_REQUEST",
  "SEND_RESPONSE",
  "SEND_UNPEER",
  "SEND_MESSAGE",
] as const;

const SERVER_EVENT_BASE = [
  "JOINED_ROOM",
  "JOINED_MEMBER",
  "LEFT_ROOM",
  "FORWARD_REQUEST",
  "FORWARD_RESPONSE",
  "FORWARD_UNPEER",
  "FORWARD_MESSAGE",
] as const;

export const CLINT_EVENT = CLINT_EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in ClientEventKeys]: K }
);

export const SERVER_EVENT = SERVER_EVENT_BASE.reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {} as { [K in ServerEventKeys]: K }
);

export type ClientFn<T extends ClientEventKeys> = (
  payload: SocketEventParams[T],
  callback?: (state: CallBackState) => void
) => void;
export type ClientEventKeys = typeof CLINT_EVENT_BASE[number];
export type ClientHandler = { [K in ClientEventKeys]: ClientFn<K> };

export type ServerFn<T extends ServerEventKeys> = (
  payload: SocketEventParams[T],
  callback?: (state: CallBackState) => void
) => void;
export type ServerEventKeys = typeof SERVER_EVENT_BASE[number];
export type CallBackState = { code: ErrorType; message: string };
export type ServerHandler = { [K in ServerEventKeys]: ServerFn<K> };

export interface SocketEventParams {
  // CLIENT
  [CLINT_EVENT.JOIN_ROOM]: {
    id: string;
    device: DeviceType;
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
    code: ShakeHands;
    reason?: string;
  };
  [CLINT_EVENT.SEND_UNPEER]: {
    origin: string;
    target: string;
  };
  [CLINT_EVENT.SEND_MESSAGE]: {
    origin: string;
    target: string;
    message: MessageType;
  };

  // SERVER
  [SERVER_EVENT.JOINED_ROOM]: {
    id: string;
    device: DeviceType;
  };
  [SERVER_EVENT.JOINED_MEMBER]: {
    initialization: {
      id: string;
      device: DeviceType;
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
    code: ShakeHands;
    reason?: string;
  };
  [SERVER_EVENT.FORWARD_UNPEER]: {
    origin: string;
    target: string;
  };
  [SERVER_EVENT.FORWARD_MESSAGE]: {
    origin: string;
    target: string;
    message: MessageType;
  };
}
