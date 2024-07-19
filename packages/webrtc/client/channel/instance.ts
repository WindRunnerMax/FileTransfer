import { CLINT_EVENT, SERVER_EVENT, SocketEventParams } from "../../types/signaling";
import { SignalingServer } from "./signaling";
import { WebRTCInstanceOptions } from "../../types/webrtc";
import { ERROR_TYPE } from "../../types/server";

export class WebRTCInstance {
  public readonly id: string;
  public readonly channel: RTCDataChannel;
  public readonly connection: RTCPeerConnection;
  private readonly signaling: SignalingServer;
  constructor(options: WebRTCInstanceOptions) {
    const RTCPeerConnection =
      // @ts-expect-error RTCPeerConnection
      window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    const connection = new RTCPeerConnection({
      // https://icetest.info/
      // https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
      iceServers: options.ice
        ? [{ urls: options.ice }]
        : [{ urls: ["stun:stunserver.stunprotocol.org:3478", "stun:stun.l.google.com:19302"] }],
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
      // @ts-expect-error RTCErrorEvent
      channel.onerror = options.onError || null;
      channel.onclose = options.onClose || null;
    };
    this.connection.onconnectionstatechange = () => {
      options.onConnectionStateChange(connection);
    };
    this.signaling.on(SERVER_EVENT.FORWARD_OFFER, this.onReceiveOffer);
    this.signaling.on(SERVER_EVENT.FORWARD_ICE, this.onReceiveIce);
    this.signaling.on(SERVER_EVENT.FORWARD_ANSWER, this.onReceiveAnswer);
  }

  public createRemoteConnection = async (target: string) => {
    console.log("Send Offer To:", target);
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
