import { WebRTCConnectionCallback, WebRTCConnectionOptions } from "../types/webrtc";
import { WebRTC } from "./webrtc";
import { SignalingServer } from "../core/signaling";

export class WebRTCConnection {
  private rtc: WebRTC | null = null;
  private signaling: SignalingServer;
  public onReady: WebRTCConnectionCallback = () => void 0;
  constructor(options: WebRTCConnectionOptions) {
    this.signaling = new SignalingServer(options.wss);
    this.signaling.socket.on("connect", this.onConnection);
  }

  private onConnection = () => {
    if (!this.rtc) {
      this.rtc = new WebRTC({ id: this.signaling.socket.id, signaling: this.signaling });
    }
    this.onReady({ rtc: this.rtc, signaling: this.signaling });
  };

  public destroy = () => {
    this.signaling.socket.off("connect", this.onConnection);
    this.signaling.destroy();
    this.rtc && this.rtc.destroy();
  };
}
