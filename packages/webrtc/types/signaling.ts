import type { DeviceType } from "./client";
import type { ErrorType } from "./server";

const CLINT_EVENT_BASE = [
  "JOIN_ROOM",
  "LEAVE_ROOM",
  "SEND_OFFER",
  "SEND_ANSWER",
  "SEND_ICE",
  "SEND_ERROR",
] as const;

const SERVER_EVENT_BASE = [
  "JOINED_ROOM",
  "JOINED_MEMBER",
  "LEFT_ROOM",
  "FORWARD_OFFER",
  "FORWARD_ANSWER",
  "FORWARD_ICE",
  "NOTIFY_ERROR",
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
export type CallBackState = { code: number; message: string };
export type ClientHandler = { [K in ClientEventKeys]: ClientFn<K> };

export type ServerFn<T extends ServerEventKeys> = (
  payload: SocketEventParams[T],
  callback?: (state: CallBackState) => void
) => void;
export type ServerEventKeys = typeof SERVER_EVENT_BASE[number];
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
  [CLINT_EVENT.SEND_OFFER]: {
    origin: string;
    target: string;
    offer: RTCSessionDescriptionInit;
  };
  [CLINT_EVENT.SEND_ANSWER]: {
    origin: string;
    target: string;
    answer: RTCSessionDescriptionInit;
  };
  [CLINT_EVENT.SEND_ICE]: {
    origin: string;
    target: string;
    ice: RTCIceCandidateInit;
  };
  [CLINT_EVENT.SEND_ERROR]: {
    origin: string;
    target: string;
    code: ErrorType;
    message: string;
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
  [SERVER_EVENT.FORWARD_OFFER]: {
    origin: string;
    target: string;
    offer: RTCSessionDescriptionInit;
  };
  [SERVER_EVENT.FORWARD_ANSWER]: {
    origin: string;
    target: string;
    answer: RTCSessionDescriptionInit;
  };
  [SERVER_EVENT.FORWARD_ICE]: {
    origin: string;
    target: string;
    ice: RTCIceCandidateInit;
  };
  [SERVER_EVENT.NOTIFY_ERROR]: {
    code: ErrorType;
    message: string;
  };
}
