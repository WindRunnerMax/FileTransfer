import io, { Socket } from "socket.io-client";
import { SOCKET_EVENT_ENUM, SocketEventParams, SocketHandler } from "../types/event";

export class SignalingServer {
  private sdp: string | null = null;
  private socket: Socket<SocketHandler, SocketHandler>;
  constructor(private rtc: RTCPeerConnection) {
    const socket = io("http://localhost:3000");
    this.socket = socket;
    this.socket.on("connect", this.onConnect);
    this.socket.on(SOCKET_EVENT_ENUM.JOINED_ROOM, this.onJoinedRoom);
  }

  private onConnect() {
    this.socket.emit(SOCKET_EVENT_ENUM.JOIN_ROOM, { id: this.socket.id });
  }

  private async onJoinedRoom({ id }: SocketEventParams["JOINED_ROOM"]) {
    if (this.sdp) {
      this.socket.emit(SOCKET_EVENT_ENUM.SEND_OFFER, { id, sdp: this.sdp });
      return void 0;
    }
    this.rtc.onicecandidate = async event => {
      if (event.candidate) {
        this.sdp = JSON.stringify(this.rtc.localDescription);
        if (this.sdp) {
          this.socket.emit(SOCKET_EVENT_ENUM.SEND_OFFER, { id, sdp: this.sdp });
        }
      }
    };
    const offer = await this.rtc.createOffer();
    await this.rtc.setLocalDescription(offer);
  }

  destroy() {
    this.socket.emit(SOCKET_EVENT_ENUM.LEAVE_ROOM, { id: this.socket.id });
    this.socket.close();
  }
}
