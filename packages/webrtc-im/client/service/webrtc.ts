import type { PrimitiveAtom } from "jotai";
import { atom } from "jotai";
import type { ConnectionState } from "../../types/client";
import { CONNECTION_STATE } from "../../types/client";
import type { PromiseWithResolve } from "../utils/connection";
import { createConnectReadyPromise } from "../utils/connection";
import type { SignalService } from "./signal";
import type { ServerEvent } from "../../types/signaling";
import { CLINT_EVENT, SERVER_EVENT } from "../../types/signaling";
import { Bind } from "@block-kit/utils";
import { ERROR_CODE } from "../../types/server";
import { atoms } from "../store/atoms";
import { EventBus } from "../utils/event-bus";
import type { WebRTCEvent } from "../../types/webrtc";
import { WEBRTC_EVENT } from "../../types/webrtc";

export class WebRTCService {
  /** 连接状态 */
  public readonly stateAtom: PrimitiveAtom<ConnectionState>;
  /** 链接状态 Promise */
  private connectedPromise: PromiseWithResolve<void> | null;
  /** 数据传输信道 */
  public channel: RTCDataChannel;
  /** RTC 连接实例 */
  public connection: RTCPeerConnection;
  /** 事件总线 */
  public bus: EventBus<WebRTCEvent>;

  constructor(private signal: SignalService) {
    const rtc = this.createRTCPeerConnection();
    this.channel = rtc.channel;
    this.connection = rtc.connection;
    this.bus = new EventBus<WebRTCEvent>();
    this.connectedPromise = createConnectReadyPromise();
    this.stateAtom = atom<ConnectionState>(CONNECTION_STATE.READY);
    this.signal.on(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.on(SERVER_EVENT.SEND_ICE, this.onReceiveIce);
    this.signal.on(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
    this.signal.socket.on("disconnect", this.disconnect);
  }

  public destroy() {
    this.bus.clear();
    this.signal.destroy();
    this.connectedPromise = null;
    this.signal.off(SERVER_EVENT.SEND_OFFER, this.onReceiveOffer);
    this.signal.off(SERVER_EVENT.SEND_ICE, this.onReceiveIce);
    this.signal.off(SERVER_EVENT.SEND_ANSWER, this.onReceiveAnswer);
    this.signal.socket.off("disconnect", this.disconnect);
  }

  /**
   * 发起连接
   */
  public async connect(peerUserId: string) {
    atoms.set(this.stateAtom, CONNECTION_STATE.CONNECTING);
    this.bus.emit(WEBRTC_EVENT.CONNECTING, null);
    console.log("Send Offer To:", peerUserId);
    this.connection.onicecandidate = async event => {
      if (!event.candidate) return void 0;
      console.log("Local ICE", event.candidate);
      const payload = { ice: event.candidate, to: peerUserId };
      this.signal.emit(CLINT_EVENT.SEND_ICE, payload);
    };
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    console.log("Offer SDP", offer);
    const payload = { sdp: offer, to: peerUserId };
    this.signal.emit(CLINT_EVENT.SEND_OFFER, payload);
  }

  /**
   * 断开连接
   */
  @Bind
  public async disconnect() {
    this.channel?.close();
    this.connection.close();
    // 重新创建, 等待新的连接
    const rtc = this.createRTCPeerConnection();
    this.channel = rtc.channel;
    this.connection = rtc.connection;
    atoms.set(this.stateAtom, CONNECTION_STATE.READY);
  }

  /**
   * 等待连接
   */
  public isConnected() {
    if (!this.connectedPromise) return Promise.resolve();
    return this.connectedPromise;
  }

  private createRTCPeerConnection(ice?: string) {
    const RTCPeerConnection =
      // @ts-expect-error RTCPeerConnection
      window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    // https://icetest.info/
    // https://gist.github.com/mondain/b0ec1cf5f60ae726202e
    // https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
    const defaultIces: RTCIceServer[] = [
      {
        urls: [
          "stun:stun.services.mozilla.com",
          "stun:stunserver2024.stunprotocol.org",
          "stun:stun.l.google.com:19302",
        ],
      },
      {
        urls: ["turn:pairdrop.net:5349", "turns:turn.pairdrop.net:5349"],
        username: "qhyDYD7PmT1a",
        credential: "6uX4JSBdncNLmUmoGau97Ft",
      },
    ];
    const connection = new RTCPeerConnection({
      iceServers: ice ? [{ urls: ice }] : defaultIces,
    });
    const channel = connection.createDataChannel("file-transfer", {
      ordered: true, // 保证传输顺序
      maxRetransmits: 50, // 最大重传次数
    });
    connection.ondatachannel = event => {
      const channel = event.channel;
      channel.onopen = e => this.bus.emit(WEBRTC_EVENT.OPEN, e);
      channel.onmessage = e => this.bus.emit(WEBRTC_EVENT.MESSAGE, e);
      channel.onerror = e => this.bus.emit(WEBRTC_EVENT.ERROR, e as RTCErrorEvent);
      channel.onclose = e => this.bus.emit(WEBRTC_EVENT.CLOSE, e);
    };
    connection.onconnectionstatechange = () => {
      if (this.connection.connectionState === "connected") {
        atoms.set(this.stateAtom, CONNECTION_STATE.CONNECTED);
      }
      if (this.connection.connectionState === "connecting") {
        atoms.set(this.stateAtom, CONNECTION_STATE.CONNECTING);
      }
      if (
        this.connection.connectionState === "disconnected" ||
        this.connection.connectionState === "failed" ||
        this.connection.connectionState === "closed"
      ) {
        atoms.set(this.stateAtom, CONNECTION_STATE.READY);
      }
      this.bus.emit(WEBRTC_EVENT.STATE_CHANGE, this);
    };
    return { connection, channel };
  }

  @Bind
  private async onReceiveOffer(params: ServerEvent["SEND_OFFER"]) {
    const { sdp, from } = params;
    console.log("Receive Offer From:", from, sdp);
    if (this.connection.currentLocalDescription || this.connection.currentRemoteDescription) {
      this.signal.emit(CLINT_EVENT.SEND_ERROR, {
        to: from,
        code: ERROR_CODE.BUSY,
        message: `peer user ${this.signal.id} is busy`,
      });
      return void 0;
    }
    this.connection.onicecandidate = async event => {
      if (!event.candidate) return void 0;
      console.log("Local ICE", event.candidate);
      const payload = { from: this.signal.id, ice: event.candidate, to: from };
      this.signal.emit(CLINT_EVENT.SEND_ICE, payload);
    };
    await this.connection.setRemoteDescription(sdp);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    console.log("Answer SDP", answer);
    const payload = { from: this.signal.id, sdp: answer, to: from };
    this.signal.emit(CLINT_EVENT.SEND_ANSWER, payload);
  }

  @Bind
  private async onReceiveIce(params: ServerEvent["SEND_ICE"]) {
    const { ice: sdp, from } = params;
    console.log("Receive ICE From:", from, sdp);
    await this.connection.addIceCandidate(sdp);
  }

  @Bind
  private async onReceiveAnswer(params: ServerEvent["SEND_ANSWER"]) {
    const { sdp, from } = params;
    console.log("Receive Answer From:", from, sdp);
    if (!this.connection.currentRemoteDescription) {
      this.connection.setRemoteDescription(sdp);
    }
  }
}
