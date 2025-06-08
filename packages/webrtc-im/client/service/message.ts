import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import type { TransferEntry } from "../../types/client";
import type { SignalService } from "./signal";
import type { WebRTCService } from "./webrtc";
import { atoms } from "../store/atoms";

export class MessageService {
  public readonly listAtom: PrimitiveAtom<TransferEntry[]>;

  constructor(public signal: SignalService, public rtc: WebRTCService) {
    this.listAtom = atom<TransferEntry[]>([]);
  }

  public addEntry(entry: TransferEntry) {
    const currentList = atoms.get(this.listAtom);
    const newList = [...currentList, entry];
    atoms.set(this.listAtom, newList);
  }

  public clearEntries() {
    atoms.set(this.listAtom, []);
  }
}
