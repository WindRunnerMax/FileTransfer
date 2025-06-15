import { atom } from "jotai";
import type { NetType, Users } from "../../types/client";
import { NET_TYPE } from "../../types/client";

export class StoreService {
  /** 列表页网络 Tab */
  public netTypeAtom = atom<NetType>(NET_TYPE.LAN);
  /** 匹配的 UserId */
  public peerIdAtom = atom<string>("");
  /** 用户列表 */
  public userListAtom = atom<Users>([]);
}
