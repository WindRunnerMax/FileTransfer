import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import type { TransferEntry, TransferEventMap, TransferFrom } from "../../types/transfer";
import { TRANSFER_EVENT, TRANSFER_TYPE } from "../../types/transfer";
import type { SignalService } from "./signal";
import type { WebRTCService } from "./webrtc";
import { atoms } from "../store/atoms";
import { Bind, Scroll, sleep } from "@block-kit/utils";
import type { CallbackEvent, ServerEvent } from "../../types/signaling";
import { SERVER_EVENT } from "../../types/signaling";
import { WEBRTC_EVENT } from "../../types/webrtc";
import type { StoreService } from "./store";
import type { TransferService } from "./transfer";

export class MessageService {
  public scroll: HTMLDivElement | null;
  public readonly listAtom: PrimitiveAtom<TransferEntry[]>;

  constructor(
    private signal: SignalService,
    private rtc: WebRTCService,
    private store: StoreService,
    private transfer: TransferService
  ) {
    this.scroll = null;
    this.listAtom = atom<TransferEntry[]>([]);
    this.signal.socket.on("connect", this.onSignalConnected);
    this.signal.socket.on("disconnect", this.onSignalDisconnected);
    this.signal.bus.on(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.bus.on(SERVER_EVENT.SEND_ICE, this.onReceiveIce);
    this.signal.bus.on(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
    this.signal.bus.on(SERVER_EVENT.SEND_ERROR, this.onReceiveError);
    this.rtc.bus.on(WEBRTC_EVENT.STATE_CHANGE, this.onRTCStateChange);
    this.rtc.bus.on(WEBRTC_EVENT.CONNECTING, this.onConnecting);
    this.transfer.bus.on(TRANSFER_EVENT.TEXT, this.onTextMessage);
    this.transfer.bus.on(TRANSFER_EVENT.FILE_START, this.onFileStart);
    this.transfer.bus.on(TRANSFER_EVENT.FILE_PROCESS, this.onFileProcess);
  }

  public destroy() {
    this.signal.socket.off("connect", this.onSignalConnected);
    this.signal.socket.off("disconnect", this.onSignalDisconnected);
    this.signal.bus.off(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.bus.off(SERVER_EVENT.SEND_ICE, this.onReceiveIce);
    this.signal.bus.off(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
    this.signal.bus.off(SERVER_EVENT.SEND_ERROR, this.onReceiveError);
    this.rtc.bus.off(WEBRTC_EVENT.STATE_CHANGE, this.onRTCStateChange);
    this.rtc.bus.off(WEBRTC_EVENT.CONNECTING, this.onConnecting);
    this.transfer.bus.off(TRANSFER_EVENT.TEXT, this.onTextMessage);
    this.transfer.bus.off(TRANSFER_EVENT.FILE_START, this.onFileStart);
    this.transfer.bus.off(TRANSFER_EVENT.FILE_PROCESS, this.onFileProcess);
  }

  public addEntry(entry: TransferEntry) {
    const currentList = atoms.get(this.listAtom);
    const newList = [...currentList, entry];
    atoms.set(this.listAtom, newList);
  }

  public addSystemEntry(data: string) {
    this.addEntry({ key: TRANSFER_TYPE.SYSTEM, data });
    this.scroll && Scroll.scrollToBottom(this.scroll);
  }

  public async addTextEntry(text: string, from: TransferFrom) {
    this.addEntry({ key: TRANSFER_TYPE.TEXT, data: text, from: from });
    await sleep(10);
    this.scroll && Scroll.scrollToBottom(this.scroll);
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

  @Bind
  private async onTextMessage(event: TransferEventMap["TEXT"]) {
    const { data, from } = event;
    this.addTextEntry(data, from);
  }

  @Bind
  private async onFileStart(event: TransferEventMap["FILE_START"]) {
    const { id, name, size, from, process } = event;
    this.addEntry({ key: TRANSFER_TYPE.FILE, id, name, size, process, from });
    await sleep(10);
    this.scroll && Scroll.scrollToBottom(this.scroll);
  }

  @Bind
  private async onFileProcess(event: TransferEventMap["FILE_PROCESS"]) {
    const { id, process } = event;
    const list = [...atoms.get(this.listAtom)];
    const FILE_TYPE = TRANSFER_TYPE.FILE;
    const index = list.findIndex(it => it.key === FILE_TYPE && it.id === id);
    if (index > -1) {
      const node = list[index] as TransferEntry;
      list[index] = { ...node, process } as TransferEntry;
      atoms.set(this.listAtom, list);
    }
  }
}
