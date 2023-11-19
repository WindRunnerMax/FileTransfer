import { SOCKET_EVENT_ENUM, SocketEventParams } from "../types/signaling-event";
import { SignalingServer } from "./signaling";

class FileTransferChannel {
  id: string;
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
    this.signaling = new SignalingServer();
    this.id = this.signaling.socket.id;
    this.signaling.socket.on(SOCKET_EVENT_ENUM.FORWARD_OFFER, this.onReceiveOffer);
    this.signaling.socket.on(SOCKET_EVENT_ENUM.FORWARD_ANSWER, this.onReceiveAnswer);
    const channel = connection.createDataChannel("FileTransfer", {
      ordered: true, // 保证传输顺序
      maxRetransmits: 50, // 最大重传次数
    });
    this.channel = channel;
    this.connection = connection;
  }

  createRemoteConnection = async (target: string, sdp?: string) => {
    if (sdp) {
      this.signaling.socket.emit(SOCKET_EVENT_ENUM.SEND_OFFER, {
        origin: this.id,
        sdp,
        target,
      });
      return sdp;
    }
    this.connection.onicecandidate = async event => {
      if (event.candidate) {
        sdp = JSON.stringify(this.connection.localDescription);
        if (sdp) {
          this.signaling.socket.emit(SOCKET_EVENT_ENUM.SEND_OFFER, {
            origin: this.id,
            sdp,
            target,
          });
        }
      }
    };
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    return sdp;
  };

  onReceiveOffer = async (params: SocketEventParams["FORWARD_OFFER"]) => {
    const { sdp, origin } = params;
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
    const { sdp } = params;
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
