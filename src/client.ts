class FileTransferChannel {
  private connection: RTCPeerConnection;
  private channel: RTCDataChannel;
  constructor() {
    const connection = new RTCPeerConnection();
    const channel = connection.createDataChannel("FileTransfer", {
      ordered: true, // 保证传输顺序
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

export const channel = new FileTransferChannel();
