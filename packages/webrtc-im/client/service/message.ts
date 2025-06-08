import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import type { TransferEntry, TransferEntryFile, TransferFrom } from "../../types/client";
import { TRANSFER_TYPE } from "../../types/client";
import type { SignalService } from "./signal";
import type { WebRTCService } from "./webrtc";
import { atoms } from "../store/atoms";
import { Bind } from "@block-kit/utils";
import { SERVER_EVENT } from "../../types/signaling";

export class MessageService {
  public readonly listAtom: PrimitiveAtom<TransferEntry[]>;

  constructor(public signal: SignalService, public rtc: WebRTCService) {
    this.listAtom = atom<TransferEntry[]>([]);
    this.rtc.onConnectionStateChange = this.onRTCStateChange;
    this.signal.socket.on("connect", this.onSignalConnected);
    this.signal.socket.on("disconnect", this.onSignalDisconnected);
    this.signal.on(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.on(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
  }

  public destroy() {
    this.rtc.onConnectionStateChange = void 0;
    this.signal.socket.off("connect", this.onSignalConnected);
    this.signal.socket.off("disconnect", this.onSignalDisconnected);
    this.signal.off(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.off(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
  }

  public addEntry(entry: TransferEntry) {
    const currentList = atoms.get(this.listAtom);
    const newList = [...currentList, entry];
    atoms.set(this.listAtom, newList);
  }

  public clearEntries() {
    atoms.set(this.listAtom, []);
  }

  public addSystemEntry(data: string) {
    this.addEntry({ key: TRANSFER_TYPE.SYSTEM, data });
  }

  public addTextEntry(text: string, from: TransferFrom) {
    this.addEntry({ key: TRANSFER_TYPE.TEXT, data: text, from: from });
  }

  public addFileEntry(data: TransferEntryFile) {
    this.addEntry({ key: TRANSFER_TYPE.FILE, ...data });
  }

  @Bind
  private onSignalConnected() {
    this.addSystemEntry("Signal Connected");
  }

  @Bind
  private onSignalDisconnected() {
    this.addSystemEntry("Signal Disconnected");
  }

  @Bind
  private onRTCStateChange() {
    if (this.rtc.connection.connectionState === "disconnected") {
      this.addSystemEntry("WebRTC Disconnected");
    }
    if (this.rtc.connection.connectionState !== "connected") {
      this.addSystemEntry("WebRTC Connected");
    }
    if (
      this.rtc.connection.connectionState === "failed" ||
      this.rtc.connection.connectionState === "closed"
    ) {
      this.addSystemEntry("WebRTC Connection Failed");
    }
  }

  @Bind
  private onReceiveOffer() {
    this.addSystemEntry(`Received RTC Offer`);
  }

  @Bind
  private onReceiveAnswer() {
    this.addSystemEntry(`Received RTC Answer`);
  }
}
