import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import type { TransferEntry, TransferEntryFile, TransferFrom } from "../../types/transfer";
import { TRANSFER_TYPE } from "../../types/transfer";
import type { SignalService } from "./signal";
import type { WebRTCService } from "./webrtc";
import { atoms } from "../store/atoms";
import { Bind } from "@block-kit/utils";
import type { CallbackEvent, ServerEvent } from "../../types/signaling";
import { SERVER_EVENT } from "../../types/signaling";
import { WEBRTC_EVENT } from "../../types/webrtc";
import type { StoreService } from "./store";

export class MessageService {
  public readonly listAtom: PrimitiveAtom<TransferEntry[]>;

  constructor(
    private signal: SignalService,
    private rtc: WebRTCService,
    private store: StoreService
  ) {
    this.listAtom = atom<TransferEntry[]>([]);
    this.signal.socket.on("connect", this.onSignalConnected);
    this.signal.socket.on("disconnect", this.onSignalDisconnected);
    this.signal.on(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.on(SERVER_EVENT.SEND_ICE, this.onReceiveIce);
    this.signal.on(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
    this.signal.on(SERVER_EVENT.SEND_ERROR, this.onReceiveError);
    this.rtc.bus.on(WEBRTC_EVENT.STATE_CHANGE, this.onRTCStateChange);
    this.rtc.bus.on(WEBRTC_EVENT.CONNECTING, this.onConnecting);
  }

  public destroy() {
    this.signal.socket.off("connect", this.onSignalConnected);
    this.signal.socket.off("disconnect", this.onSignalDisconnected);
    this.signal.off(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.off(SERVER_EVENT.SEND_ICE, this.onReceiveIce);
    this.signal.off(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
    this.signal.off(SERVER_EVENT.SEND_ERROR, this.onReceiveError);
    this.rtc.bus.off(WEBRTC_EVENT.STATE_CHANGE, this.onRTCStateChange);
    this.rtc.bus.off(WEBRTC_EVENT.CONNECTING, this.onConnecting);
  }

  public addEntry(entry: TransferEntry) {
    const currentList = atoms.get(this.listAtom);
    const newList = [...currentList, entry];
    atoms.set(this.listAtom, newList);
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

  public clearEntries() {
    atoms.set(this.listAtom, []);
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
  private onConnecting() {
    const peerId = atoms.get(this.store.peerIdAtom);
    this.addSystemEntry(`WebRTC Connecting To ${peerId}`);
  }

  @Bind
  private onRTCStateChange() {
    const peerId = atoms.get(this.store.peerIdAtom);
    if (this.rtc.connection.connectionState === "disconnected") {
      this.addSystemEntry(`WebRTC ${peerId} Disconnected`);
    }
    if (this.rtc.connection.connectionState === "connected") {
      this.addSystemEntry(`WebRTC ${peerId} Connected`);
    }
    if (
      this.rtc.connection.connectionState === "failed" ||
      this.rtc.connection.connectionState === "closed"
    ) {
      this.addSystemEntry(`WebRTC ${peerId} Connection Failed`);
    }
  }

  @Bind
  private onReceiveOffer(params: ServerEvent["SEND_OFFER"]) {
    this.addSystemEntry(`Received ${params.from} RTC Offer`);
  }

  @Bind
  private onReceiveIce(params: ServerEvent["SEND_ICE"]) {
    this.addSystemEntry(`Received ${params.from} RTC ICE`);
  }

  @Bind
  private onReceiveAnswer(params: ServerEvent["SEND_ANSWER"]) {
    this.addSystemEntry(`Received ${params.from} RTC Answer`);
  }

  @Bind
  private onReceiveError(e: CallbackEvent) {
    this.addSystemEntry(e.message);
  }
}
