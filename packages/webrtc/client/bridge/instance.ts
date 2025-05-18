import type { SocketEventParams } from "../../types/signaling";
import { CLINT_EVENT, SERVER_EVENT } from "../../types/signaling";
import type { SignalingServer } from "./signaling";
import type { WebRTCInstanceOptions } from "../../types/webrtc";
import { ERROR_TYPE } from "../../types/server";

export class WebRTCInstance {
  /** 连接 id */
  public readonly id: string;
  /** 数据传输信道 */
  public readonly channel: RTCDataChannel;
  /** RTC 连接实例 */
  public readonly connection: RTCPeerConnection;
  /** 信令实例 */
  private readonly signaling: SignalingServer;
  /** 主动连接建立信号 */
  public ready: Promise<void>;
  /** 连接建立信号解析器 */
  private _resolver: () => void;

  constructor(options: WebRTCInstanceOptions) {
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
      iceServers: options.ice ? [{ urls: options.ice }] : defaultIces,
    });
    this.id = options.id;
    this.signaling = options.signaling;
    console.log("Client WebRTC ID:", this.id);
    const channel = connection.createDataChannel("FileTransfer", {
      ordered: true, // 保证传输顺序
      maxRetransmits: 50, // 最大重传次数
    });
    this.channel = channel;
    this.connection = connection;
    this.connection.ondatachannel = event => {
      const channel = event.channel;
      channel.onopen = options.onOpen || null;
      channel.onmessage = options.onMessage || null;
      channel.onerror = options.onError || null;
      channel.onclose = options.onClose || null;
    };
    this._resolver = () => null;
    this.ready = new Promise(r => (this._resolver = r));
    this.connection.onconnectionstatechange = () => {
      if (this.connection.connectionState === "connected") {
        this._resolver();
      }
      options.onConnectionStateChange(connection);
    };
    this.signaling.on(SERVER_EVENT.FORWARD_OFFER, this.onReceiveOffer);
    this.signaling.on(SERVER_EVENT.FORWARD_ICE, this.onReceiveIce);
    this.signaling.on(SERVER_EVENT.FORWARD_ANSWER, this.onReceiveAnswer);
  }

  public createRemoteConnection = async (target: string) => {
    console.log("Send Offer To:", target);
    this.ready = new Promise(r => (this._resolver = r));
    this.connection.onicecandidate = async event => {
      if (!event.candidate) return void 0;
      console.log("Local ICE", event.candidate);
      const payload = { origin: this.id, ice: event.candidate, target };
      this.signaling.emit(CLINT_EVENT.SEND_ICE, payload);
    };
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    console.log("Offer SDP", offer);
    const payload = { origin: this.id, offer, target };
    this.signaling.emit(CLINT_EVENT.SEND_OFFER, payload);
  };

  private onReceiveOffer = async (params: SocketEventParams["FORWARD_OFFER"]) => {
    const { offer, origin } = params;
    console.log("Receive Offer From:", origin, offer);
    if (this.connection.currentLocalDescription || this.connection.currentRemoteDescription) {
      this.signaling.emit(CLINT_EVENT.SEND_ERROR, {
        origin: this.id,
        target: origin,
        code: ERROR_TYPE.PEER_BUSY,
        message: `Peer ${this.id} is Busy`,
      });
      return void 0;
    }
    this.connection.onicecandidate = async event => {
      if (!event.candidate) return void 0;
      console.log("Local ICE", event.candidate);
      const payload = { origin: this.id, ice: event.candidate, target: origin };
      this.signaling.emit(CLINT_EVENT.SEND_ICE, payload);
    };
    await this.connection.setRemoteDescription(offer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    console.log("Answer SDP", answer);
    const payload = { origin: this.id, answer, target: origin };
    this.signaling.emit(CLINT_EVENT.SEND_ANSWER, payload);
  };

  private onReceiveIce = async (params: SocketEventParams["FORWARD_ICE"]) => {
    const { ice, origin } = params;
    console.log("Receive ICE From:", origin, ice);
    await this.connection.addIceCandidate(ice);
  };

  private onReceiveAnswer = async (params: SocketEventParams["FORWARD_ANSWER"]) => {
    const { answer, origin } = params;
    console.log("Receive Answer From:", origin, answer);
    if (!this.connection.currentRemoteDescription) {
      this.connection.setRemoteDescription(answer);
    }
  };

  public destroy = () => {
    this.signaling.off(SERVER_EVENT.FORWARD_OFFER, this.onReceiveOffer);
    this.signaling.off(SERVER_EVENT.FORWARD_ICE, this.onReceiveIce);
    this.signaling.off(SERVER_EVENT.FORWARD_ANSWER, this.onReceiveAnswer);
    this.channel.close();
    this.connection.close();
  };
}
