import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import type { TransferEntry } from "../../types/client";
import type { SignalService } from "./signal";
import type { AtomsService } from "./atoms";
import type { WebRTCService } from "./webrtc";

export class MessageService {
  public readonly listAtom: PrimitiveAtom<TransferEntry[]>;

  constructor(public signal: SignalService, public rtc: WebRTCService, public atoms: AtomsService) {
    this.listAtom = atom<TransferEntry[]>([]);
  }

  public addEntry(entry: TransferEntry) {
    const currentList = this.atoms.get(this.listAtom);
    const newList = [...currentList, entry];
    this.atoms.set(this.listAtom, newList);
  }

  public clearEntries() {
    this.atoms.set(this.listAtom, []);
  }
}
