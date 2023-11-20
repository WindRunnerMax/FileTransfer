import { rtc } from "./core/webrtc";
import { SOCKET_EVENT_ENUM } from "./types/signaling-event";

rtc.signaling.socket.on(SOCKET_EVENT_ENUM.JOINED_ROOM, ({ id }) => {
  console.log("JOIN_ROOM", id);
});
rtc.signaling.socket.on(SOCKET_EVENT_ENUM.JOINED_MEMBER, ({ initialization }) => {
  console.log("JOINED_MEMBER", initialization);
});
rtc.signaling.socket.on(SOCKET_EVENT_ENUM.LEFT_ROOM, ({ id }) => {
  console.log("LEAVE_ROOM", id);
});
rtc.onOpen(v => console.log("On Channel Open", v));
rtc.onClose(v => console.log("On Channel Close", v));
rtc.onError(v => console.log("On Channel Error", v));
rtc.onMessage(v => console.log("On Channel Message", v));

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.rtc = rtc;

// https://github.com/RobinLinus/snapdrop
// https://juejin.cn/post/6950234563683713037
// https://juejin.cn/post/7171836076246433799
// https://github.com/wangrongding/frontend-park
// https://socket.io/zh-CN/docs/v4/server-socket-instance/
// https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/createDataChannel
// https://developer.mozilla.org/zh-CN/docs/Web/API/WebRTC_API/Simple_RTCDataChannel_sample
