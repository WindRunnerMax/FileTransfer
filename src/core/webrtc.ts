import { getUniqueId } from "laser-utils";
import { SOCKET_EVENT_ENUM, SocketEventParams } from "../types/signaling-event";
import { SignalingServer } from "./signaling";

class FileTransferChannel {
  readonly id: string;
  private sdp: string | null = null;
  public readonly connection: RTCPeerConnection;
  public readonly channel: RTCDataChannel;
  public readonly signaling: SignalingServer;
  constructor() {
    const connection = new RTCPeerConnection({
      iceServers: [
        // 开放的`stun`服务器
        { urls: "stun:stun.counterpath.net:3478" },
        { urls: "stun:stun.stunprotocol.org" },
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });
    this.id = getUniqueId();
    console.log("Client WebRTC ID:", this.id);
    this.signaling = new SignalingServer(this.id);
    this.signaling.socket.on(SOCKET_EVENT_ENUM.FORWARD_OFFER, this.onReceiveOffer);
    this.signaling.socket.on(SOCKET_EVENT_ENUM.FORWARD_ANSWER, this.onReceiveAnswer);
    const channel = connection.createDataChannel("FileTransfer", {
      ordered: true, // 保证传输顺序
      maxRetransmits: 50, // 最大重传次数
      negotiated: true, // 双向通信 // 不需要等待`offer`端的`ondatachannel`事件
      id: 777, // 通道id
    });
    this.channel = channel;
    this.connection = connection;
  }

  createRemoteConnection = async (target: string) => {
    console.log("Send Offer To:", target);
    if (this.sdp) {
      this.signaling.socket.emit(SOCKET_EVENT_ENUM.SEND_OFFER, {
        origin: this.id,
        sdp: this.sdp,
        target,
      });
    }
    this.connection.onicecandidate = async event => {
      if (event.candidate) {
        this.sdp = JSON.stringify(this.connection.localDescription);
        if (this.sdp) {
          this.signaling.socket.emit(SOCKET_EVENT_ENUM.SEND_OFFER, {
            origin: this.id,
            sdp: this.sdp,
            target,
          });
        }
      }
    };
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
  };

  onReceiveOffer = async (params: SocketEventParams["FORWARD_OFFER"]) => {
    const { sdp, origin } = params;
    console.log("Receive Offer From:", origin);
    const offer = JSON.parse(sdp);
    this.connection.onicecandidate = async event => {
      if (event.candidate) {
        this.signaling.socket.emit(SOCKET_EVENT_ENUM.SEND_ANSWER, {
          origin: this.id,
          sdp: JSON.stringify(this.connection.localDescription),
          target: origin,
        });
      }
    };
    await this.connection.setRemoteDescription(offer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
  };

  onReceiveAnswer = async (params: SocketEventParams["FORWARD_ANSWER"]) => {
    const { sdp, origin } = params;
    console.log("Receive Answer From:", origin);
    const answer = JSON.parse(sdp);
    if (!this.connection.currentRemoteDescription) {
      this.connection.setRemoteDescription(answer);
    }
  };

  onOpen = (callback: (this: RTCDataChannel, event: Event) => void) => {
    this.channel.onopen = callback;
  };

  onMessage = (callback: (this: RTCDataChannel, event: MessageEvent) => void) => {
    this.channel.onmessage = callback;
  };

  onError = (callback: (this: RTCDataChannel, event: Event) => void) => {
    this.channel.onerror = callback;
  };

  onClose = (callback: (this: RTCDataChannel, event: Event) => void) => {
    this.channel.onclose = callback;
  };

  destroy = () => {
    this.channel.close();
    this.connection.close();
    this.signaling.destroy();
  };
}

export const rtc = new FileTransferChannel();
