import { WebRTCConnectionCallback, WebRTCConnectionOptions } from "../types/webrtc";
import { WebRTC } from "./webrtc";
import { SignalingServer } from "../core/signaling";
import { getUniqueId } from "laser-utils";

export class WebRTCConnection {
  private readonly id: string;
  private rtc: WebRTC | null = null;
  private signaling: SignalingServer;
  public onReady: WebRTCConnectionCallback = () => void 0;
  constructor(options: WebRTCConnectionOptions) {
    // https://socket.io/docs/v4/server-socket-instance/#socketid
    this.id = getUniqueId(20);
    this.signaling = new SignalingServer(options.wss, this.id);
    this.signaling.socket.on("connect", this.onConnection);
  }

  private onConnection = () => {
    if (!this.rtc) {
      this.rtc = new WebRTC({ id: this.id, signaling: this.signaling });
    }
    this.onReady({ rtc: this.rtc, signaling: this.signaling });
  };

  public destroy = () => {
    this.signaling.socket.off("connect", this.onConnection);
    this.signaling.destroy();
    this.rtc && this.rtc.destroy();
  };
}

// Reference
// https://juejin.cn/post/6950234563683713037
// https://juejin.cn/post/7171836076246433799
