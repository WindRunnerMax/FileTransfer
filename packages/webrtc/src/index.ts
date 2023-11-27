import { WebRTCConnection } from "./core/connection";
import { SOCKET_EVENT_ENUM } from "./types/signaling";

const connection = new WebRTCConnection({ wss: location.host });
connection.onOpen = v => console.log("On Channel Open", v);
connection.onError = v => console.log("On Channel Error", v);
connection.onMessage = v => document.write(v.data as string);

connection.onReady = ({ rtc, signaling }) => {
  signaling.socket.on(SOCKET_EVENT_ENUM.JOINED_ROOM, ({ id }) => {
    console.log("JOIN_ROOM", id);
  });

  signaling.socket.on(SOCKET_EVENT_ENUM.JOINED_MEMBER, ({ initialization }) => {
    console.log("JOINED_MEMBER", initialization);
  });

  signaling.socket.on(SOCKET_EVENT_ENUM.LEFT_ROOM, ({ id }) => {
    console.log("LEAVE_ROOM", id);
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  window.rtc = rtc;
};

// WebRTC -> CodeSandbox/CloudFlare
// WebSocket -> LocalHost

// Reference
// https://github.com/RobinLinus/snapdrop
// https://github.com/wangrongding/frontend-park
