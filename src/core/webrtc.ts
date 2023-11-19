import { SignalingServer } from "./signaling";

class FileTransferChannel {
  public connection: RTCPeerConnection;
  public channel: RTCDataChannel;
  constructor() {
    const connection = new RTCPeerConnection({
      iceServers: [
        // 开放的`stun`服务器
        { urls: "stun:stun.counterpath.net:3478" },
        { urls: "stun:stun.stunprotocol.org" },
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });
    new SignalingServer(connection);
    const channel = connection.createDataChannel("FileTransfer", {
      ordered: true, // 保证传输顺序
      maxRetransmits: 50, // 最大重传次数
      negotiated: true, // 双向通信
    });
    this.channel = channel;
    this.connection = connection;
  }

  onOpen(callback: (this: RTCDataChannel, event: Event) => void) {
    this.channel.onopen = callback;
  }

  onMessage(callback: (this: RTCDataChannel, event: MessageEvent) => void) {
    this.channel.onmessage = callback;
  }

  onError(callback: (this: RTCDataChannel, event: Event) => void) {
    this.channel.onerror = callback;
  }

  onClose(callback: (this: RTCDataChannel, event: Event) => void) {
    this.channel.onclose = callback;
  }

  destroy() {
    this.channel.close();
    this.connection.close();
  }
}

export const rtc = new FileTransferChannel();
