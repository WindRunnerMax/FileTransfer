import { rtc } from "./core/webrtc";
import { SOCKET_EVENT_ENUM } from "./types/signaling-event";

rtc.signaling.socket.on(SOCKET_EVENT_ENUM.JOINED_ROOM, ({ id, initialization }) => {
  console.log("JOIN ROOM", id, initialization);
  //  window.initialization = initialization;
});
rtc.signaling.socket.on(SOCKET_EVENT_ENUM.LEFT_ROOM, ({ id }) => {
  console.log("LEAVE ROOM", id);
});
rtc.onMessage(console.log);
// window.rtc = rtc;

// https://github.com/RobinLinus/snapdrop
// https://juejin.cn/post/6950234563683713037
// https://juejin.cn/post/7171836076246433799
// https://github.com/wangrongding/frontend-park
// https://developer.mozilla.org/zh-CN/docs/Web/API/WebRTC_API/Simple_RTCDataChannel_sample
