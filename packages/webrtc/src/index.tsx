import ReactDOM from "react-dom";
import { App } from "./components/app";
import "@arco-design/web-react/es/style/index.less";
import { drawingBackdrop } from "./components/canvas";
// import { WebRTC } from "./core/webrtc";
// import { SOCKET_EVENT_ENUM } from "./types/signaling";

// const connection = new WebRTC({ wss: location.host });
// connection.onOpen = v => console.log("On Channel Open", v);
// connection.onError = v => console.log("On Channel Error", v);
// connection.onMessage = v => document.write(v.data as string);

// connection.onReady = ({ signaling, rtc }) => {
//   signaling.socket.on(SOCKET_EVENT_ENUM.JOINED_ROOM, ({ id }) => {
//     console.log("JOIN_ROOM", id);
//   });

//   signaling.socket.on(SOCKET_EVENT_ENUM.JOINED_MEMBER, ({ initialization }) => {
//     console.log("JOINED_MEMBER", initialization);
//   });

//   signaling.socket.on(SOCKET_EVENT_ENUM.LEFT_ROOM, ({ id }) => {
//     console.log("LEAVE_ROOM", id);
//   });

//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-expect-error
//   window.rtc = rtc;
// };

window.addEventListener("DOMContentLoaded", drawingBackdrop);
ReactDOM.render(<App></App>, document.getElementById("root"));

// Reference
// https://github.com/RobinLinus/snapdrop
// https://github.com/wangrongding/frontend-park
