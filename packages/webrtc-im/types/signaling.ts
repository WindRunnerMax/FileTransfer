import type { O } from "@block-kit/utils/dist/es/types";
import type { DeviceType } from "./client";

/** 客户端发起的消息 */
export const CLINT_EVENT = {
  JOIN_ROOM: "JOIN_ROOM",
  LEAVE_ROOM: "LEAVE_ROOM",
  SEND_OFFER: "SEND_OFFER",
  SEND_ANSWER: "SEND_ANSWER",
  SEND_ICE: "SEND_ICE",
  SEND_ERROR: "SEND_ERROR",
} as const;

/** 服务端发起的消息 */
export const SERVER_EVENT = {
  INIT_USER: "INIT_USER",
  JOIN_ROOM: "JOIN_ROOM",
  LEAVE_ROOM: "LEAVE_ROOM",
  SEND_OFFER: "SEND_OFFER",
  SEND_ANSWER: "SEND_ANSWER",
  SEND_ICE: "SEND_ICE",
  SEND_ERROR: "SEND_ERROR",
} as const;

export type ClientEvent = {
  [CLINT_EVENT.JOIN_ROOM]: ClientJoinRoomEvent;
  [CLINT_EVENT.LEAVE_ROOM]: ClientLeaveRoomEvent;
  [CLINT_EVENT.SEND_OFFER]: ClientSendOfferEvent;
  [CLINT_EVENT.SEND_ANSWER]: ClientSendAnswerEvent;
  [CLINT_EVENT.SEND_ICE]: ClientSendIceEvent;
  [SERVER_EVENT.SEND_ERROR]: ClientSendError;
};

export type ServerEvent = {
  [SERVER_EVENT.INIT_USER]: ServerJoinRoomEvent[number];
  [SERVER_EVENT.JOIN_ROOM]: ServerJoinRoomEvent;
  [SERVER_EVENT.LEAVE_ROOM]: ServerLeaveRoomEvent;
  [SERVER_EVENT.SEND_OFFER]: ServerSendOfferEvent;
  [SERVER_EVENT.SEND_ANSWER]: ServerSendAnswerEvent;
  [SERVER_EVENT.SEND_ICE]: ServerSendIceEvent;
  [SERVER_EVENT.SEND_ERROR]: CallbackEvent;
};

export type ICE = RTCIceCandidate;
export type SDP = RTCSessionDescriptionInit;
export type ClientEventKeys = O.Keys<ClientEvent>;
export type ClientJoinRoomEvent = { device: DeviceType };
export type ClientLeaveRoomEvent = { id: string };
export type ClientSendOfferEvent = { to: string; sdp: SDP };
export type ClientSendAnswerEvent = { to: string; sdp: SDP };
export type ClientSendIceEvent = { to: string; ice: ICE };
export type ClientSendError = { to: string } & CallbackEvent;

export type ServerEventKeys = O.Keys<ServerEvent>;
export type ServerJoinRoomEvent = { id: string; device: DeviceType; ip: string; hash: string }[];
export type ServerLeaveRoomEvent = { id: string };
export type ServerSendOfferEvent = { from: string; to: string; sdp: SDP };
export type ServerSendAnswerEvent = { from: string; to: string; sdp: SDP };
export type ServerSendIceEvent = { from: string; to: string; ice: ICE };

export type ClientFunc<T extends ClientEventKeys> = (
  payload: ClientEvent[T],
  callback?: (state: CallbackEvent) => void
) => void;

export type ServerFunc<T extends ServerEventKeys> = (
  payload: ServerEvent[T],
  callback?: (state: CallbackEvent) => void
) => void;

export type CallbackEvent = { code: number; message: string };
export type ClientHandler = { [K in ClientEventKeys]: ClientFunc<K> };
export type ServerHandler = { [K in ServerEventKeys]: ServerFunc<K> };
