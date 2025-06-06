import type { O } from "@block-kit/utils/dist/es/types";
import type { DeviceType } from "./client";

/** 客户端发起的消息 */
export const CLINT_EVENT = {
  JOIN_ROOM: "JOIN_ROOM",
  LEAVE_ROOM: "LEAVE_ROOM",
  SEND_OFFER: "SEND_OFFER",
  SEND_ANSWER: "SEND_ANSWER",
  SEND_ICE: "SEND_ICE",
} as const;

/** 服务端发起的消息 */
export const SERVER_EVENT = {
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
};

export type ServerEvent = {
  [SERVER_EVENT.JOIN_ROOM]: ServerJoinRoomEvent;
  [SERVER_EVENT.LEAVE_ROOM]: ServerLeaveRoomEvent;
  [SERVER_EVENT.SEND_OFFER]: ServerSendOfferEvent;
  [SERVER_EVENT.SEND_ANSWER]: ServerSendAnswerEvent;
  [SERVER_EVENT.SEND_ICE]: ServerSendIceEvent;
  [SERVER_EVENT.SEND_ERROR]: ErrorEvent;
};

export type IceSDP = RTCSessionDescriptionInit;
export type ClientEventKeys = O.Keys<ClientEvent>;
export type ClientJoinRoomEvent = { device: DeviceType };
export type ClientLeaveRoomEvent = { id: string };
export type ClientSendOfferEvent = { from: string; to: string; sdp: IceSDP };
export type ClientSendAnswerEvent = { from: string; to: string; sdp: IceSDP };
export type ClientSendIceEvent = { from: string; to: string; sdp: IceSDP };

export type ServerEventKeys = O.Keys<ServerEvent>;
export type ServerJoinRoomEvent = { id: string; device: DeviceType; self: boolean; ip: string };
export type ServerLeaveRoomEvent = { id: string };
export type ServerSendOfferEvent = { from: string; to: string; sdp: IceSDP };
export type ServerSendAnswerEvent = { from: string; to: string; sdp: IceSDP };
export type ServerSendIceEvent = { from: string; to: string; sdp: IceSDP };

export type ClientFunc<T extends ClientEventKeys> = (
  payload: ClientEvent[T],
  callback?: (state: ErrorEvent) => void
) => void;

export type ServerFunc<T extends ServerEventKeys> = (
  payload: ServerEvent[T],
  callback?: (state: ErrorEvent) => void
) => void;

export type ErrorEvent = { code: number; message: string };
export type ClientHandler = { [K in ClientEventKeys]: ClientFunc<K> };
export type ServerHandler = { [K in ServerEventKeys]: ServerFunc<K> };
