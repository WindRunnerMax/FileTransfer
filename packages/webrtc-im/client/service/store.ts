import { atom } from "jotai";
import type { NetType } from "../../types/client";
import { NET_TYPE } from "../../types/client";
import type { ServerJoinRoomEvent } from "../../types/signaling";

export class StoreService {
  /** 列表页网络 Tab */
  public netTypeAtom = atom<NetType>(NET_TYPE.LAN);
  /** 匹配的 UserId */
  public peerIdAtom = atom<string>("");
  /** 用户列表 */
  public userListAtom = atom<ServerJoinRoomEvent>([]);
}
