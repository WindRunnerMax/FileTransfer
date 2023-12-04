import { CLINT_EVENT, SERVER_EVENT, SocketEventParams } from "../../types/signaling";
import { SignalingServer } from "./signaling";
import { WebRTCInstanceOptions } from "../../types/webrtc";

export class WebRTCInstance {
  public readonly id: string;
  public readonly channel: RTCDataChannel;
  public readonly connection: RTCPeerConnection;
  private readonly signaling: SignalingServer;
  constructor(options: WebRTCInstanceOptions) {
    const connection = new RTCPeerConnection({
      // https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
      iceServers: options.ice
        ? [{ urls: options.ice }]
        : [{ urls: "stun:stun.l.google.com:19302" }],
    });
    this.id = options.id;
    this.signaling = options.signaling;
    console.log("Client WebRTC ID:", this.id);
    this.signaling.on(SERVER_EVENT.FORWARD_OFFER, this.onReceiveOffer);
    this.signaling.on(SERVER_EVENT.FORWARD_ANSWER, this.onReceiveAnswer);
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
  }

  public createRemoteConnection = async (target: string) => {
    console.log("Send Offer To:", target);
    this.connection.onicecandidate = async event => {
      if (event.candidate) {
        const sdp = JSON.stringify(this.connection.localDescription);
        console.log("Offer sdp", event.candidate);
        if (sdp) {
          const payload = { origin: this.id, sdp: sdp, target };
          this.signaling.emit(CLINT_EVENT.SEND_OFFER, payload);
        }
      }
    };
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
  };

  private onReceiveOffer = async (params: SocketEventParams["FORWARD_OFFER"]) => {
    const { sdp, origin } = params;
    if (this.channel.readyState !== "connecting") return void 0;
    console.log("Receive Offer From:", origin);
    const offer = JSON.parse(sdp);
    this.connection.onicecandidate = async event => {
      if (event.candidate) {
        console.log("Send Answer To:", origin);
        const sdp = JSON.stringify(this.connection.localDescription);
        console.log("Answer SDP:", event.candidate);
        this.signaling.emit(CLINT_EVENT.SEND_ANSWER, {
          origin: this.id,
          sdp: sdp,
          target: origin,
        });
      }
    };
    await this.connection.setRemoteDescription(offer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
  };

  private onReceiveAnswer = async (params: SocketEventParams["FORWARD_ANSWER"]) => {
    const { sdp, origin } = params;
    console.log("Receive Answer From:", origin);
    const answer = JSON.parse(sdp);
    if (!this.connection.currentRemoteDescription) {
      this.connection.setRemoteDescription(answer);
    }
  };

  public destroy = () => {
    this.signaling.off(SERVER_EVENT.FORWARD_OFFER, this.onReceiveOffer);
    this.signaling.off(SERVER_EVENT.FORWARD_ANSWER, this.onReceiveAnswer);
    this.channel.close();
    this.connection.close();
  };
}
