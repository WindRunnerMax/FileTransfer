import { WebRTCConnectionCallback, WebRTCConnectionOptions } from "../types/webrtc";
import { WebRTC } from "./webrtc";
import { SignalingServer } from "../core/signaling";

export class WebRTCConnection {
  private rtc: WebRTC | null = null;
  private signaling: SignalingServer;
  public onReady: WebRTCConnectionCallback = () => void 0;
  constructor(private options: WebRTCConnectionOptions) {
    this.signaling = new SignalingServer(options.wss);
    this.signaling.socket.on("connect", this.onConnection);
  }

  private onConnection = () => {
    this.rtc = new WebRTC({
      id: this.signaling.socket.id,
      signaling: this.signaling,
      ice: this.options.ice,
    });
    this.onReady({ rtc: this.rtc, signaling: this.signaling });
  };

  public destroy = () => {
    this.signaling.socket.off("connect", this.onConnection);
    this.signaling.destroy();
    this.rtc && this.rtc.destroy();
  };
}
